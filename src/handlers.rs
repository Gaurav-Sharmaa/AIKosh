//! HTTP handlers — Step 2B Batch 2: real SQL implementations.

use axum::extract::{Path, Query, State};
use axum::response::sse::{Event, Sse};
use axum::Json;
use futures::stream::Stream;
use std::convert::Infallible;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use crate::errors::AppError;
use crate::models::{
    Article, ArtifactCounts, ChatMessage, Dashboard, Dataset, DownloadCounts, ListQuery, Model,
    Organization, PythonChatRequest, PythonChatResponse, Sector, Toolkit, Tutorial,
    UpdateUserProfile, UseCase, User,
};
use crate::state::AppState;

// User identity is hardcoded until JWT auth lands in Step 4.
// All user-scoped reads/writes target this row.
const CURRENT_USER_ID: i64 = 1;

// =============================================================================
// HELPERS
// =============================================================================

/// Convert a comma-separated tag list (SQL GROUP_CONCAT output) to a Vec<String>.
fn parse_tags_csv(csv: Option<&str>) -> Vec<String> {
    match csv {
        Some(s) if !s.is_empty() => s.split(',').map(|t| t.trim().to_string()).collect(),
        _ => Vec::new(),
    }
}

/// Convert a free-form user search string into an FTS5 MATCH expression.
/// Splits on whitespace, wraps each token in double quotes, joins with AND.
/// "AI agriculture" -> r#""AI" AND "agriculture""#
/// This is safe against FTS5 syntax injection (e.g., user typing `"OR"` or `-`).
fn build_fts_query(input: &str) -> String {
    input
        .split_whitespace()
        .filter(|t| !t.is_empty())
        .map(|t| format!("\"{}\"", t.replace('"', "\"\"")))
        .collect::<Vec<_>>()
        .join(" AND ")
}

/// Replace the internal `tags_csv` field in a serialized JSON object
/// with a real `tags: [...]` array.
fn dataset_to_json(d: Dataset) -> serde_json::Value {
    let tags = parse_tags_csv(d.tags_csv.as_deref());
    let mut v = serde_json::to_value(&d).unwrap_or(serde_json::json!({}));
    if let Some(obj) = v.as_object_mut() {
        obj.remove("tags_csv");
        obj.insert("tags".to_string(), serde_json::json!(tags));
    }
    v
}

fn model_to_json(m: Model) -> serde_json::Value {
    let tags = parse_tags_csv(m.tags_csv.as_deref());
    let mut v = serde_json::to_value(&m).unwrap_or(serde_json::json!({}));
    if let Some(obj) = v.as_object_mut() {
        obj.remove("tags_csv");
        obj.insert("tags".to_string(), serde_json::json!(tags));
    }
    v
}

fn usecase_to_json(u: UseCase) -> serde_json::Value {
    let tags = parse_tags_csv(u.tags_csv.as_deref());
    let mut v = serde_json::to_value(&u).unwrap_or(serde_json::json!({}));
    if let Some(obj) = v.as_object_mut() {
        obj.remove("tags_csv");
        obj.insert("tags".to_string(), serde_json::json!(tags));
    }
    v
}

// =============================================================================
// HEALTH
// =============================================================================

pub async fn health_check(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let counts: (i64, i64, i64) = sqlx::query_as(
        "SELECT
            (SELECT COUNT(*) FROM datasets WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM models   WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM usecases WHERE deleted_at IS NULL)",
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "status": "ok",
        "datasets": counts.0,
        "models": counts.1,
        "usecases": counts.2,
    })))
}

// =============================================================================
// DATASETS
// =============================================================================

