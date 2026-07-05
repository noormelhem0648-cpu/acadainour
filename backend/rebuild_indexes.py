"""
Re-embed existing text chunks with the current embedding model (gemini-embedding-001)
and rebuild each subject's FAISS index. Reuses texts.pkl — does NOT re-parse PDFs.
Resumable: skips subjects whose index was already rebuilt in this run (marker file).
"""
import os
import time
import pickle
import numpy as np
import faiss
from google import genai

EMBED_MODEL = "gemini-embedding-001"
INDEXES_PATH = "indexes"
BATCH_SIZE = 80
MARKER = ".rebuilt_v2"  # presence means this subject is done with new model


def _load_keys():
    """Load all keys from env and from keys.txt / .env.keys (one per line)."""
    keys = []
    for name in ["GEMINI_API_KEY"] + [f"GEMINI_API_KEY{i}" for i in range(1, 30)] + [f"GEMINI_API_KEY_{i}" for i in range(1, 30)]:
        v = os.getenv(name)
        if v and v not in keys:
            keys.append(v)
    for f in ["keys.txt", ".env.keys"]:
        if os.path.exists(f):
            for line in open(f):
                k = line.strip()
                if k and not k.startswith("#") and k not in keys:
                    keys.append(k)
    return keys


KEYS = _load_keys()
if not KEYS:
    raise SystemExit("No API keys found. Put them in keys.txt (one per line).")
CLIENTS = [genai.Client(api_key=k) for k in KEYS]
print(f"Loaded {len(CLIENTS)} API key(s) for rotation.")
_idx = 0


def embed_batch(texts, retries=None):
    global _idx
    retries = retries or (len(CLIENTS) * 2 + 3)
    for attempt in range(retries):
        client = CLIENTS[_idx % len(CLIENTS)]
        try:
            resp = client.models.embed_content(model=EMBED_MODEL, contents=texts)
            return [e.values for e in resp.embeddings]
        except Exception as e:
            msg = str(e).lower()
            if any(k in msg for k in ["429", "rate", "quota", "exhausted"]):
                _idx += 1  # rotate to next key immediately
                if attempt >= len(CLIENTS):
                    time.sleep(5)
                continue
            print(f"    batch error: {str(e)[:120]}")
            time.sleep(3)
            _idx += 1
    return None


def rebuild_subject(code):
    path = os.path.join(INDEXES_PATH, code)
    texts_file = os.path.join(path, "texts.pkl")
    marker = os.path.join(path, MARKER)
    if os.path.exists(marker):
        print(f"[{code}] already rebuilt, skipping.")
        return
    if not os.path.exists(texts_file):
        print(f"[{code}] no texts.pkl, skipping.")
        return

    with open(texts_file, "rb") as f:
        texts = pickle.load(f)
    print(f"[{code}] {len(texts)} chunks — embedding...")

    all_vecs = []
    valid_texts = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        vecs = embed_batch(batch)
        if vecs is None:
            print(f"[{code}] FAILED at batch {i}. Aborting this subject.")
            return
        all_vecs.extend(vecs)
        valid_texts.extend(batch)
        done = min(i + BATCH_SIZE, len(texts))
        print(f"[{code}] {done}/{len(texts)}")
        time.sleep(0.3)

    arr = np.array(all_vecs).astype("float32")
    index = faiss.IndexFlatL2(arr.shape[1])
    index.add(arr)
    faiss.write_index(index, os.path.join(path, "index.faiss"))
    with open(texts_file, "wb") as f:
        pickle.dump(valid_texts, f)
    open(marker, "w").close()
    print(f"[{code}] ✅ DONE — {len(valid_texts)} vectors, dim {arr.shape[1]}")


if __name__ == "__main__":
    subjects = sorted(d for d in os.listdir(INDEXES_PATH) if os.path.isdir(os.path.join(INDEXES_PATH, d)))
    print(f"Rebuilding {len(subjects)} subjects with {EMBED_MODEL}\n")
    for code in subjects:
        rebuild_subject(code)
    print("\nAll done.")
