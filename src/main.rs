mod errors;
mod handlers;
mod models;

use axum::{
    routing::{get, patch, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aikosh_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/dashboard", get(handlers::get_dashboard))
        .route("/api/shared-artifacts", get(handlers::get_shared_artifacts))
        .route("/api/datasets", get(handlers::get_datasets))
        .route("/api/datasets/:id", get(handlers::get_dataset_by_id))
        .route("/api/models", get(handlers::get_models))
        .route("/api/models/:id", get(handlers::get_model_by_id))
        .route("/api/usecases", get(handlers::get_usecases))
        .route("/api/usecases/:id", get(handlers::get_usecase_by_id))
        .route("/api/leaderboard", get(handlers::get_leaderboard))
        .route("/api/bookmark", get(handlers::get_bookmarked))
        .route("/api/my-notebook", get(handlers::get_my_notebook))
        .route(
            "/api/recent-activities",
            get(handlers::get_recent_activities),
        )
        .route("/api/tutorials", get(handlers::get_tutorials))
        .route("/api/articles", get(handlers::get_articles))
        .route("/api/articles/:id", get(handlers::get_article_by_id))
        .route("/api/toolkit", get(handlers::get_toolkit))
        .route("/api/toolkit/:id", get(handlers::get_toolkit_by_id))
        .route("/api/users/profile", get(handlers::get_user_profile))
        .route("/api/users/profile", patch(handlers::update_user_profile))
        .route("/api/chat/stream", post(handlers::chat_stream))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    tracing::info!(
        "Server listening on http://{}",
        listener.local_addr().unwrap()
    );

    axum::serve(listener, app).await.unwrap();
}