pub async fn get_datasets(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = if let Some(search) = params.search.as_deref().filter(|s| !s.trim().is_empty()) {
        let fts = build_fts_query(search);
        sqlx::query_as::<_, Dataset>(
            r#"
            SELECT
                d.id, d.title, d.description, d.about_dataset, d.image_url,
                d.likes_count, d.downloads_count, d.views_count,
                o.name AS source_org,
                o.name AS source_organisation,
                s.name AS sector,
                s.slug AS sector_slug,
                u.full_name AS uploaded_by,
                d.license, d.geographical_coverage, d.author, d.data_quality_score,
                d.dataset_type, d.frequency, d.time_granularity, d.year_range,
                d.data_collected_at, d.visibility, d.hosted, d.data_type, d.data_collection_method,
                (SELECT GROUP_CONCAT(t.name)
                   FROM dataset_tags dt JOIN tags t ON t.id = dt.tag_id
                   WHERE dt.dataset_id = d.id) AS tags_csv
            FROM datasets d
            JOIN datasets_fts f ON f.rowid = d.id
            LEFT JOIN organizations o ON o.id = d.organization_id
            LEFT JOIN sectors s       ON s.id = d.sector_id
            LEFT JOIN users u         ON u.id = d.uploaded_by_user_id
            WHERE datasets_fts MATCH ?1
              AND d.deleted_at IS NULL
              AND (?2 IS NULL OR s.slug = ?2)
              AND (?3 IS NULL OR d.organization_id = ?3)
            ORDER BY rank
            "#,
        )
        .bind(fts)
        .bind(params.sector.as_deref())
        .bind(params.organization_id)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Dataset>(
            r#"
            SELECT
                d.id, d.title, d.description, d.about_dataset, d.image_url,
                d.likes_count, d.downloads_count, d.views_count,
                o.name AS source_org,
                o.name AS source_organisation,
                s.name AS sector,
                s.slug AS sector_slug,
                u.full_name AS uploaded_by,
                d.license, d.geographical_coverage, d.author, d.data_quality_score,
                d.dataset_type, d.frequency, d.time_granularity, d.year_range,
                d.data_collected_at, d.visibility, d.hosted, d.data_type, d.data_collection_method,
                (SELECT GROUP_CONCAT(t.name)
                   FROM dataset_tags dt JOIN tags t ON t.id = dt.tag_id
                   WHERE dt.dataset_id = d.id) AS tags_csv
            FROM datasets d
            LEFT JOIN organizations o ON o.id = d.organization_id
            LEFT JOIN sectors s       ON s.id = d.sector_id
            LEFT JOIN users u         ON u.id = d.uploaded_by_user_id
            WHERE d.deleted_at IS NULL
              AND (?1 IS NULL OR s.slug = ?1)
              AND (?2 IS NULL OR d.organization_id = ?2)
            ORDER BY d.id
            "#,
        )
        .bind(params.sector.as_deref())
        .bind(params.organization_id)
        .fetch_all(&state.db)
        .await?
    };

    let json: Vec<serde_json::Value> = rows.into_iter().map(dataset_to_json).collect();
    Ok(Json(serde_json::json!(json)))
}

pub async fn get_dataset_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Dataset>(
        r#"
        SELECT
            d.id, d.title, d.description, d.about_dataset, d.image_url,
            d.likes_count, d.downloads_count, d.views_count,
            o.name AS source_org,
            o.name AS source_organisation,
            s.name AS sector,
            s.slug AS sector_slug,
            u.full_name AS uploaded_by,
            d.license, d.geographical_coverage, d.author, d.data_quality_score,
            d.dataset_type, d.frequency, d.time_granularity, d.year_range,
            d.data_collected_at, d.visibility, d.hosted, d.data_type, d.data_collection_method,
            (SELECT GROUP_CONCAT(t.name)
               FROM dataset_tags dt JOIN tags t ON t.id = dt.tag_id
               WHERE dt.dataset_id = d.id) AS tags_csv
        FROM datasets d
        LEFT JOIN organizations o ON o.id = d.organization_id
        LEFT JOIN sectors s       ON s.id = d.sector_id
        LEFT JOIN users u         ON u.id = d.uploaded_by_user_id
        WHERE d.id = ?1 AND d.deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(dataset_to_json(row)))
}

// =============================================================================
// MODELS
// =============================================================================

