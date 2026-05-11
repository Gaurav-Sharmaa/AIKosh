//! Response shapes returned by the API.
//!
//! Field types match what SQLite returns (i64 for integers, joined strings
//! for foreign-key references like organization name and sector name).

use serde::{Deserialize, Serialize};
use sqlx::FromRow;


// =============================================================================
// QUERY PARAMS
// =============================================================================

#[derive(Debug, Deserialize, Default)]
pub struct ListQuery {
    pub search: Option<String>,
    pub sector: Option<String>,           // sector slug, e.g. "healthcare"
    pub organization_id: Option<i64>,     // datasets only
}

// =============================================================================
// DATASETS / MODELS / USECASES
//
// `tags_csv` is internal — populated from a SQL GROUP_CONCAT.
// The handler converts it to a Vec<String> named `tags` before serializing.
// =============================================================================

#[derive(Debug, Serialize, FromRow)]
pub struct Dataset {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub about_dataset: Option<String>,
    pub image_url: Option<String>,

    pub likes_count: i64,
    pub downloads_count: i64,
    pub views_count: i64,

    pub source_org: Option<String>,
    pub source_organisation: Option<String>,
    pub sector: Option<String>,
    pub sector_slug: Option<String>,
    pub uploaded_by: Option<String>,

    pub license: Option<String>,
    pub geographical_coverage: Option<String>,
    pub author: Option<String>,
    pub data_quality_score: Option<i64>,
    pub dataset_type: Option<String>,
    pub frequency: Option<String>,
    pub time_granularity: Option<String>,
    pub year_range: Option<String>,
    pub data_collected_at: Option<String>,
    pub visibility: String,
    pub hosted: String,
    pub data_type: Option<String>,
    pub data_collection_method: Option<String>,

    pub tags_csv: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Model {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub about_model: Option<String>,
    pub image_url: Option<String>,

    pub likes_count: i64,
    pub downloads_count: i64,
    pub views_count: i64,

    pub source_org: Option<String>,
    pub source_organization: Option<String>,
    pub sector: Option<String>,
    pub sector_slug: Option<String>,
    pub created_by: Option<String>,

    pub license: Option<String>,
    pub hosted_by: Option<String>,
    pub model_type: Option<String>,
    pub model_format: Option<String>,
    pub visibility: String,
    pub size: Option<String>,
    pub model_updated_at: Option<String>,

    pub tags_csv: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct UseCase {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub about_use_case: Option<String>,
    pub image_url: Option<String>,

    pub source_org: Option<String>,
    pub sector: Option<String>,
    pub sector_slug: Option<String>,

    pub tags_csv: Option<String>,
}

// =============================================================================
// ARTICLES / TUTORIALS / TOOLKIT
// =============================================================================

#[derive(Debug, Serialize, FromRow)]
pub struct Article {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub content: String,
    pub image_url: Option<String>,
    pub author: String,
    pub read_time: Option<String>,
    pub category: Option<String>,
    pub disclaimer: Option<String>,
    pub published_at: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Tutorial {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub duration: Option<String>,
    pub video_url: String,
    pub uploaded_date: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Toolkit {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub image_url: Option<String>,
    pub overview: Option<String>,
    pub key_capabilities: Option<String>,
    pub why_it_is_included: Option<String>,
    pub resources_on_getting_started: Option<String>,
    pub license_and_compliance: Option<String>,
    pub screenshots_and_ui_previews: Option<String>,
    pub versioning_and_community_info: Option<String>,
}

// =============================================================================
// USERS
// =============================================================================

#[derive(Debug, Serialize, FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub username: String,
    pub full_name: String,
    pub bio: Option<String>,
    pub employee_id: Option<String>,
    pub profile_picture_url: Option<String>,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserProfile {
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub employee_id: Option<String>,
    pub profile_picture_url: Option<String>,
}

// =============================================================================
// SECTORS / ORGANIZATIONS (filter chips)
// =============================================================================

#[derive(Debug, Serialize, FromRow)]
pub struct Sector {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub display_order: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Organization {
    pub id: i64,
    pub name: String,
    pub slug: String,
}

// =============================================================================
// DASHBOARD (computed per-user)
// =============================================================================

#[derive(Debug, Serialize)]
pub struct Dashboard {
    pub greeting: String,
    pub role: String,
    pub login_streak: i64,
    pub artifacts_viewed: ArtifactCounts,
    pub artifacts_downloaded: DownloadCounts,
    pub last_login: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ArtifactCounts {
    pub datasets: i64,
    pub models: i64,
    pub use_cases: i64,
}

#[derive(Debug, Serialize)]
pub struct DownloadCounts {
    pub datasets: i64,
    pub models: i64,
}

// =============================================================================
// CHAT (kept exactly as before)
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct PythonChatRequest {
    pub question: String,
}

#[derive(Debug, Deserialize)]
pub struct PythonChatResponse {
    pub answer: String,
}