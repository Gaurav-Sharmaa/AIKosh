use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: u64,
    pub full_name: String,
    pub username: String,
    pub bio: String,
    pub employee_id: Option<String>,
    pub profile_picture_url: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dashboard {
    pub greeting: String,
    pub role: String,
    pub login_streak: u32,
    pub artifacts_viewed: ArtifactsViewed,
    pub artifacts_downloaded: ArtifactsDownloaded,
    pub last_login: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArtifactsViewed {
    pub datasets: u32,
    pub models: u32,
    pub use_cases: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArtifactsDownloaded {
    pub datasets: u32,
    pub models: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dataset {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub tags: Vec<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub source_org: String,
    pub updated_at: String,
    pub sector: String,
    pub license: String,
    pub size: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub tags: Vec<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub source_org: String,
    pub updated_at: String,
    pub model_format: String,
    pub size: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UseCase {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub tags: Vec<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub source_org: String,
    pub updated_at: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tutorial {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub duration: String,
    pub video_url: String,
    pub author: String,
    pub uploaded_date: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Article {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub content: Option<String>,
    pub image_url: String,
    pub author: String,
    pub read_time: String,
    pub published_date: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserProfile {
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub employee_id: Option<String>,
}
