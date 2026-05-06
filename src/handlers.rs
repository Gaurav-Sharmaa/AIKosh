use axum::extract::State;
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

pub async fn get_datasets(State(state): State<Arc<AppState>>) -> Json<Vec<Dataset>> {
    Json(state.datasets.clone())
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

pub async fn get_models(State(state): State<Arc<AppState>>) -> Json<Vec<Model>> {
    Json(state.models.clone())
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

pub async fn get_toolkit(State(state): State<Arc<AppState>>) -> Json<Vec<Toolkit>> {
    Json(state.toolkit.clone())
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

pub async fn get_usecases(State(state): State<Arc<AppState>>) -> Json<Vec<UseCase>> {
    Json(state.usecases.clone())
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