import faiss
import numpy as np
import os
import pickle
from google import genai
from ai_engine import _get_client

INDEXES_PATH = "indexes"
os.makedirs(INDEXES_PATH, exist_ok=True)


EMBED_MODEL = "gemini-embedding-001"


def get_embedding(text: str) -> list:
    """Get embedding vector for a text using Gemini Embeddings."""
    response = _get_client().models.embed_content(
        model=EMBED_MODEL,
        contents=text
    )
    return response.embeddings[0].values


def get_index_path(subject_code: str) -> str:
    """Return the folder path for a subject's FAISS index.

    ISOLATION GUARANTEE: each subject maps to exactly one folder
    indexes/<CODE>/. The code is sanitized to letters+digits only, so it can
    NEVER contain path separators or '..' — a subject can never read another
    subject's folder or escape the indexes directory.
    """
    import re
    # Keep only A-Z and 0-9 (AEL 101 / ael-101 → AEL101). Blocks path traversal.
    code = re.sub(r"[^A-Za-z0-9]", "", subject_code).upper()
    return os.path.join(INDEXES_PATH, code)


def add_texts(subject_code: str, texts: list):
    """Build and save a FAISS index for a subject from a list of text chunks."""
    path = get_index_path(subject_code)
    os.makedirs(path, exist_ok=True)

    embeddings = []
    valid_texts = []

    for text in texts:
        try:
            emb = get_embedding(text)
            embeddings.append(emb)
            valid_texts.append(text)
        except Exception as e:
            print(f"[FAISS] Error embedding text chunk: {e}")
            continue

    if not embeddings:
        print(f"[FAISS] No embeddings generated for {subject_code}.")
        return

    embeddings_np = np.array(embeddings).astype("float32")
    index = faiss.IndexFlatL2(embeddings_np.shape[1])
    index.add(embeddings_np)

    faiss.write_index(index, os.path.join(path, "index.faiss"))
    with open(os.path.join(path, "texts.pkl"), "wb") as f:
        pickle.dump(valid_texts, f)

    print(f"[FAISS] Index saved for {subject_code} — {len(valid_texts)} chunks.")


def search(subject_code: str, query: str, top_k: int = 5) -> list:
    """Search the FAISS index for relevant text chunks."""
    path = get_index_path(subject_code)
    index_file = os.path.join(path, "index.faiss")
    texts_file = os.path.join(path, "texts.pkl")
    marker = os.path.join(path, ".rebuilt_v2")

    if not os.path.exists(index_file) or not os.path.exists(texts_file):
        print(f"[FAISS] No index found for subject: {subject_code}")
        return []

    # Only trust indexes rebuilt with the current embedding model.
    # Non-rebuilt subjects fall back to general knowledge (safe, honest).
    if not os.path.exists(marker):
        print(f"[FAISS] Index for {subject_code} not rebuilt with current model — skipping.")
        return []

    index = faiss.read_index(index_file)
    with open(texts_file, "rb") as f:
        texts = pickle.load(f)

    try:
        query_vec = np.array([get_embedding(query)]).astype("float32")
    except Exception as e:
        print(f"[FAISS] Error embedding query: {e}")
        return []

    _, indices = index.search(query_vec, top_k)

    results = []
    for i in indices[0]:
        if 0 <= i < len(texts):
            results.append(texts[i])

    return results