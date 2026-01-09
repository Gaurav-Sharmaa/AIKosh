# AIKosh RAG Chatbot

Python FastAPI backend for the AIKosh intelligent chatbot.

## Setup

1. Create virtual environment:

```bash
python -m venv .venv
.venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

```bash
# Create .env file and add your Sarvam API key
echo "SARVAM_API_KEY=your_key_here" > .env
```

4. Run the server:

```bash
python app.py
```

Server will run on http://localhost:8000

## Endpoints

- GET /health - Health check
- POST /ask - Ask a question
- GET /docs - API documentation