pub async fn get_models(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = if let Some(search) = params.search.as_deref().filter(|s| !s.trim().is_empty()) {
        let fts = build_fts_query(search);
        sqlx::query_as::<_, Model>(
            r#"
            SELECT
                m.id, m.title, m.description, m.about_model, m.image_url,
                m.likes_count, m.downloads_count, m.views_count,
                o.name AS source_org,
                o.name AS source_organization,
                s.name AS sector,
                s.slug AS sector_slug,
                u.full_name AS created_by,
                m.license, m.hosted_by, m.model_type, m.model_format,
                m.visibility, m.size, m.model_updated_at,
                (SELECT GROUP_CONCAT(t.name)
                   FROM model_tags mt JOIN tags t ON t.id = mt.tag_id
                   WHERE mt.model_id = m.id) AS tags_csv
            FROM models m
            JOIN models_fts f ON f.rowid = m.id
            LEFT JOIN organizations o ON o.id = m.organization_id
            LEFT JOIN sectors s       ON s.id = m.sector_id
            LEFT JOIN users u         ON u.id = m.created_by_user_id
            WHERE models_fts MATCH ?1
              AND m.deleted_at IS NULL
              AND (?2 IS NULL OR s.slug = ?2)
            ORDER BY rank
            "#,
        )
        .bind(fts)
        .bind(params.sector.as_deref())
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Model>(
            r#"
            SELECT
                m.id, m.title, m.description, m.about_model, m.image_url,
                m.likes_count, m.downloads_count, m.views_count,
                o.name AS source_org,
                o.name AS source_organization,
                s.name AS sector,
                s.slug AS sector_slug,
                u.full_name AS created_by,
                m.license, m.hosted_by, m.model_type, m.model_format,
                m.visibility, m.size, m.model_updated_at,
                (SELECT GROUP_CONCAT(t.name)
                   FROM model_tags mt JOIN tags t ON t.id = mt.tag_id
                   WHERE mt.model_id = m.id) AS tags_csv
            FROM models m
            LEFT JOIN organizations o ON o.id = m.organization_id
            LEFT JOIN sectors s       ON s.id = m.sector_id
            LEFT JOIN users u         ON u.id = m.created_by_user_id
            WHERE m.deleted_at IS NULL
              AND (?1 IS NULL OR s.slug = ?1)
            ORDER BY m.id
            "#,
        )
        .bind(params.sector.as_deref())
        .fetch_all(&state.db)
        .await?
    };

    let json: Vec<serde_json::Value> = rows.into_iter().map(model_to_json).collect();
    Ok(Json(serde_json::json!(json)))
}

pub async fn get_model_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Model>(
        r#"
        SELECT
            m.id, m.title, m.description, m.about_model, m.image_url,
            m.likes_count, m.downloads_count, m.views_count,
            o.name AS source_org,
            o.name AS source_organization,
            s.name AS sector,
            s.slug AS sector_slug,
            u.full_name AS created_by,
            m.license, m.hosted_by, m.model_type, m.model_format,
            m.visibility, m.size, m.model_updated_at,
            (SELECT GROUP_CONCAT(t.name)
               FROM model_tags mt JOIN tags t ON t.id = mt.tag_id
               WHERE mt.model_id = m.id) AS tags_csv
        FROM models m
        LEFT JOIN organizations o ON o.id = m.organization_id
        LEFT JOIN sectors s       ON s.id = m.sector_id
        LEFT JOIN users u         ON u.id = m.created_by_user_id
        WHERE m.id = ?1 AND m.deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(model_to_json(row)))
}

// =============================================================================
// USECASES
// =============================================================================

pub async fn get_usecases(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = if let Some(search) = params.search.as_deref().filter(|s| !s.trim().is_empty()) {
        let fts = build_fts_query(search);
        sqlx::query_as::<_, UseCase>(
            r#"
            SELECT
                u.id, u.title, u.description, u.about_use_case, u.image_url,
                o.name AS source_org,
                s.name AS sector,
                s.slug AS sector_slug,
                (SELECT GROUP_CONCAT(t.name)
                   FROM usecase_tags ut JOIN tags t ON t.id = ut.tag_id
                   WHERE ut.usecase_id = u.id) AS tags_csv
            FROM usecases u
            JOIN usecases_fts f ON f.rowid = u.id
            LEFT JOIN organizations o ON o.id = u.organization_id
            LEFT JOIN sectors s       ON s.id = u.sector_id
            WHERE usecases_fts MATCH ?1
              AND u.deleted_at IS NULL
              AND (?2 IS NULL OR s.slug = ?2)
            ORDER BY rank
            "#,
        )
        .bind(fts)
        .bind(params.sector.as_deref())
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, UseCase>(
            r#"
            SELECT
                u.id, u.title, u.description, u.about_use_case, u.image_url,
                o.name AS source_org,
                s.name AS sector,
                s.slug AS sector_slug,
                (SELECT GROUP_CONCAT(t.name)
                   FROM usecase_tags ut JOIN tags t ON t.id = ut.tag_id
                   WHERE ut.usecase_id = u.id) AS tags_csv
            FROM usecases u
            LEFT JOIN organizations o ON o.id = u.organization_id
            LEFT JOIN sectors s       ON s.id = u.sector_id
            WHERE u.deleted_at IS NULL
              AND (?1 IS NULL OR s.slug = ?1)
            ORDER BY u.id
            "#,
        )
        .bind(params.sector.as_deref())
        .fetch_all(&state.db)
        .await?
    };

    let json: Vec<serde_json::Value> = rows.into_iter().map(usecase_to_json).collect();
    Ok(Json(serde_json::json!(json)))
}

