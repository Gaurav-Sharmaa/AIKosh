use axum::{extract::Path, http::StatusCode, Json};
use std::fs;

use crate::errors::AppError;
use crate::models::*;

// Helper function to read JSON files
fn read_json_file<T: serde::de::DeserializeOwned>(path: &str) -> Result<T, AppError> {
    let content = fs::read_to_string(path)?;
    let data: T = serde_json::from_str(&content)?;
    Ok(data)
}

// Dashboard
pub async fn get_dashboard() -> Result<Json<Dashboard>, AppError> {
    let dashboard = read_json_file::<Dashboard>("data/dashboard.json")?;
    Ok(Json(dashboard))
}

pub async fn get_shared_artifacts() -> Json<Vec<SharedArtifact>> {
    // Empty list → UI shows "No Record(s) Found!"
    Json(vec![])
}

// Dataset
pub async fn get_datasets() -> Result<Json<Vec<Dataset>>, AppError> {
    let datasets = read_json_file::<Vec<Dataset>>("data/datasets.json")?;
    Ok(Json(datasets))
}

pub async fn get_dataset_by_id(Path(id): Path<u8>) -> Result<Json<Dataset>, AppError> {
    let datasets = read_json_file::<Vec<Dataset>>("data/datasets.json")?;

    datasets
        .into_iter()
        .find(|d| d.id == id)
        .map(Json)
        .ok_or(AppError::NotFound)
}

// Model
pub async fn get_models() -> Result<Json<Vec<Model>>, AppError> {
    let models = read_json_file::<Vec<Model>>("data/models.json")?;
    Ok(Json(models))
}

pub async fn get_model_by_id(Path(id): Path<u8>) -> Result<Json<Model>, AppError> {
    let models = read_json_file::<Vec<Model>>("data/models.json")?;

    models
        .into_iter()
        .find(|m| m.id == id)
        .map(Json)
        .ok_or(AppError::NotFound)
}

//Tooklit
pub async fn get_toolkit() -> Result<Json<Vec<Toolkit>>, AppError> {
    let toolkit = read_json_file::<Vec<Toolkit>>("data/toolkit.json")?;
    Ok(Json(toolkit))
}

pub async fn get_toolkit_by_id(Path(id): Path<u8>) -> Result<Json<Toolkit>, AppError> {
    let toolktit = read_json_file::<Vec<Toolkit>>("data/toolkit.json")?;

    toolktit
        .into_iter()
        .find(|t| t.id == id)
        .map(Json)
        .ok_or(AppError::NotFound)
}

// UseCase
pub async fn get_usecases() -> Result<Json<Vec<UseCase>>, AppError> {
    let usecases = read_json_file::<Vec<UseCase>>("data/usecases.json")?;
    Ok(Json(usecases))
}

pub async fn get_usecase_by_id(Path(id): Path<u8>) -> Result<Json<UseCase>, AppError> {
    let usecases = read_json_file::<Vec<UseCase>>("data/usecases.json")?;

    usecases
        .into_iter()
        .find(|u| u.id == id)
        .map(Json)
        .ok_or(AppError::NotFound)
}

pub async fn get_leaderboard() -> Json<Vec<Leaderboard>> {
    Json(vec![])
}

pub async fn get_bookmarked() -> Json<Vec<Bookmark>> {
    Json(vec![])
}

pub async fn get_my_notebook() -> Json<Vec<MyNotebook>> {
    Json(vec![])
}

pub async fn get_recent_activities() -> Json<Vec<RecentActivities>> {
    Json(vec![])
}

// Tutorial
pub async fn get_tutorials() -> Result<Json<Vec<Tutorial>>, AppError> {
    let tutorials = read_json_file::<Vec<Tutorial>>("data/tutorials.json")?;
    Ok(Json(tutorials))
}

// Article
pub async fn get_articles() -> Result<Json<Vec<Article>>, AppError> {
    let articles = read_json_file::<Vec<Article>>("data/articles.json")?;
    Ok(Json(articles))
}

pub async fn get_article_by_id(Path(id): Path<u8>) -> Result<Json<Article>, AppError> {
    let articles = read_json_file::<Vec<Article>>("data/articles.json")?;

    articles
        .into_iter()
        .find(|a| a.id == id)
        .map(Json)
        .ok_or(AppError::NotFound)
}

// User profile
pub async fn get_user_profile() -> Result<Json<User>, AppError> {
    let user = read_json_file::<User>("data/user.json")?;
    Ok(Json(user))
}

pub async fn update_user_profile(
    Json(payload): Json<UpdateUserProfile>,
) -> Result<Json<User>, AppError> {
    let mut user = read_json_file::<User>("data/user.json")?;

    // Update fields if provided
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

    // Write back to file
    let json_string = serde_json::to_string_pretty(&user)?;
    fs::write("data/user.json", json_string)?;

    Ok(Json(user))
}

// Health Check
pub async fn health_check() -> (StatusCode, &'static str) {
    (StatusCode::OK, "OK")
}
