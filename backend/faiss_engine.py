import faiss
import numpy as np
import os
import pickle
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

INDEXES_PATH = "indexes"
os.makedirs(INDEXES_PATH, exist_ok=True)

def get_embedding(text):
    response = client.models.embed_content(
        model="gemini-embedding-exp-03-07",
        contents=text
    )
    return response.embeddings[0].values

def get_index_path(subject_code):
    return os.path.join(INDEXES_PATH, subject_code)

def add_texts(subject_code, texts):
    path = get_index_path(subject_code)
    os.makedirs(path, exist_ok=True)
    
    embeddings = []
    for text in texts:
        try:
            emb = get_embedding(text)
            embeddings.append(emb)
        except Exception as e:
            print(f"Error embedding text: {e}")
            continue
    
    if not embeddings:
        return
    
    embeddings = np.array(embeddings).astype('float32')
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    
    faiss.write_index(index, os.path.join(path, "index.faiss"))
    
    with open(os.path.join(path, "texts.pkl"), 'wb') as f:
        pickle.dump(texts, f)

def search(subject_code, query, top_k=5):
    path = get_index_path(subject_code)
    index_file = os.path.join(path, "index.faiss")
    texts_file = os.path.join(path, "texts.pkl")
    
    if not os.path.exists(index_file):
        return []
    
    index = faiss.read_index(index_file)
    
    with open(texts_file, 'rb') as f:
        texts = pickle.load(f)
    
    try:
        query_vec = get_embedding(query)
        query_vec = np.array([query_vec]).astype('float32')
    except Exception as e:
        print(f"Error embedding query: {e}")
        return []
    
    _, indices = index.search(query_vec, top_k)
    
    results = []
    for i in indices[0]:
        if i < len(texts):
            results.append(texts[i])
    
    return results