use axum::extract::{Query, State};
use axum::response::sse::{Event, Sse};
use axum::{extract::Path, Json};
use futures::stream::Stream;
use std::convert::Infallible;
use std::fs;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use crate::errors::AppError;
use crate::models::*;
use crate::state::AppState;

const PYTHON_CHATBOT_URL: &str = "http://localhost:8000/ask";
const DEFAULT_PER_PAGE: usize = 20;
const MAX_PER_PAGE: usize = 100;

fn paginate<T: Clone>(items: Vec<T>, page: Option<usize>, per_page: Option<usize>) -> Paginated<T> {
    let per_page = per_page.unwrap_or(DEFAULT_PER_PAGE).clamp(1, MAX_PER_PAGE);
    let page = page.unwrap_or(1).max(1);
    let total = items.len();
    let total_pages = if total == 0 {
        0
    } else {
        total.div_ceil(per_page)
    };

    let start = (page - 1) * per_page;
    let page_items = if start >= total {
        Vec::new()
    } else {
        let end = (start + per_page).min(total);
        items[start..end].to_vec()
    };

    Paginated {
        items: page_items,
        meta: PageMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }
}

pub async fn chat_stream(
    Json(payload): Json<ChatMessage>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let question = payload.message;

    let client = reqwest::Client::new();

    let python_request = PythonChatRequest {
        question: question.clone(),
    };

    let stream = async_stream::stream! {
        match client
            .post(PYTHON_CHATBOT_URL)
            .json(&python_request)
            .timeout(Duration::from_secs(120))
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

pub async fn get_dashboard(State(state): State<Arc<AppState>>) -> Json<Dashboard> {
    Json(state.dashboard.clone())
}

pub async fn get_datasets(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Json<Paginated<Dataset>> {
    let filtered = state
        .datasets
        .iter()
        .filter(|datasets| {
            if let Some(search) = &params.search {
                let search = search.to_lowercase();
                if !datasets.title.to_lowercase().contains(&search)
                    && !datasets.description.to_lowercase().contains(&search)
                {
                    return false;
                }
            }
            if let Some(tag) = &params.tag {
                let tag = tag.to_lowercase();
                if !datasets.tags.iter().any(|t| t.to_lowercase() == tag) {
                    return false;
                }
            }
            if let Some(sector) = &params.sector {
                let sector = sector.to_lowercase();
                if !datasets.sector.contains(&sector) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();

    Json(paginate(filtered, params.page, params.per_page))
}

pub async fn get_dataset_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u32>,
) -> Result<Json<Dataset>, AppError> {
    state
        .datasets
        .iter()
        .find(|d| d.id == id)
        .cloned()
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_models(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Json<Paginated<Model>> {
    let filtered = state
        .models
        .iter()
        .filter(|models| {
            if let Some(search) = &params.search {
                let search = search.to_lowercase();
                if !models.title.to_lowercase().contains(&search)
                    && !models.description.to_lowercase().contains(&search)
                {
                    return false;
                }
            }
            if let Some(tag) = &params.tag {
                let tag = tag.to_lowercase();
                if !models.tags.iter().any(|t| t.to_lowercase() == tag) {
                    return false;
                }
            }
            if let Some(sector) = &params.sector {
                let sector = sector.to_lowercase();
                if !models.sector.contains(&sector) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();

    Json(paginate(filtered, params.page, params.per_page))
}

pub async fn get_model_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u32>,
) -> Result<Json<Model>, AppError> {
    state
        .models
        .iter()
        .find(|m| m.id == id)
        .cloned()
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_toolkit(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Json<Paginated<Toolkit>> {
    let filtered = state
        .toolkit
        .iter()
        .filter(|toolkit| {
            if let Some(search) = &params.search {
                let search = search.to_lowercase();
                if !toolkit.title.to_lowercase().contains(&search)
                    && !toolkit.description.to_lowercase().contains(&search)
                    && !toolkit.overview.to_lowercase().contains(&search)
                {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();
    Json(paginate(filtered, params.page, params.per_page))
}

pub async fn get_toolkit_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u32>,
) -> Result<Json<Toolkit>, AppError> {
    state
        .toolkit
        .iter()
        .find(|t| t.id == id)
        .cloned()
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_usecases(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Json<Paginated<UseCase>> {
    let filtered = state
        .usecases
        .iter()
        .filter(|usecases| {
            if let Some(search) = &params.search {
                let search = search.to_lowercase();
                if !usecases.title.to_lowercase().contains(&search)
                    && !usecases.description.to_lowercase().contains(&search)
                {
                    return false;
                }
            }
            if let Some(tag) = &params.tag {
                let tag = tag.to_lowercase();
                if !usecases.tags.iter().any(|t| t.to_lowercase() == tag) {
                    return false;
                }
            }
            if let Some(sector) = &params.sector {
                let sector = sector.to_lowercase();
                if !usecases.sector.contains(&sector) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();
    Json(paginate(filtered, params.page, params.per_page))
}

pub async fn get_usecase_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u32>,
) -> Result<Json<UseCase>, AppError> {
    state
        .usecases
        .iter()
        .find(|u| u.id == id)
        .cloned()
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_tutorials(State(state): State<Arc<AppState>>) -> Json<Vec<Tutorial>> {
    Json(state.tutorials.clone())
}

pub async fn get_articles(State(state): State<Arc<AppState>>) -> Json<Vec<Article>> {
    Json(state.articles.clone())
}

pub async fn get_article_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u32>,
) -> Result<Json<Article>, AppError> {
    state
        .articles
        .iter()
        .find(|a| a.id == id)
        .cloned()
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_user_profile(State(state): State<Arc<AppState>>) -> Json<User> {
    let user = state.user.read().await;
    Json(user.clone())
}

pub async fn update_user_profile(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateUserProfile>,
) -> Result<Json<User>, AppError> {
    let mut user = state.user.write().await;

    if let Some(full_name) = payload.full_name {
        if full_name.trim().is_empty() {
            return Err(AppError::ValidationError(
                "Full name cannot be empty".to_string(),
            ));
        }
        user.full_name = full_name;
    }

    if let Some(bio) = payload.bio {
        user.bio = bio;
    }

    if let Some(employee_id) = payload.employee_id {
        user.employee_id = Some(employee_id);
    }

    let json_string = serde_json::to_string_pretty(&*user)?;
    fs::write("data/user.json", json_string)?;

    Ok(Json(user.clone()))
}

pub async fn health_check(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "datasets": state.datasets.len(),
        "models": state.models.len(),
        "usecases": state.usecases.len()
    }))
}
