<h1 align="center">AIKosh</h1>

<p align="center">
  <img src="https://private-user-images.githubusercontent.com/167352089/559033951-4d21efed-77df-4257-ba52-1b1b91177b86.png" alt="AIKosh Dashboard" width="100%">
</p>

<p align="center">
  <img src="https://private-user-images.githubusercontent.com/167352089/559033950-6c8e0108-94f9-405e-a8d7-f5f0281d68db.png" alt="AIKosh AI Chatbot" width="100%">
</p>

## Overview

**AIKosh** is India's National AI Repository for datasets, models, and resources. This is an enhanced clone of the original AIKosh platform with significant personal touches and additional features, most notably an **intelligent RAG-powered chatbot** that helps users navigate through the vast collection of AI resources.

The platform aggregates **40 datasets**, **34 AI models**, and **31 use cases** along with articles, tutorials, and toolkits, making it challenging for users to find the right resources. Our AI chatbot solves this by providing curated, context-aware recommendations based on user queries.

## What Makes This Special

### Intelligent AI Chatbot
The core feature of this project is an AI-powered assistant that:
- Takes natural language questions from users about their specific problems
- Searches through all available datasets, models, use cases, and articles using RAG (Retrieval-Augmented Generation)
- Provides curated, contextual answers with relevant resource recommendations
- Renders responses in beautiful markdown format with proper headings, lists, and formatting
- Supports streaming responses with the ability to stop mid-generation
- **Future Enhancement**: Multilingual support for regional languages (Hindi, Bengali, Tamil) using Sarvam AI's language capabilities

### Blazing Fast Rust Backend
The backend is built with Rust and the Axum framework, chosen for:
- **Superior Performance**: 3-5x faster than Node.js/Nest.js in request handling
- **High Concurrency**: Efficiently handles thousands of concurrent requests with minimal resource usage
- **Memory Safety**: Zero-cost abstractions and compile-time guarantees prevent runtime errors
- **Low Latency**: Sub-millisecond response times for API endpoints

### Powered by Sarvam AI
After extensive testing with multiple LLM providers, **Sarvam AI** was chosen as the AI backbone because:
- Best understanding of Indian context and terminology
- Excellent performance with technical and domain-specific queries
- Reliable API with consistent response quality
- Optimized for Indian datasets and use cases
- Native support for Indian languages (future implementation)

## Architecture

```
AIKosh/
├── Backend (Rust + Axum)       → High-performance REST API
├── Frontend (React + Vite)     → Modern, responsive UI
└── Chatbot (Python + FastAPI)  → RAG-powered AI assistant
```

### Tech Stack
- **Backend**: Rust, Axum, Tokio, Tower, Serde
- **Frontend**: React, TypeScript, Vite, TailwindCSS, React Router, React Markdown
- **Chatbot**: Python, FastAPI, Sentence Transformers, FAISS, Sarvam AI API
- **Data Storage**: JSON files (40 datasets, 34 models, 31 use cases)

## Prerequisites

Before running this project, ensure you have the following installed:

### 1. Rust
```bash
# Install Rust (if not already installed)

# Verify installation
cargo --version
```

### 2. Node.js and pnpm
```bash
# Install Node.js 18+ from: https://nodejs.org/
node --version

# Install pnpm
npm install -g pnpm
pnpm --version
```

### 3. Python 3.10+
```bash
# Install Python from: https://www.python.org/downloads/
python --version

# Verify pip is installed
pip --version
```

