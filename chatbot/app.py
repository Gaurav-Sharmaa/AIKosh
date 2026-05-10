import json
import logging
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

import faiss
import numpy as np
import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError(
        "SARVAM_API_KEY not found in environment variables. Please check your .env file."
    )
SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
TOP_K = 4
MAX_CHARS = 1200
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "seed")

LLM_PARAMS = {
    "model": "sarvam-m",
    "temperature": 0.4,
    "top_p": 0.9,
    "max_tokens": 2000,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.0,
}

CASUAL_PHRASES = {
    "hello",
    "hi",
    "hey",
    "hii",
    "hiii",
    "hiiii",
    "thanks",
    "thank you",
    "thankyou",
    "thank u",
    "ty",
    "bye",
    "goodbye",
    "see you",
    "see ya",
    "cya",
    "good morning",
    "good evening",
    "good night",
    "good afternoon",
    "how are you",
    "how r u",
    "how are u",
    "wassup",
    "what's up",
    "whats up",
    "ok",
    "okay",
    "k",
    "kk",
    "alright",
    "sure",
    "got it",
    "noted",
    "wow",
    "nice",
    "cool",
    "great",
    "awesome",
    "amazing",
    "perfect",
    "yes",
    "no",
    "nope",
    "yep",
    "yeah",
    "yup",
    "haha",
    "lol",
    "hehe",
    "test",
    "testing",
}

CAPABILITY_PHRASES = {
    "what can you do",
    "what do you do",
    "help me",
    "help",
    "how do you work",
    "how does this work",
    "what is this",
    "what are you",
    "who are you",
    "what is aikosh",
    "tell me about yourself",
    "introduce yourself",
    "what can i ask",
    "what should i ask",
}

OUT_OF_SCOPE_KEYWORDS = {
    "weather",
    "stock",
    "cricket",
    "ipl",
    "movie",
    "recipe",
    "joke",
    "news",
    "sports",
    "politics",
    "song",
    "music",
    "translate",
    "capital of",
    "who is the president",
    "population of",
}

FRUSTRATION_PHRASES = {
    "this is useless",
    "you are stupid",
    "bad bot",
    "worst chatbot",
    "not helpful",
    "you don't understand",
    "terrible",
    "shut up",
    "stop",
    "enough",
}


def detect_intent(question: str) -> str:
    """
    Classify the user message into one of 5 intents:
      - CASUAL       : greetings, thanks, small talk
      - CAPABILITY   : asking what the bot can do
      - OUT_OF_SCOPE : questions completely outside AIKosh
      - FRUSTRATION  : user is annoyed or testing limits
      - RESOURCE     : actual AIKosh resource/search question (default)
    """
    q = question.strip().lower()

    q_clean = re.sub(r"[^\w\s]", "", q)

    if q_clean in CASUAL_PHRASES:
        return "CASUAL"

    words = q_clean.split()
    if len(words) <= 2 and q_clean in CASUAL_PHRASES:
        return "CASUAL"

    if any(phrase in q_clean for phrase in CAPABILITY_PHRASES):
        return "CAPABILITY"

    if any(phrase in q_clean for phrase in FRUSTRATION_PHRASES):
        return "FRUSTRATION"

    if any(keyword in q_clean for keyword in OUT_OF_SCOPE_KEYWORDS):
        return "OUT_OF_SCOPE"

    return "RESOURCE"


class Message(BaseModel):
    role: str  # "user"
    content: str


class Question(BaseModel):
    question: str
    history: Optional[List[Message]] = []  # conversation history