pub async fn get_usecase_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, UseCase>(
        r#"
        SELECT
            u.id, u.title, u.description, u.about_use_case, u.image_url,
            o.name AS source_org,
            s.name AS sector,
            s.slug AS sector_slug,
            (SELECT GROUP_CONCAT(t.name)
               FROM usecase_tags ut JOIN tags t ON t.id = ut.tag_id
               WHERE ut.usecase_id = u.id) AS tags_csv
        FROM usecases u
        LEFT JOIN organizations o ON o.id = u.organization_id
        LEFT JOIN sectors s       ON s.id = u.sector_id
        WHERE u.id = ?1 AND u.deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(usecase_to_json(row)))
}

// =============================================================================
// TOOLKIT  (no tags, no sector — just text search)
// =============================================================================

pub async fn get_toolkit(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<Vec<Toolkit>>, AppError> {
    let rows = if let Some(search) = params.search.as_deref().filter(|s| !s.trim().is_empty()) {
        let pattern = format!("%{}%", search.to_lowercase());
        sqlx::query_as::<_, Toolkit>(
            r#"
            SELECT id, title, description, image_url, overview, key_capabilities,
                   why_it_is_included, resources_on_getting_started,
                   license_and_compliance, screenshots_and_ui_previews,
                   versioning_and_community_info
            FROM toolkit
            WHERE deleted_at IS NULL
              AND (LOWER(title) LIKE ?1 OR LOWER(description) LIKE ?1 OR LOWER(overview) LIKE ?1)
            ORDER BY id
            "#,
        )
        .bind(pattern)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Toolkit>(
            r#"
            SELECT id, title, description, image_url, overview, key_capabilities,
                   why_it_is_included, resources_on_getting_started,
                   license_and_compliance, screenshots_and_ui_previews,
                   versioning_and_community_info
            FROM toolkit
            WHERE deleted_at IS NULL
            ORDER BY id
            "#,
        )
        .fetch_all(&state.db)
        .await?
    };

    Ok(Json(rows))
}

pub async fn get_toolkit_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<Toolkit>, AppError> {
    let row = sqlx::query_as::<_, Toolkit>(
        r#"
        SELECT id, title, description, image_url, overview, key_capabilities,
               why_it_is_included, resources_on_getting_started,
               license_and_compliance, screenshots_and_ui_previews,
               versioning_and_community_info
        FROM toolkit
        WHERE id = ?1 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row))
}

// =============================================================================
// ARTICLES  (FTS5 search, no tags)
// =============================================================================

