use crate::config::Config;
use anyhow::{Context, Result};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use sqlx::ConnectOptions;
use std::str::FromStr;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: Config,
}

impl AppState {
    pub async fn init(config: Config) -> Result<Self> {
        let db_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite://data/aikosh.db?mode=rwc".to_string());

        let opts = SqliteConnectOptions::from_str(&db_url)
            .context("invalid DATABASE_URL")?
            .create_if_missing(false)
            .foreign_keys(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
            .disable_statement_logging();

        let db = SqlitePool::connect_with(opts)
            .await
            .context("failed to open SQLite database; run `cargo run --bin db_setup` first")?;

        Ok(Self { db, config })
    }
}