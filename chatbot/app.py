import os

os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
import hashlib
import json
import logging
import pickle
import re
import threading
import time
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import faiss
import numpy as np
import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Silence third-party libraries — keep our own logs loud
for noisy_logger in [
    "httpx",
    "httpcore",
    "huggingface_hub",
    "sentence_transformers",
    "transformers",
    "urllib3",
    "filelock",
]:
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

# Disable HF download progress bars (the long ASCII bars in your terminal)
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# === Sarvam API config ===
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError(
        "SARVAM_API_KEY not found in environment variables. Please check your .env file."
    )
SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions"

# === Model config ===
# Multilingual embedder: maps Hindi queries and English chunks into the same
# 384D space, enabling cross-lingual retrieval.
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384
# English-only cross-encoder. Skipped on Hindi queries (would degrade ranking).
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# === Retrieval config ===
BM25_TOP_K = 20  # lexical candidates
FAISS_TOP_K = 20  # semantic candidates
RRF_K = 60  # Cormack et al. 2009 — industry default
RERANK_TOP_K = 5  # final chunks fed to LLM
MAX_WORDS_PER_CHUNK = 250

# === Paths ===
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = (BASE_DIR.parent / "data" / "seed").resolve()
CACHE_DIR = BASE_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_HASH_FILE = CACHE_DIR / "data_hash.txt"
CACHE_CHUNKS_FILE = CACHE_DIR / "chunks.pkl"
CACHE_FAISS_FILE = CACHE_DIR / "faiss.index"
CACHE_BM25_FILE = CACHE_DIR / "bm25.pkl"

# === Files indexed (skip dashboard.json + user.json — metadata/auth, not content) ===
DATA_FILES = [
    "datasets.json",
    "models.json",
    "usecases.json",
    "toolkit.json",
    "tutorials.json",
    "articles.json",
]

# === LLM params (UNCHANGED from your tuned values) ===
LLM_PARAMS = {
    "model": "sarvam-m",
    "temperature": 0.4,
    "top_p": 0.9,
    "max_tokens": 2000,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.0,
    "reasoning_effort": None,
}

# === Intent detection (UNCHANGED) ===
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


# === Pydantic schemas (UNCHANGED — Rust and React both rely on this contract) ===


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class Question(BaseModel):
    question: str
    history: Optional[List[Message]] = []  # Rust may omit; React always sends


