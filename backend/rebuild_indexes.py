"""
Re-embed existing text chunks with gemini-embedding-001 and rebuild FAISS indexes.
Reuses texts.pkl (no PDF re-parsing). RESUMABLE: checkpoints per subject, so you can
re-run this as many times as needed and it continues where it stopped.
"""
import os
import time
import pickle
import numpy as np
import faiss
from google import genai

EMBED_MODEL = "gemini-embedding-001"
INDEXES_PATH = "indexes"
BATCH_SIZE = 20
MARKER = ".rebuilt_v2"
PARTIAL = "_partial.pkl"


def _load_keys():
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


def embed_batch(texts):
    """Try all keys; if all exhausted, wait and keep trying (never give up)."""
    global _idx
    full_sweeps = 0
    attempt = 0
    while True:
        client = CLIENTS[_idx % len(CLIENTS)]
        try:
            resp = client.models.embed_content(model=EMBED_MODEL, contents=texts)
            return [e.values for e in resp.embeddings]
        except Exception as e:
            msg = str(e).lower()
            _idx += 1
            attempt += 1
            if any(k in msg for k in ["429", "rate", "quota", "exhausted", "resource"]):
                if attempt % len(CLIENTS) == 0:
                    full_sweeps += 1
                    wait = min(30 * full_sweeps, 120)
                    print(f"    all keys busy (sweep {full_sweeps}) — waiting {wait}s...")
                    time.sleep(wait)
                continue
            else:
                print(f"    error: {str(e)[:110]}")
                time.sleep(3)
                if attempt > len(CLIENTS) * 3:
                    return None


def rebuild_subject(code):
    path = os.path.join(INDEXES_PATH, code)
    texts_file = os.path.join(path, "texts.pkl")
    marker = os.path.join(path, MARKER)
    partial_file = os.path.join(path, PARTIAL)
    if os.path.exists(marker):
        print(f"[{code}] already done, skipping.")
        return
    if not os.path.exists(texts_file):
        print(f"[{code}] no texts.pkl, skipping.")
        return

    with open(texts_file, "rb") as f:
        texts = pickle.load(f)

    # Resume from checkpoint
    done_vecs = []
    if os.path.exists(partial_file):
        with open(partial_file, "rb") as f:
            done_vecs = pickle.load(f)
        print(f"[{code}] resuming from {len(done_vecs)}/{len(texts)}")
    else:
        print(f"[{code}] {len(texts)} chunks — embedding...")

    start = len(done_vecs)
    for i in range(start, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        vecs = embed_batch(batch)
        if vecs is None:
            print(f"[{code}] hard error at {i}, saving checkpoint & aborting.")
            with open(partial_file, "wb") as f:
                pickle.dump(done_vecs, f)
            return
        done_vecs.extend(vecs)
        # checkpoint every batch
        with open(partial_file, "wb") as f:
            pickle.dump(done_vecs, f)
        print(f"[{code}] {min(i + BATCH_SIZE, len(texts))}/{len(texts)}")
        time.sleep(1.2)

    arr = np.array(done_vecs).astype("float32")
    index = faiss.IndexFlatL2(arr.shape[1])
    index.add(arr)
    faiss.write_index(index, os.path.join(path, "index.faiss"))
    open(marker, "w").close()
    if os.path.exists(partial_file):
        os.remove(partial_file)
    print(f"[{code}] DONE - {len(done_vecs)} vectors")


if __name__ == "__main__":
    # Smallest subjects first so we finish many quickly before the big ones
    subjects = [d for d in os.listdir(INDEXES_PATH) if os.path.isdir(os.path.join(INDEXES_PATH, d))]
    def size(code):
        p = os.path.join(INDEXES_PATH, code, "texts.pkl")
        try:
            return len(pickle.load(open(p, "rb")))
        except Exception:
            return 0
    subjects.sort(key=size)
    print(f"Rebuilding {len(subjects)} subjects with {EMBED_MODEL}\n")
    for code in subjects:
        rebuild_subject(code)
    print("\nAll done.")
