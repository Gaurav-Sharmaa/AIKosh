mod errors;
mod handlers;
mod models;

use axum::{
    routing::{get, patch},
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

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build our application routes
    let app = Router::new()
        // Health check
        .route("/health", get(handlers::health_check))
        // Dashboard
        .route("/api/dashboard", get(handlers::get_dashboard))
        // Datasets
        .route("/api/datasets", get(handlers::get_datasets))
        .route("/api/datasets/:id", get(handlers::get_dataset_by_id))
        // Models
        .route("/api/models", get(handlers::get_models))
        .route("/api/models/:id", get(handlers::get_model_by_id))
        // Use Cases
        .route("/api/usecases", get(handlers::get_usecases))
        .route("/api/usecases/:id", get(handlers::get_usecase_by_id))
        // Tutorials
        .route("/api/tutorials", get(handlers::get_tutorials))
        // Articles
        .route("/api/articles", get(handlers::get_articles))
        // User Profile
        .route("/api/users/profile", get(handlers::get_user_profile))
        .route("/api/users/profile", patch(handlers::update_user_profile))
        .layer(cors);

    // Run the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    tracing::info!(
        "🚀 Server listening on http://{}",
        listener.local_addr().unwrap()
    );

    axum::serve(listener, app).await.unwrap();
}
