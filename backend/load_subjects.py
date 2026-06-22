import os
import PyPDF2
from faiss_engine import add_texts

SUBJECTS_DIR = "subjects"

def load_pdf_text(pdf_path):
    texts = []
    try:
        with open(pdf_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
                    texts.extend(chunks)
    except Exception as e:
        print(f"❌ Error reading {pdf_path}: {e}")
    return texts

def load_all_subjects():
    for subject_code in os.listdir(SUBJECTS_DIR):
        subject_path = os.path.join(SUBJECTS_DIR, subject_code)
        
        if not os.path.isdir(subject_path):
            continue
        
        all_texts = []
        for filename in os.listdir(subject_path):
            if filename.lower().endswith('.pdf'):
                pdf_path = os.path.join(subject_path, filename)
                print(f"Loading {filename} for {subject_code}...")
                texts = load_pdf_text(pdf_path)
                all_texts.extend(texts)
        
        if all_texts:
            add_texts(subject_code, all_texts)
            print(f"✅ {subject_code}: {len(all_texts)} chunks loaded")
        else:
            print(f"⚠️ {subject_code}: no PDFs found")

if __name__ == "__main__":
    load_all_subjects()