class Answer(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


class RAGChatbot:
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir) if data_dir else Path(DATA_DIR)
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        self.chunks: List[str] = []
        self.metadata: List[Dict] = []
        self.index: Optional[faiss.IndexFlatL2] = None

        logger.info(f"Initializing RAG Chatbot with data from: {self.data_dir}")
        self._load_data()
        self._build_index()
        logger.info("RAG Chatbot ready!")

    def _load_data(self):
        """Load and chunk all JSON files"""
        json_files = [
            "articles.json",
            "dashboard.json",
            "datasets.json",
            "models.json",
            "toolkit.json",
            "tutorials.json",
            "usecases.json",
        ]

        for filename in json_files:
            filepath = self.data_dir / filename
            if not filepath.exists():
                logger.warning(
                    f"Warning: {filename} not found at {filepath}, skipping..."
                )
                continue

            with open(filepath, "r", encoding="utf-8") as f:
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

        if "title" in item:
            text_parts.append(f"Title: {item['title']}")
        if "description" in item:
            text_parts.append(f"Description: {item['description']}")
        if "about_dataset" in item:
            text_parts.append(f"About: {item['about_dataset']}")
        if "about_model" in item:
            text_parts.append(f"About: {item['about_model']}")
        if "about_use_case" in item:
            text_parts.append(f"About: {item['about_use_case']}")
        if "content" in item:
            text_parts.append(f"Content: {item['content']}")
        if "overview" in item:
            text_parts.append(f"Overview: {item['overview']}")
        if "key_capabilities" in item:
            text_parts.append(f"Key Capabilities: {item['key_capabilities']}")

        if "tags" in item and item["tags"]:
            try:
                text_parts.append(f"Tags: {', '.join(item['tags'])}")
            except Exception:
                text_parts.append(f"Tags: {item.get('tags')}")

        chunk_text = "\n".join(text_parts)
        chunk_text = chunk_text[:MAX_CHARS]

        if chunk_text.strip():
            self.chunks.append(chunk_text)
            self.metadata.append(
                {
                    "source": source,
                    "id": item.get("id", "N/A"),
                    "title": item.get("title", "N/A"),
                    "type": source.replace(".json", ""),
                }
            )

            """Build FAISS index from chunks"""

    def _build_index(self):
        logger.info("Building FAISS index...")
        embeddings: np.ndarray = self.embedding_model.encode(
            self.chunks, show_progress_bar=True, convert_to_numpy=True
        )
        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
        self.index.add(embeddings.astype("float32"))  # type: ignore[arg-type]
        logger.info(f"FAISS index built with {len(self.chunks)} vectors")

    def retrieve(self, question: str) -> List[Dict[str, Any]]:
        assert self.index is not None, "FAISS index not built yet"
        question_embedding: np.ndarray = self.embedding_model.encode(
            [question], convert_to_numpy=True
        )
        distances, indices = self.index.search(  # type: ignore[call-arg]
            question_embedding.astype("float32"), TOP_K
        )

        results = []
        for i, idx in enumerate(indices[0]):
            results.append(
                {
                    "text": self.chunks[idx],
                    "metadata": self.metadata[idx],
                    "distance": float(distances[0][i]),
                }
            )

        return results

    def _call_sarvam(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Call Sarvam API and return parsed JSON"""
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
        }
        payload = {"messages": messages, **LLM_PARAMS}
        try:
            response = requests.post(
                SARVAM_API_URL, headers=headers, json=payload, timeout=100
            )
            response.raise_for_status()
            raw = response.json()
            logger.info("Sarvam call successful.")
            return raw
        except requests.exceptions.RequestException as e:
            logger.exception("Error calling Sarvam API: %s", str(e))
            raise HTTPException(
                status_code=500, detail=f"Error calling Sarvam API: {str(e)}"
            )

    def _strip_think_tags(self, text: str) -> str:
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        text = re.sub(r"<think>.*", "", text, flags=re.DOTALL)
        return text.strip()

    def generate_answer(
        self, question: str, context: List[Dict], history: List[Message]
    ) -> Dict[str, Any]:
        """
        Generate answer using Sarvam API.
        - history: previous turns so the model has memory of the conversation
        - context: RAG chunks (empty for non-RESOURCE intents)
        """

        if context:
            context_text = "\n\n".join(
                [
                    f"**{c['metadata']['type'].upper()}** — {c['metadata']['title']}:\n{c['text']}"
                    for c in context
                ]
            )
            context_section = f"\n\nAIKosh Database Context:\n{context_text}"
        else:
            context_section = ""

        SYSTEM_PROMPT = f"""You are AIKosh Assistant — a friendly, helpful guide for India's National AI Repository (AIKosh).
AIKosh contains datasets, AI models, use cases, toolkits, tutorials, and articles focused on Indian AI.

YOUR PERSONALITY:
- Friendly and conversational, not robotic or overly formal
- Honest — if you don't know something or it's outside AIKosh, say so clearly
- Concise — never write walls of text

INTENT HANDLING RULES — read these carefully:

1. CASUAL (greetings, thanks, small talk):
   → Reply in 1-2 warm, friendly sentences. No searching. No lists. Just be human.
   → Examples: "hello" → "Hey! What can I help you find on AIKosh today?"

2. CAPABILITY (user asks what you can do):
   → Briefly explain AIKosh in 2-3 sentences, then invite them to ask a question.

3. RESOURCE QUESTION (user describes a problem or asks for datasets/models/tools):
   → Use the context below to recommend the TOP 3-5 most relevant resources only.
   → Use this exact format for each resource:
      **[Resource Name]** *(type)*
      - What it does: one sentence
      - Why it fits: one sentence
   → After listing resources, add one short closing sentence.
   → Never list ALL resources. Only the most relevant ones.

4. FOLLOW-UP QUESTION (user says "tell me more", "what about the first one", "explain that"):
   → Use the conversation history to understand what they mean.
   → Give a focused 3-5 sentence explanation of the specific thing they asked about.

5. OUT OF SCOPE (weather, cricket, movies, jokes, general knowledge unrelated to AIKosh):
   → Politely say this is outside what you cover, in one sentence.
   → Offer to help them find something on AIKosh instead.

6. FRUSTRATION (user is annoyed or says the bot is bad):
   → Acknowledge their frustration briefly and ask how you can do better.
   → Never argue or get defensive.

7. UNCLEAR / VAGUE (you genuinely cannot tell what they want):
   → Ask one short clarifying question. Never guess wildly.

HARD RULES FOR ALL RESPONSES:
- NEVER invent resource names, datasets, or models not explicitly mentioned in the context provided
- If the context has no matching resources, say "I couldn't find a match for that in AIKosh right now"
- NEVER show <think> tags or reasoning steps to the user
- NEVER write numbered sections like "1. Direct Answer", "2. Resources"
- NEVER use tables
- NEVER start with "Certainly!", "Great question!", "Of course!" or similar filler phrases
- NEVER repeat what the user just said back to them
- Keep total response under 300 words for most cases
- Respond in the same language the user writes in{context_section}"""

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for turn in history:
            messages.append({"role": turn.role, "content": turn.content})

        messages.append({"role": "user", "content": question})

        raw = self._call_sarvam(messages)

        if "choices" not in raw or not raw["choices"]:
            logger.error("Sarvam returned no choices: %s", raw)
            raise HTTPException(status_code=500, detail="Sarvam returned no choices")

        choice = raw["choices"][0]
        answer = choice.get("message", {}).get("content", "")
        finish_reason = choice.get("finish_reason")

        logger.info("finish_reason=%s", finish_reason)

        max_continuations = 1
        continuations = 0

        while finish_reason == "length" and continuations < max_continuations:
            continuations += 1
            logger.info("Continuation attempt %d", continuations)

            messages.append({"role": "assistant", "content": answer})
            messages.append(
                {
                    "role": "user",
                    "content": "Please continue your previous answer from where you left off. Do not repeat anything.",
                }
            )

            raw = self._call_sarvam(messages)
            if "choices" not in raw or not raw["choices"]:
                break

            choice = raw["choices"][0]
            more = choice.get("message", {}).get("content", "")
            finish_reason = choice.get("finish_reason")
            answer = answer + "\n" + more

        answer = self._strip_think_tags(answer)

        return {
            "answer": answer,
            "sources": [c["metadata"] for c in context],
        }


rag = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag
    rag = RAGChatbot()
    yield  # app runs here


app = FastAPI(
    title="AIKosh RAG Chatbot",
    description="AI-powered chatbot with RAG using Sarvam API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "chunks": len(rag.chunks) if rag else 0,
        "model": EMBEDDING_MODEL,
    }


@app.post("/ask", response_model=Answer)
async def ask_question(question: Question):
    """Main endpoint to ask questions"""

    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")

    raw = question.question.strip()

    if not raw:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if len(raw) > 500:
        raise HTTPException(
            status_code=400,
            detail="Question is too long. Please keep it under 500 characters.",
        )

    intent = detect_intent(raw)
    logger.info("Detected intent: %s for question: %s", intent, raw)

    if intent == "RESOURCE":
        context = rag.retrieve(raw)
    else:
        context = []

    result = rag.generate_answer(raw, context, question.history or [])

    return Answer(**result)


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "AIKosh RAG Chatbot API v2",
        "endpoints": {"health": "GET /health", "ask": "POST /ask", "docs": "GET /docs"},
    }


if __name__ == "__main__":
    print("AIKosh RAG Chatbot - Sarvam AI")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
