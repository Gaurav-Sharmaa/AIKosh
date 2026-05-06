use crate::models::{Article, Dashboard, Dataset, Model, Toolkit, Tutorial, UseCase, User};
use serde::de::DeserializeOwned;
use std::fs;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct AppState {
    pub datasets: Vec<Dataset>,
    pub models: Vec<Model>,
    pub usecases: Vec<UseCase>,
    pub articles: Vec<Article>,
    pub tutorials: Vec<Tutorial>,
    pub toolkit: Vec<Toolkit>,
    pub dashboard: Dashboard,
    pub user: RwLock<User>,
}

impl AppState {
    pub fn load() -> Self {
        AppState {
            datasets: Self::load_json_file("data/datasets.json"),
            models: Self::load_json_file("data/models.json"),
            usecases: Self::load_json_file("data/usecases.json"),
            articles: Self::load_json_file("data/articles.json"),
            tutorials: Self::load_json_file("data/tutorials.json"),
            toolkit: Self::load_json_file("data/toolkit.json"),
            dashboard: Self::load_json_file("data/dashboard.json"),
            user: RwLock::new(Self::load_json_file("data/user.json")),
        }
    }

    fn load_json_file<T: DeserializeOwned>(path: &str) -> T {
        //DeserializeOwned: Trait Bound
        let data =
            fs::read_to_string(path).unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
        serde_json::from_str(&data).unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
        // Converts the Json text into my Rust Struct.
    }
}