class Answer(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


# === Helpers ===


def detect_language(text: str) -> str:
    # Returns "hi" if any Devanagari char (U+0900-U+097F) is present, else "en".
    return "hi" if re.search(r"[\u0900-\u097F]", text) else "en"


def tokenize_for_bm25(text: str) -> List[str]:
    # \w with re.UNICODE matches both ASCII and Devanagari word chars.
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


# === Chunker ===

# Long-form content fields, checked in priority order
LONG_FIELDS = [
    "about_use_case",
    "about_dataset",
    "about_model",
    "content",
    "overview",
    "key_capabilities",
]


def split_into_segments(text: str, max_words: int = MAX_WORDS_PER_CHUNK) -> List[str]:
    """
    Split long text into segments of at most max_words words.

    Strategy:
      1. Split on paragraph breaks (blank lines).
      2. Any paragraph still over the cap is further split at sentence
         boundaries (.!?) accumulating sentences until the cap is reached.
      3. Never breaks mid-sentence — preserves grammatical integrity for
         both the embedder and the reranker.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    segments: List[str] = []

    for para in paragraphs:
        words = para.split()
        if len(words) <= max_words:
            segments.append(para)
            continue

        sentences = re.split(r"(?<=[.!?])\s+", para)
        current: List[str] = []
        current_count = 0
        for sent in sentences:
            sent_word_count = len(sent.split())
            if current_count + sent_word_count > max_words and current:
                segments.append(" ".join(current))
                current = [sent]
                current_count = sent_word_count
            else:
                current.append(sent)
                current_count += sent_word_count
        if current:
            segments.append(" ".join(current))

    return segments


def build_record_header(record: Dict) -> str:
    # Compact metadata block that prefixes every chunk from this record.
    parts: List[str] = []
    if record.get("title"):
        parts.append(f"Title: {record['title']}")
    if record.get("description"):
        parts.append(f"Description: {record['description']}")
    tags = record.get("tags")
    if tags:
        tags_str = ", ".join(tags) if isinstance(tags, list) else str(tags)
        parts.append(f"Tags: {tags_str}")
    if record.get("sector"):
        parts.append(f"Sector: {record['sector']}")
    return "\n".join(parts)


def chunk_record(record: Dict, source: str) -> List[Dict[str, Any]]:
    """
    Convert one JSON record into one or more searchable chunks.

    - Short records (no long_field, or long_field <= MAX_WORDS) produce
      a single chunk containing header + the long_field text.
    - Long records (datasets with huge about_dataset, usecases with huge
      about_use_case, full articles) produce multiple chunks. Every chunk
      gets the metadata header as a prefix so it remains searchable on
      its own and the reranker has identifying context.

    Each chunk dict has shape:
        {
          "text": str,
          "meta": {"type", "id", "title", "source", "chunk_index", "total_chunks"}
        }
    """
    header = build_record_header(record)
    record_type = source.replace(".json", "")
    base_meta = {
        "type": record_type,
        "id": record.get("id", "N/A"),
        "title": record.get("title", "N/A"),
        "source": source,
    }

    # Pick the first non-empty long-form field
    long_text: Optional[str] = None
    for field in LONG_FIELDS:
        val = record.get(field)
        if isinstance(val, str) and val.strip():
            long_text = val.strip()
            break

    # No body content — header alone is the chunk
    if long_text is None:
        if not header.strip():
            return []
        return [
            {
                "text": header,
                "meta": {**base_meta, "chunk_index": 0, "total_chunks": 1},
            }
        ]

    # Body fits in one chunk
    if len(long_text.split()) <= MAX_WORDS_PER_CHUNK:
        full = f"{header}\n\nAbout: {long_text}" if header else f"About: {long_text}"
        return [
            {
                "text": full,
                "meta": {**base_meta, "chunk_index": 0, "total_chunks": 1},
            }
        ]

    # Multi-chunk: header prefixes every segment
    segments = split_into_segments(long_text, MAX_WORDS_PER_CHUNK)
    chunks: List[Dict[str, Any]] = []
    for i, seg in enumerate(segments):
        text = f"{header}\n\n{seg}" if header else seg
        chunks.append(
            {
                "text": text,
                "meta": {**base_meta, "chunk_index": i, "total_chunks": len(segments)},
            }
        )
    return chunks


# === Cache ===


def compute_data_hash(data_dir: Path) -> str:
    """SHA-256 over all indexed JSON file contents. Used to detect data changes."""
    h = hashlib.sha256()
    for filename in sorted(DATA_FILES):
        path = data_dir / filename
        if path.exists():
            h.update(filename.encode("utf-8"))
            h.update(path.read_bytes())
    return h.hexdigest()


def cache_is_valid(current_hash: str) -> bool:
    # All artifacts must exist AND the stored hash must match the current one.
    required = [CACHE_HASH_FILE, CACHE_CHUNKS_FILE, CACHE_FAISS_FILE, CACHE_BM25_FILE]
    if not all(p.exists() for p in required):
        return False
    try:
        stored = CACHE_HASH_FILE.read_text(encoding="utf-8").strip()
    except OSError as e:
        logger.warning("Could not read cache hash: %s", e)
        return False
    return stored == current_hash


# === Download heartbeat ===
# HF progress bars are disabled, so model downloads look like a hang on first
# run (470MB embedder + 80MB reranker). This emits a "still working" log line
# every 5 seconds during long-running blocking calls.


@contextmanager
def heartbeat(task_name: str, interval_seconds: float = 5.0):
    """
    Print a progress line every `interval_seconds` until the wrapped block exits.
    Use for opaque blocking operations like model downloads where we have no
    native progress signal.
    """
    stop_event = threading.Event()
    start_time = time.monotonic()

    def beat():
        while not stop_event.wait(interval_seconds):
            elapsed = int(time.monotonic() - start_time)
            logger.info("%s ... still working (%ds elapsed)", task_name, elapsed)

    beat_thread = threading.Thread(target=beat, daemon=True)
    beat_thread.start()
    try:
        yield
    finally:
        stop_event.set()
        beat_thread.join(timeout=1.0)
        elapsed = int(time.monotonic() - start_time)
        logger.info("%s done (%ds total)", task_name, elapsed)


# === RAG core ===


class RAGChatbot:
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir) if data_dir else DATA_DIR

        logger.info("Loading embedder: %s", EMBEDDING_MODEL)
        with heartbeat("Embedder download/load"):
            self.embedder = SentenceTransformer(EMBEDDING_MODEL)

        logger.info("Loading reranker: %s", RERANKER_MODEL)
        with heartbeat("Reranker download/load"):
            self.reranker = CrossEncoder(RERANKER_MODEL)

        self.chunks: List[Dict[str, Any]] = []
        self.index: Optional[faiss.Index] = None
        self.bm25: Optional[BM25Okapi] = None

        logger.info("Initializing RAG with data from: %s", self.data_dir)
        self._build_or_load()
        logger.info("RAG ready. Chunks indexed: %d", len(self.chunks))

    def _build_or_load(self):
        """Load indexes from disk if the cached hash matches current data; otherwise rebuild and persist."""
        current_hash = compute_data_hash(self.data_dir)

        if cache_is_valid(current_hash):
            logger.info("Cache hit — loading indexes from disk")
            try:
                self._load_from_cache()
                return
            except Exception as e:
                # Any cache corruption falls through to a fresh rebuild.
                logger.warning("Cache load failed (%s), rebuilding from scratch", e)

        logger.info("Cache miss or stale — rebuilding indexes")
        self._load_data()
        self._build_indexes()
        self._save_cache(current_hash)

    def _load_data(self):
        """Load and chunk all JSON files"""
        for filename in DATA_FILES:
            filepath = self.data_dir / filename
            if not filepath.exists():
                logger.warning("%s not found at %s, skipping", filename, filepath)
                continue

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (OSError, json.JSONDecodeError) as e:
                logger.error("Failed to load %s: %s", filename, e)
                continue

            records = data if isinstance(data, list) else [data]
            count_before = len(self.chunks)
            for rec in records:
                if isinstance(rec, dict):
                    self.chunks.extend(chunk_record(rec, filename))
            logger.info(
                "Loaded %s: %d records -> %d chunks (running total: %d)",
                filename,
                len(records),
                len(self.chunks) - count_before,
                len(self.chunks),
            )

        logger.info("Total chunks created: %d", len(self.chunks))

    def _build_indexes(self):
        """Build FAISS (cosine via inner-product on L2-normalized vectors) and BM25."""
        if not self.chunks:
            raise RuntimeError(
                "No chunks to index — check data directory and file names"
            )

        texts = [c["text"] for c in self.chunks]

        # FAISS: L2-normalized vectors + IndexFlatIP gives cosine similarity.
        # This is what sentence-transformer models are trained for (vs raw L2).
        logger.info("Encoding %d chunks for FAISS", len(texts))
        embeddings = self.embedder.encode(
            texts,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.index.add(embeddings)  # type: ignore[call-arg]
        logger.info(
            "FAISS index built: %d vectors @ %dD", self.index.ntotal, EMBEDDING_DIM
        )

        # BM25 over the same chunk texts, tokenized with the same Unicode-aware tokenizer.
        logger.info("Building BM25 index")
        tokenized = [tokenize_for_bm25(t) for t in texts]
        self.bm25 = BM25Okapi(tokenized)
        logger.info("BM25 index built")

    def _save_cache(self, current_hash: str):
        # Best-effort cache write — never fatal. If disk is full or perms wrong,
        # the chatbot still works, just slow on next restart.
        try:
            with open(CACHE_CHUNKS_FILE, "wb") as f:
                pickle.dump(self.chunks, f)
            faiss.write_index(self.index, str(CACHE_FAISS_FILE))
            with open(CACHE_BM25_FILE, "wb") as f:
                pickle.dump(self.bm25, f)
            CACHE_HASH_FILE.write_text(current_hash, encoding="utf-8")
            logger.info("Cache written to %s", CACHE_DIR)
        except (OSError, pickle.PickleError) as e:
            logger.warning("Failed to write cache (non-fatal): %s", e)

    def _load_from_cache(self):
        with open(CACHE_CHUNKS_FILE, "rb") as f:
            self.chunks = pickle.load(f)
        loaded_index = faiss.read_index(str(CACHE_FAISS_FILE))
        self.index = loaded_index
        with open(CACHE_BM25_FILE, "rb") as f:
            self.bm25 = pickle.load(f)
        logger.info(
            "Cache loaded: %d chunks, FAISS %d vectors",
            len(self.chunks),
            loaded_index.ntotal,
        )

    def retrieve(self, question: str) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval pipeline:
          1. BM25 top-20 (lexical, catches exact names like 'PMFBY', 'AGMARKNET')
          2. FAISS top-20 (semantic, cross-lingual via multilingual embedder)
          3. RRF fusion -> top-20 candidates (rank-position-based, no score normalization)
          4. If English: cross-encoder rerank -> top-5
             If Hindi:    take top-5 directly from RRF (cross-encoder is English-trained)
          5. Group chunks belonging to the same parent record into one context entry.
        """
        if self.index is None or self.bm25 is None:
            raise RuntimeError("Indexes not initialized")

        language = detect_language(question)

        # === Stage 1: BM25 lexical retrieval ===
        # Tokenize the question and score every chunk by keyword overlap.
        question_tokens = tokenize_for_bm25(question)
        bm25_all_scores = self.bm25.get_scores(question_tokens)
        # argsort returns ascending order; reverse and take the top BM25_TOP_K indices.
        bm25_top_indices = np.argsort(bm25_all_scores)[::-1][:BM25_TOP_K].tolist()

        # === Stage 2: FAISS semantic retrieval ===
        # Encode the question into the same 384D space as the indexed chunks.
        # normalize_embeddings=True is required for IndexFlatIP to compute cosine similarity.
        question_embedding = self.embedder.encode(
            [question],
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")
        _, faiss_indices = self.index.search(question_embedding, FAISS_TOP_K)  # type: ignore[call-arg]
        # FAISS returns -1 for empty slots when fewer than k results exist.
        faiss_top_indices = [int(i) for i in faiss_indices[0] if i >= 0]

        # === Stage 3: Reciprocal Rank Fusion ===
        # Merge BM25 and FAISS results by RANK POSITION, not by raw score.
        # Formula: score = 1/(60+rank). A chunk in both lists gets both terms added.
        # Source: Cormack, Clarke, Buettcher (SIGIR 2009). k=60 is the standard.
        fused_scores: Dict[int, float] = {}
        for rank_position, chunk_index in enumerate(bm25_top_indices, start=1):
            fused_scores[chunk_index] = fused_scores.get(chunk_index, 0.0) + 1.0 / (
                RRF_K + rank_position
            )
        for rank_position, chunk_index in enumerate(faiss_top_indices, start=1):
            fused_scores[chunk_index] = fused_scores.get(chunk_index, 0.0) + 1.0 / (
                RRF_K + rank_position
            )

        # Sort by fused score, descending. These are the candidates for reranking.
        sorted_by_fusion = sorted(
            fused_scores.items(), key=lambda kv: kv[1], reverse=True
        )
        candidate_indices = [
            chunk_index for chunk_index, _ in sorted_by_fusion[:BM25_TOP_K]
        ]

        # === Stage 4: Cross-encoder rerank (English only) ===
        # The cross-encoder reads (question, chunk) together and scores true relevance.
        # Skipped for Hindi because the model is trained on English MS MARCO data.
        if language == "en" and candidate_indices:
            question_chunk_pairs = [
                (question, self.chunks[i]["text"]) for i in candidate_indices
            ]
            try:
                rerank_scores = self.reranker.predict(question_chunk_pairs)
                reranked = sorted(
                    zip(candidate_indices, rerank_scores),
                    key=lambda pair: float(pair[1]),
                    reverse=True,
                )
                final_indices = [
                    int(chunk_index) for chunk_index, _ in reranked[:RERANK_TOP_K]
                ]
            except Exception as e:
                logger.warning("Reranker failed (%s), falling back to RRF order", e)
                final_indices = candidate_indices[:RERANK_TOP_K]
        else:
            # Hindi path: trust the RRF ranking. Cross-encoder would add noise here.
            final_indices = candidate_indices[:RERANK_TOP_K]

        # === Stage 5: Group chunks by parent record ===
        # If two chunks from the same usecase both ranked highly, merge them
        # so the LLM sees ONE source, not two duplicates of the same record.
        return self._group_by_parent(final_indices)

    def _group_by_parent(self, indices: List[int]) -> List[Dict[str, Any]]:
        """
        Merge chunks belonging to the same parent record into one context entry.

        Order is preserved by first appearance — so the best-ranked chunk's
        parent appears first, even if a later chunk from the same parent adds text.
        Prevents the LLM from seeing the same usecase 3 times as 3 separate sources.
        """
        grouped: Dict[Tuple[str, Any], Dict[str, Any]] = {}
        order: List[Tuple[str, Any]] = []

        for idx in indices:
            chunk = self.chunks[idx]
            meta = chunk["meta"]
            key = (meta["type"], meta["id"])
            if key not in grouped:
                grouped[key] = {
                    "text": chunk["text"],
                    "metadata": {
                        "type": meta["type"],
                        "id": meta["id"],
                        "title": meta["title"],
                        "source": meta["source"],
                    },
                }
                order.append(key)
            else:
                grouped[key]["text"] += "\n\n" + chunk["text"]

        return [grouped[k] for k in order]

    # === Sarvam call layer (UNCHANGED) ===

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
        """
        Strip Sarvam-M reasoning tags.

        Properly closed <think>...</think> blocks are removed entirely.
        Unclosed <think> (model ran out of tokens mid-thought) is handled
        by keeping whatever came AFTER the last unclosed <think> if any
        closing </think> exists later, otherwise we treat content before
        the unclosed <think> as the answer.
        """
        # Pass 1: remove all properly closed <think>...</think> pairs
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)

        # Pass 2: handle dangling tags
        if "<think>" in text and "</think>" not in text:
            # Unclosed <think> — content before it is the answer (if any),
            # content after it is incomplete reasoning, discard the latter.
            text = text.split("<think>")[0]
        elif "</think>" in text and "<think>" not in text:
            # Orphan </think> — answer is what comes AFTER it
            text = text.split("</think>")[-1]

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
- NEVER use facts, dates, organizations, abbreviations (like NIC, ISRO, RBI), or background info that is not literally written in the context below — your general knowledge is OFF-LIMITS for resource questions
- If the context has no matching resources, say "I couldn't find a match for that in AIKosh right now"
- NEVER show <think> tags or reasoning steps to the user
- NEVER write numbered sections like "1. Direct Answer", "2. Resources"
- NEVER use tables
- NEVER use emojis or symbol bullets (1️⃣ 2️⃣ etc.)
- NEVER start with "Certainly!", "Great question!", "Of course!" or similar filler phrases
- NEVER repeat what the user just said back to them
- Keep total response under 300 words for most cases
- Respond in the language of the user's LATEST message only. English message -> English reply. Devanagari (Hindi) message -> Hindi reply. Ignore earlier turns. Resource names stay English.{context_section}"""

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

        # Guard against empty responses (happens when Sarvam returns only <think> content)
        if not answer.strip():
            logger.warning("Empty answer after stripping think tags — using fallback")
            if context:
                # We had retrieval results, so give a minimal generic acknowledgement
                answer = "I found some relevant resources but couldn't generate a clean response. Please try rephrasing your question."
            else:
                answer = "I'm not sure how to respond to that. Could you rephrase your question?"

        return {
            "answer": answer,
            "sources": [c["metadata"] for c in context],
        }


# === FastAPI app ===

rag: Optional[RAGChatbot] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag
    rag = RAGChatbot()
    yield


app = FastAPI(
    title="AIKosh RAG Chatbot",
    description="Hybrid (BM25 + FAISS + RRF + cross-encoder) bilingual RAG with Sarvam-M",
    version="3.0.0",
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
        "embedder": EMBEDDING_MODEL,
        "reranker": RERANKER_MODEL,
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
    lang = detect_language(raw)
    logger.info("intent=%s lang=%s q=%s", intent, lang, raw)

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
        "message": "AIKosh RAG Chatbot API v3 (Hybrid + Bilingual)",
        "endpoints": {"health": "GET /health", "ask": "POST /ask", "docs": "GET /docs"},
    }


if __name__ == "__main__":
    print("AIKosh RAG Chatbot v3 - Hybrid Retrieval + Bilingual Sarvam AI")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
