use std::env;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub frontend_origin: String,
    pub chatbot_url: String,
    pub chatbot_timeout: Duration,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),

            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .map_err(|_| ConfigError::Invalid("SERVER_PORT must be a number"))?,

            frontend_origin: env::var("FRONTEND_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),

            chatbot_url: env::var("CHATBOT_URL")
                .map_err(|_| ConfigError::Missing("CHATBOT_URL"))?,

            chatbot_timeout: Duration::from_secs(
                env::var("CHATBOT_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "120".to_string())
                    .parse()
                    .map_err(|_| ConfigError::Invalid("CHATBOT_TIMEOUT_SECS must be a number"))?,
            ),
        })
    }
}

#[derive(Debug)]
pub enum ConfigError {
    Missing(&'static str),
    Invalid(&'static str),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::Missing(k) => write!(f, "Missing required env var: {}", k),
            ConfigError::Invalid(k) => write!(f, "Invalid env var: {}", k),
        }
    }
}

impl std::error::Error for ConfigError {}
