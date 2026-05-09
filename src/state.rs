use crate::config::Config;
use crate::models::{Article, Dashboard, Dataset, Model, Toolkit, Tutorial, UseCase, User};
use serde::de::DeserializeOwned;
use std::fs;
use std::path::{Path, PathBuf};
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct AppState {
    pub config: Config,
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
    pub fn load(config: Config) -> Self {
        let dir = Path::new(&config.data_dir);

        AppState {
            datasets: Self::load_json(&dir.join("datasets.json")),
            models: Self::load_json(&dir.join("models.json")),
            usecases: Self::load_json(&dir.join("usecases.json")),
            articles: Self::load_json(&dir.join("articles.json")),
            tutorials: Self::load_json(&dir.join("tutorials.json")),
            toolkit: Self::load_json(&dir.join("toolkit.json")),
            dashboard: Self::load_json(&dir.join("dashboard.json")),
            user: RwLock::new(Self::load_json(&dir.join("user.json"))),
            config,
        }
    }

    fn load_json<T: DeserializeOwned>(path: &PathBuf) -> T {
        let data = fs::read_to_string(path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path.display(), e));
        serde_json::from_str(&data)
            .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path.display(), e))
    }
}