### 4. Sarvam AI API Key
Get your free API key from [Sarvam AI](https://www.sarvam.ai/) and configure it in the chatbot's `.env` file.

## Getting Started

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd AIKosh
```

### Step 2: Setup Chatbot
Follow the detailed instructions in the [`chatbot/README.md`](chatbot/README.md) file:
```bash
cd chatbot
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt

# Create .env file and add your Sarvam API key
echo "SARVAM_API_KEY=your_key_here" > .env

python app.py
```

The chatbot API will run on `http://localhost:8000`

### Step 3: Run Backend (Terminal 1)
```bash
# From project root
cargo run -r
```

The Rust backend will run on `http://localhost:3000/api`

### Step 4: Run Frontend (Terminal 2)
```bash
cd frontend
pnpm install
pnpm run dev
```

The React app will run on `http://localhost:5173`

### Running All Services
You need **3 terminals** running simultaneously:
1. **Terminal 1**: `cargo run -r` (Rust backend - Port 3000)
2. **Terminal 2**: `cd frontend && pnpm run dev` (React frontend - Port 5173)
3. **Terminal 3**: `cd chatbot && python app.py` (Python chatbot - Port 8000)

## Project Structure

```
AIKosh/
├── src/                    # Rust backend source
│   ├── main.rs            # Server setup & routes
│   ├── models.rs          # Data structures
│   ├── handlers.rs        # API handlers
│   └── errors.rs          # Error handling
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
├── chatbot/               # Python RAG chatbot
│   ├── app.py            # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Chatbot setup guide
├── data/                 # JSON data files
│   ├── datasets.json     # 40 datasets
│   ├── models.json       # 34 AI models
│   ├── usecases.json     # 31 use cases
│   ├── articles.json     # Articles
│   ├── tutorials.json    # Tutorials
│   ├── toolkit.json      # Toolkits
│   └── dashboard.json    # Dashboard data
├── Cargo.toml            # Rust dependencies
└── README.md
```

## Features

### Current Features
- Browse 40+ datasets with detailed information
- Explore 34+ AI models with specifications
- Discover 31+ real-world use cases
- Read articles and tutorials
- Responsive, modern UI built with React and TailwindCSS
- Blazing fast Rust backend with RESTful APIs
- **AI Chatbot** with RAG-based intelligent search
- Markdown rendering for beautiful, formatted responses
- Streaming responses with stop functionality
- Context-aware recommendations from all resources

### Coming Soon
- Multilingual chatbot support (Hindi, Bengali, Tamil)
- User authentication and personalized recommendations
- Resource bookmarking and favorites
- Advanced filtering and search

## API Documentation

### Service Ports & Architecture

This project runs on **3 separate services** on different ports:

| Service            | Port | Base URL                    | Purpose                                  |
| ------------------ | ---- | --------------------------- | ---------------------------------------- |
| **Rust Backend**   | 3000 | `http://localhost:3000/api` | REST API for datasets, models, use cases |
| **React Frontend** | 5173 | `http://localhost:5173`     | User interface                           |
| **Python Chatbot** | 8000 | `http://localhost:8000`     | RAG-powered AI assistant API             |

**Why separate services?**
- **Backend (Rust)**: Handles data retrieval from JSON files with blazing-fast performance
- **Chatbot (Python)**: RAG requires Python libraries (FAISS, Sentence Transformers) which aren't available in Rust
- **Frontend (React)**: Communicates with both Backend and Chatbot APIs

### Backend API Endpoints (Port 3000)

#### General
```bash
GET /health
# Health check endpoint
# Response: { "status": "ok" }
```


#### Datasets
```bash
GET /api/datasets
# Get all datasets
# Response: [{ "id": 1, "title": "...", "description": "..." }, ...]

GET /api/datasets/:id
# Get specific dataset by ID
# Example: GET /api/datasets/1
# Response: { "id": 1, "title": "...", "about_dataset": "..." }
```

#### Models
```bash
GET /api/models
# Get all AI models
# Response: [{ "id": 1, "title": "...", "description": "..." }, ...]

GET /api/models/:id
# Get specific model by ID
# Example: GET /api/models/1
# Response: { "id": 1, "title": "...", "about_model": "..." }
```


### Chatbot API Endpoints (Port 8000)

#### Health Check
```bash
GET /health
# Check if chatbot service is running
# Response: { "status": "healthy", "model": "sarvam-m" }
```






## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original [AIKosh](https://aikosh.ai/) platform by the Government of India
- [Sarvam AI](https://www.sarvam.ai/) for their excellent LLM API
- The Rust, React, and Python communities

---

<p align="center">Made with love for India's AI ecosystem</p>

