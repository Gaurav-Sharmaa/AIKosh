mod config;
mod errors;
mod handlers;
mod models;
mod state;

use axum::{
    http::HeaderValue,
    routing::{get, patch, post},
    Router,
};
use std::{error::Error, sync::Arc};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{config::Config, handlers::health_check, state::AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aikosh_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;
    let bind_addr = format!("{}:{}", config.server_host, config.server_port);
    let frontend_origin: HeaderValue = config.frontend_origin.parse()?;

    let cors = CorsLayer::new()
        .allow_origin(frontend_origin)
        .allow_methods(Any)
        .allow_headers(Any);

    let shared_state = Arc::new(AppState::init(config).await?);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/dashboard", get(handlers::get_dashboard))
        .route("/api/datasets", get(handlers::get_datasets))
        .route("/api/datasets/:id", get(handlers::get_dataset_by_id))
        .route("/api/models", get(handlers::get_models))
        .route("/api/models/:id", get(handlers::get_model_by_id))
        .route("/api/usecases", get(handlers::get_usecases))
        .route("/api/usecases/:id", get(handlers::get_usecase_by_id))
        .route("/api/tutorials", get(handlers::get_tutorials))
        .route("/api/articles", get(handlers::get_articles))
        .route("/api/articles/:id", get(handlers::get_article_by_id))
        .route("/api/toolkit", get(handlers::get_toolkit))
        .route("/api/toolkit/:id", get(handlers::get_toolkit_by_id))
        .route("/api/users/profile", get(handlers::get_user_profile))
        .route("/api/users/profile", patch(handlers::update_user_profile))
        .route("/api/sectors", get(handlers::get_sectors))
        .route("/api/organizations", get(handlers::get_organizations))
        .route("/api/chat/stream", post(handlers::chat_stream))
        .with_state(shared_state)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    tracing::info!("Server listening on http://{}", listener.local_addr()?);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("Ctrl+C received, starting graceful shutdown");
        }
        _ = terminate => {
            tracing::info!("SIGTERM received, starting graceful shutdown");
        }
    }
}