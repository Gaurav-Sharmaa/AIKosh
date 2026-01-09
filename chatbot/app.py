"""
AI-Powered RAG Chatbot with Sarvam API
"""

import os
import json
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import faiss
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError("SARVAM_API_KEY not found in environment variables. Please check your .env file.")
SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
TOP_K = 4
MAX_CHARS = 1200

# CHANGE: Update data directory path to point to parent directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

LLM_PARAMS = {
    "model": "sarvam-m",
    "temperature": 0.3,
    "top_p": 0.9,
    "max_tokens": 2048,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
}

class Question(BaseModel):
    question: str

class Answer(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float

class RAGChatbot:
    def __init__(self, data_dir: str = None):
        # CHANGE: Use DATA_DIR constant if no dir provided
        self.data_dir = Path(data_dir) if data_dir else Path(DATA_DIR)
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        self.chunks = []
        self.metadata = []
        self.index = None

        logger.info(f"Initializing RAG Chatbot with data from: {self.data_dir}")
        self._load_data()
        self._build_index()
        logger.info("RAG Chatbot ready!")

    def _load_data(self):
        """Load and chunk all JSON files"""
        json_files = [
            "articles.json", "dashboard.json", "datasets.json",
            "models.json", "toolkit.json", "tutorials.json", "usecases.json"
        ]

        for filename in json_files:
            filepath = self.data_dir / filename
            if not filepath.exists():
                logger.warning(f"Warning: {filename} not found at {filepath}, skipping...")
                continue

            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if isinstance(data, list):
                for item in data:
                    self._process_item(item, filename)
            elif isinstance(data, dict):
                self._process_item(data, filename)

            logger.info(f"Loaded {filename}")

        logger.info(f"Total chunks created: {len(self.chunks)}")

    def _process_item(self, item: Dict, source: str):
        """Process a single item and create searchable chunk"""
        text_parts = []

        if 'title' in item:
            text_parts.append(f"Title: {item['title']}")
        if 'description' in item:
            text_parts.append(f"Description: {item['description']}")
        if 'about_dataset' in item:
            text_parts.append(f"About: {item['about_dataset']}")
        if 'about_model' in item:
            text_parts.append(f"About: {item['about_model']}")
        if 'about_use_case' in item:
            text_parts.append(f"About: {item['about_use_case']}")
        if 'content' in item:
            text_parts.append(f"Content: {item['content']}")
        if 'overview' in item:
            text_parts.append(f"Overview: {item['overview']}")
        if 'key_capabilities' in item:
            text_parts.append(f"Key Capabilities: {item['key_capabilities']}")

        if 'tags' in item and item['tags']:
            try:
                text_parts.append(f"Tags: {', '.join(item['tags'])}")
            except Exception:
                text_parts.append(f"Tags: {item.get('tags')}")

        chunk_text = "\n".join(text_parts)
        chunk_text = chunk_text[:MAX_CHARS]

        if chunk_text.strip():
            self.chunks.append(chunk_text)
            self.metadata.append({
                "source": source,
                "id": item.get('id', 'N/A'),
                "title": item.get('title', 'N/A'),
                "type": source.replace('.json', '')
            })

    def _build_index(self):
        """Build FAISS index from chunks"""
        logger.info("Building FAISS index...")

        embeddings = self.embedding_model.encode(
            self.chunks,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
        self.index.add(embeddings.astype('float32'))

        logger.info(f"FAISS index built with {len(self.chunks)} vectors")

    def retrieve(self, question: str) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant chunks"""
        question_embedding = self.embedding_model.encode(
            [question],
            convert_to_numpy=True
        )

        distances, indices = self.index.search(
            question_embedding.astype('float32'),
            TOP_K
        )

        results = []
        for i, idx in enumerate(indices[0]):
            results.append({
                "text": self.chunks[idx],
                "metadata": self.metadata[idx],
                "distance": float(distances[0][i])
            })

        return results

    def _call_sarvam(self, messages: List[Dict[str, str]], max_tries: int = 1) -> Dict[str, Any]:
        """Internal helper to call Sarvam API and return parsed JSON"""
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {"messages": messages, **LLM_PARAMS}
        try:
            response = requests.post(SARVAM_API_URL, headers=headers, json=payload, timeout=100)
            response.raise_for_status()
            raw = response.json()
            logger.info("Sarvam call successful. Available keys: %s", list(raw.keys()))
            return raw
        except requests.exceptions.RequestException as e:
            logger.exception("Error calling Sarvam API: %s", str(e))
            raise HTTPException(status_code=500, detail=f"Error calling Sarvam API: {str(e)}")

    def generate_answer(self, question: str, context: List[Dict]) -> Dict[str, Any]:
        """Generate answer using Sarvam API with auto-continue to avoid early stopping"""
        context_text = "\n\n".join([
            f'**{c["metadata"]["type"].upper()}**:\n{c["text"]}'
            for i, c in enumerate(context)
        ])

        SYSTEM_PROMPT = """You are an expert knowledge assistant for AIKosh, specializing in datasets, AI models, toolkits, and machine learning use cases.

PRIMARY OBJECTIVE:
Provide comprehensive, grounded answers using ONLY the retrieved information. Be detailed and thorough in your responses.

IMPORTANT COMPLETION RULE:
- Do NOT stop until ALL relevant datasets, models, tools, and use cases from the context are listed.
- If the answer is long, continue until finished.
- Never end the response mid-list or mid-explanation.
- End your reply with the exact token <END_OF_ANSWER> on a new line.
- If no relevant information is found, respond with "No relevant information found." followed by <END_OF_ANSWER>.

RESPONSE GUIDELINES:

Structure:
1. Start with a direct answer to the question
2. List ALL relevant resources (datasets, models, tools, use cases)
3. Provide brief descriptions for each resource
4. Explain relationships or how resources work together
5. Include use case context when relevant

Formatting:
- Use **bold** for dataset/model/toolkit names (e.g., **ImageNet**, **BERT**)
- Use bullet points for lists and features
- Keep descriptions clear and concise
- Organize information logically by category

What TO DO:
- Answer thoroughly with complete information
- Include specific names and details
- Mention capabilities, domain, or purpose of each resource
- Be conversational and professional
- List multiple options when available

What NOT TO DO:
- Do not give vague or incomplete answers
- Do not create tables, just give pointer answers
- Do not invent features or resources that aren't mentioned
- Do not include code examples or implementation details
- Do not mention the retrieval system or "context provided"
- Do not be vague - provide specific information
- Do not truncate or abbreviate your response

TONE:
Professional, knowledgeable, and accessible. Act as an expert who knows AIKosh resources well.

NOW RESPOND TO THE USER'S QUESTION WITH COMPLETE, DETAILED INFORMATION.
"""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Step 1: Identify ALL relevant resources from the context.
Step 2: Then produce a structured, complete answer with numbered sections (1-5).
End with the exact token <END_OF_ANSWER> on a new line.

Context:
{context_text}

Question:
{question}
"""}
        ]

        raw = self._call_sarvam(messages)
        if 'choices' not in raw or not raw['choices']:
            logger.error("Sarvam returned no choices: %s", raw)
            raise HTTPException(status_code=500, detail="Sarvam returned no choices")

        choice = raw['choices'][0]
        answer = choice.get('message', {}).get('content', '')
        finish_reason = choice.get('finish_reason')

        logger.info("Initial finish_reason=%s", finish_reason)

        max_continuations = 7
        continuations = 0

        while (finish_reason == 'length' or not answer.strip().endswith("<END_OF_ANSWER>")) and continuations < max_continuations:
            continuations += 1
            logger.info("Continuation attempt %d", continuations)

            messages.append({"role": "assistant", "content": answer})
            messages.append({"role": "user", "content": "Please continue the previous answer from where you left off. Do NOT repeat previous content. Continue until you include <END_OF_ANSWER>."})

            raw = self._call_sarvam(messages)
            if 'choices' not in raw or not raw['choices']:
                logger.error("Sarvam returned no choices during continuation: %s", raw)
                break

            choice = raw['choices'][0]
            more = choice.get('message', {}).get('content', '')
            finish_reason = choice.get('finish_reason')

            answer = answer + "\n" + more

            logger.info("Continuation finish_reason=%s", finish_reason)

            if continuations >= max_continuations:
                logger.warning("Reached max continuations (%d)", max_continuations)
                break

        answer = answer.replace("<END_OF_ANSWER>", "").strip()

        avg_distance = np.mean([c['distance'] for c in context]) if context else 0.0
        confidence = float(1 / (1 + avg_distance)) if context else 0.0

        return {
            "answer": answer,
            "sources": [c['metadata'] for c in context],
            "confidence": round(confidence, 2)
        }

app = FastAPI(
    title="AIKosh RAG Chatbot",
    description="AI-powered chatbot with RAG using Sarvam API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = None

@app.on_event("startup")
async def startup_event():
    global rag
    rag = RAGChatbot()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "chunks": len(rag.chunks) if rag else 0,
        "model": EMBEDDING_MODEL
    }

@app.post("/ask", response_model=Answer)
async def ask_question(question: Question):
    """Main endpoint to ask questions"""

    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")

    if not question.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    context = rag.retrieve(question.question)
    result = rag.generate_answer(question.question, context)

    return Answer(**result)

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "AIKosh RAG Chatbot API",
        "endpoints": {
            "health": "GET /health",
            "ask": "POST /ask",
            "docs": "GET /docs"
        }
    }

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║           AIKosh RAG Chatbot - Sarvam AI                  ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )