# AIKosh Backend - Demo/Prototype

A Rust + Axum backend for the AIKosh website clone. This is a learning project with core functionality using static JSON
data.

## 🚀 Features

- **RESTful API** for all AIKosh resources
- **JSON file-based storage** (no database required)
- **CORS enabled** for frontend integration
- **Error handling** with proper HTTP status codes
- **Structured logging** with tracing
- **Fast and lightweight** using Axum framework

## 📁 Project Structure

```
aikosh-backend/
├── Cargo.toml              # Dependencies
├── src/
│   ├── main.rs             # Server setup & routes
│   ├── models.rs           # Data structures
│   ├── handlers.rs         # API handlers
│   └── errors.rs           # Error handling
├── data/
│   ├── dashboard.json      # Dashboard data
│   ├── datasets.json       # 25 datasets
│   ├── models.json         # 25 AI models
│   ├── usecases.json       # 25 use cases
│   ├── tutorials.json      # Tutorials
│   ├── articles.json       # Articles
│   └── user.json           # User profile
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Rust 1.70 or higher ([Install Rust](https://rustup.rs/))

### Installation

1. **Create the project directory:**

```bash
mkdir aikosh-backend
cd aikosh-backend
```

2. **Create the `data` directory:**

```bash
mkdir data
```

3. **Copy all files to their respective locations:**
    - `Cargo.toml` to project root
    - All `.rs` files to `src/` directory
    - All `.json` files to `data/` directory
    - `README.md` to project root

4. **Build the project:**

```bash
cargo build
```

5. **Run the server:**

```bash
cargo run
```

The server will start on `http://127.0.0.1:3000`

## 📡 API Endpoints

### Health Check

```
GET /health
```

### Dashboard

```
GET /api/dashboard
```

Returns dashboard with greeting, stats, and login streak.

### Datasets

```
GET /api/datasets           # List all datasets
GET /api/datasets/:id       # Get specific dataset
```

### Models

```
GET /api/models             # List all models
GET /api/models/:id         # Get specific model
```

### Use Cases

```
GET /api/usecases           # List all use cases
GET /api/usecases/:id       # Get specific use case
```

### Resources

```
GET /api/tutorials          # List all tutorials
GET /api/articles           # List all articles
```

### User Profile

```
GET /api/users/profile      # Get user profile
PATCH /api/users/profile    # Update user profile
```

## 🧪 Testing the API

### Using cURL

**Get all datasets:**

```bash
curl http://localhost:3000/api/datasets
```

**Get specific dataset:**

```bash
curl http://localhost:3000/api/datasets/1
```

**Get dashboard:**

```bash
curl http://localhost:3000/api/dashboard
```

**Update user profile:**

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","bio":"AI Enthusiast"}'
```

### Using a REST Client

You can also use tools like:

- Postman
- Insomnia
- Thunder Client (VS Code extension)

## 📊 Sample Data

The project includes sample data for:

- ✅ 25 Datasets (health, agriculture, environment, etc.)
- ✅ 25 AI Models (TTS, NLP, computer vision, etc.)
- ✅ 25 Use Cases (healthcare, governance, agriculture, etc.)
- ✅ 10 Tutorials (video guides)
- ✅ 20 Articles (AI news and insights)
- ✅ 1 User Profile (editable)
- ✅ Dashboard Statistics

## 🔧 Customization

### Adding More Data

1. Edit the JSON files in the `data/` directory
2. Restart the server (changes are loaded on each request)

### Modifying Structures

1. Update the struct in `src/models.rs`
2. Update the corresponding JSON file
3. Rebuild: `cargo build`

## 🎯 Development Tips

### Enable Debug Logging

```bash
RUST_LOG=debug cargo run
```

### Format Code

```bash
cargo fmt
```

### Check for Issues

```bash
cargo clippy
```

### Run in Release Mode (faster)

```bash
cargo run --release
```

## 🌐 CORS Configuration

CORS is enabled for all origins, methods, and headers. This allows your frontend to connect from any domain during
development.

For production, update the CORS configuration in `src/main.rs`:

```rust
let cors = CorsLayer::new()
.allow_origin("https://your-frontend-domain.com".parse::<HeaderValue>().unwrap())
.allow_methods([Method::GET, Method::POST, Method::PATCH])
.allow_headers(Any);
```

## 📝 Notes

- This is a **demo/prototype** - not production-ready
- Data is loaded from JSON files on each request (no caching)
- No authentication or authorization implemented
- No database - all data is in JSON files
- File writes (user profile updates) are synchronous

## 🚧 Future Enhancements

Potential improvements for learning:

- Add search/filter query parameters
- Implement pagination
- Add authentication (JWT)
- Use a real database (PostgreSQL, MongoDB)
- Add data validation with `validator` crate
- Implement file uploads for datasets/models
- Add rate limiting
- Implement caching layer

## 📚 Learning Resources

- [Axum Documentation](https://docs.rs/axum/latest/axum/)
- [Tokio Async Runtime](https://tokio.rs/)
- [Serde for JSON](https://serde.rs/)
- [The Rust Book](https://doc.rust-lang.org/book/)

## 🤝 Contributing

This is a learning project. Feel free to experiment and modify!

## 📄 License

This is a demo project for educational purposes.

---

**Happy Coding! 🦀**