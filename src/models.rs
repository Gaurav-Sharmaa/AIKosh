use serde::{Deserialize, Serialize};

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
pub struct SharedArtifact {
    pub id: u32,
    pub days_remaining: i32,
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
    pub id: u8,
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub about_dataset: String,
    pub image_url: Option<String>,
    pub likes_count: u32,
    #[serde(default)]
    pub downloads_count: u32,
    #[serde(default)]
    pub views_count: u32,
    pub source_org: Option<String>,
    pub tags: Vec<String>,
    #[serde(default)]
    pub license: String,
    #[serde(default)]
    pub geographical_coverage: String,
    #[serde(default)]
    pub sector: String,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub source_organisation: String,
    #[serde(default)]
    pub uploaded_by: String,
    #[serde(default)]
    pub data_quality_score: Option<String>,
    #[serde(default)]
    pub dataset_type: String,
    #[serde(default)]
    pub frequency: String,
    #[serde(default)]
    pub time_granularity: String,
    #[serde(default)]
    pub year_range: Option<String>,
    #[serde(default)]
    pub date_and_time: String,
    #[serde(default)]
    pub visibility: String,
    #[serde(default)]
    pub hosted: String,
    #[serde(default)]
    pub data_type: Option<String>,
    #[serde(default)]
    pub data_collection_method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    pub id: u8,
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub about_model: String,
    pub image_url: Option<String>,
    pub tags: Vec<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub source_org: String,
    #[serde(default)]
    pub license: String,
    #[serde(default)]
    pub hosted_by: String,
    #[serde(default)]
    pub model_type: String,
    #[serde(default)]
    pub model_format: String,
    #[serde(default)]
    pub visibility: String,
    #[serde(default)]
    pub source_organization: String,
    #[serde(default)]
    pub sector: String,
    #[serde(default)]
    pub updated_at: String,
    #[serde(default)]
    pub created_by: String,
    #[serde(default)]
    pub size: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Toolkit {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub image_url: Option<String>,
    pub overview: String,
    pub key_capabilities: String,
    pub why_it_is_included: String,
    pub resources_on_getting_started: String,
    pub license_and_compliance: String,
    pub screenshots_and_ui_previews: Option<String>,
    pub versioning_and_community_info: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UseCase {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub image_url: Option<String>,
    pub source_org: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub sector: String,
    #[serde(default)]
    pub about_use_case: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Leaderboard {
    pub id: u32,
    pub rank: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bookmark {
    pub id: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MyNotebook {
    pub id: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentActivities {
    pub id: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tutorial {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub duration: String,
    pub video_url: String,
    #[serde(default)]
    pub author: String,
    pub uploaded_date: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Article {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub content: Option<String>,
    pub image_url: String,
    pub author: String,
    pub read_time: String,
    pub published_date: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: u8,
    pub full_name: String,
    pub username: String,
    pub bio: String,
    pub employee_id: Option<String>,
    pub profile_picture_url: Option<String>,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserProfile {
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub employee_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub message: String,
}