pub async fn get_articles(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Article>>, AppError> {
    let rows = sqlx::query_as::<_, Article>(
        r#"
        SELECT id, title, description, content, image_url, author, read_time,
               category, disclaimer, published_at
        FROM articles
        WHERE deleted_at IS NULL
        ORDER BY id
        "#,
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

pub async fn get_article_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<Article>, AppError> {
    let row = sqlx::query_as::<_, Article>(
        r#"
        SELECT id, title, description, content, image_url, author, read_time,
               category, disclaimer, published_at
        FROM articles
        WHERE id = ?1 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row))
}

// =============================================================================
// TUTORIALS
// =============================================================================

pub async fn get_tutorials(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Tutorial>>, AppError> {
    let rows = sqlx::query_as::<_, Tutorial>(
        r#"
        SELECT id, title, description, duration, video_url, uploaded_date
        FROM tutorials
        WHERE deleted_at IS NULL
        ORDER BY id
        "#,
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

// =============================================================================
// SECTORS / ORGANIZATIONS  (filter chip endpoints)
// =============================================================================

pub async fn get_sectors(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Sector>>, AppError> {
    let rows = sqlx::query_as::<_, Sector>(
        "SELECT id, name, slug, display_order FROM sectors ORDER BY display_order, name",
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

pub async fn get_organizations(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Organization>>, AppError> {
    let rows = sqlx::query_as::<_, Organization>(
        r#"
        SELECT id, name, slug
        FROM organizations
        WHERE deleted_at IS NULL
        ORDER BY name
        "#,
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows))
}

// =============================================================================
// USER  (hardcoded user_id=1 until JWT in Step 4)
// =============================================================================

pub async fn get_user_profile(State(state): State<Arc<AppState>>) -> Result<Json<User>, AppError> {
    let row = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, username, full_name, bio, employee_id, profile_picture_url, role
        FROM users
        WHERE id = ?1 AND deleted_at IS NULL
        "#,
    )
    .bind(CURRENT_USER_ID)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(row))
}

pub async fn update_user_profile(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateUserProfile>,
) -> Result<Json<User>, AppError> {
    if let Some(name) = payload.full_name.as_deref() {
        if name.trim().is_empty() {
            return Err(AppError::ValidationError(
                "Full name cannot be empty".to_string(),
            ));
        }
    }

    // COALESCE pattern: if a field is NULL in the payload, keep the existing value.
    sqlx::query(
        r#"
        UPDATE users SET
            full_name           = COALESCE(?1, full_name),
            bio                 = COALESCE(?2, bio),
            employee_id         = COALESCE(?3, employee_id),
            profile_picture_url = COALESCE(?4, profile_picture_url),
            updated_at          = datetime('now')
        WHERE id = ?5 AND deleted_at IS NULL
        "#,
    )
    .bind(payload.full_name)
    .bind(payload.bio)
    .bind(payload.employee_id)
    .bind(payload.profile_picture_url)
    .bind(CURRENT_USER_ID)
    .execute(&state.db)
    .await?;

    let row = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, username, full_name, bio, employee_id, profile_picture_url, role
        FROM users
        WHERE id = ?1 AND deleted_at IS NULL
        "#,
    )
    .bind(CURRENT_USER_ID)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(row))
}

// =============================================================================
// DASHBOARD  (computed live from the DB, hardcoded user_id=1)
// =============================================================================

pub async fn get_dashboard(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Dashboard>, AppError> {
    // User row
    let user: (String, String, i64, Option<String>) = sqlx::query_as(
        "SELECT full_name, role, login_streak, last_login_at FROM users WHERE id = ?1 AND deleted_at IS NULL",
    )
    .bind(CURRENT_USER_ID)
    .fetch_one(&state.db)
    .await?;

    // Total counts of artifacts in the platform (since views aren't tracked per-user yet,
    // we surface platform totals here — same pattern as the original dashboard.json).
    let counts: (i64, i64, i64) = sqlx::query_as(
        "SELECT
            (SELECT COUNT(*) FROM datasets WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM models   WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM usecases WHERE deleted_at IS NULL)",
    )
    .fetch_one(&state.db)
    .await?;

    let downloads: (i64, i64) = (0, 0);

    Ok(Json(Dashboard {
        greeting: format!("Hi {}", user.0),
        role: user.1,
        login_streak: user.2,
        artifacts_viewed: ArtifactCounts {
            datasets: counts.0,
            models: counts.1,
            use_cases: counts.2,
        },
        artifacts_downloaded: DownloadCounts {
            datasets: downloads.0,
            models: downloads.1,
        },
        last_login: user.3,
    }))
}

// =============================================================================
// CHAT
// =============================================================================

pub async fn chat_stream(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ChatMessage>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let client = reqwest::Client::new();
    let python_request = PythonChatRequest {
        question: payload.message,
    };

    let stream = async_stream::stream! {
        match client
            .post(state.config.chatbot_url.as_str())
            .json(&python_request)
            .timeout(state.config.chatbot_timeout)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<PythonChatResponse>().await {
                        Ok(chat_response) => {
                            let words: Vec<&str> = chat_response.answer.split_whitespace().collect();
                            for (index, word) in words.iter().enumerate() {
                                let text = if index == 0 {
                                    word.to_string()
                                } else {
                                    format!(" {}", word)
                                };
                                yield Ok(Event::default().data(text));
                                sleep(Duration::from_millis(50)).await;
                            }
                        }
                        Err(e) => {
                            tracing::error!("Failed to parse Python response: {}", e);
                            let error_msg = "Sorry, I encountered an error processing the response.";
                            yield Ok(Event::default().data(error_msg));
                        }
                    }
                } else {
                    tracing::error!("Python chatbot returned error: {}", response.status());
                    let error_msg = "Sorry, the chatbot service is currently unavailable.";
                    yield Ok(Event::default().data(error_msg));
                }
            }
            Err(e) => {
                tracing::error!("Failed to connect to Python chatbot: {}", e);
                let error_msg = "Sorry, I couldn't connect to the chatbot service. Please make sure it's running.";
                yield Ok(Event::default().data(error_msg));
            }
        }
    };

    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(1))
            .text("keep-alive"),
    )
}
