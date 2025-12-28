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
    pub about_dataset: String,
    pub image_url: Option<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub views_count: u32,
    pub source_org: Option<String>,
    pub tags: Vec<String>,
    pub license: String,
    pub geographical_coverage: String,
    pub sector: String,
    pub author: String,
    pub source_organisation: String,
    pub uploaded_by: String,
    pub data_quality_score: Option<String>,
    pub dataset_type: String,
    pub frequency: String,
    pub time_granularity: String,
    pub year_range: Option<String>,
    pub date_and_time: String,
    pub visibility: String,
    pub hosted: String,
    pub data_type: Option<String>,
    pub data_collection_method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub about_model: String,
    pub image_url: Option<String>,
    pub tags: Vec<String>,
    pub likes_count: u32,
    pub downloads_count: u32,
    pub source_org: String,
    pub license: String,
    pub hosted_by: String,
    pub model_type: String,
    pub model_format: String,
    pub visibility: String,
    pub source_organization: String,
    pub sector: String,
    pub updated_at: String,
    pub created_by: String,
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
    pub image_url: String,
    pub source_org: String,
    pub tags: Vec<String>,
    pub sector: String,
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
