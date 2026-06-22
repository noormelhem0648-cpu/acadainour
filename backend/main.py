from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from db import init_db, get_history
from ai_engine import ask, generate_quiz, check_quiz_answer
from faiss_engine import add_texts
import PyPDF2
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/")
def root():
    return {"message": "AcadAI Backend Running!"}


@app.post("/ask")
def ask_question(
    student_id: str = Form(...),
    subject_code: str = Form(...),
    question: str = Form(...)
):
    answer = ask(student_id, subject_code, question)
    return {"answer": answer}


@app.post("/upload-pdf")
def upload_pdf(
    subject_code: str = Form(...),
    file: UploadFile = File(...)
):
    content = file.file.read()
    pdf = PyPDF2.PdfReader(io.BytesIO(content))
    
    texts = []
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            chunks = [text[i:i+500] for i in range(0, len(text), 500)]
            texts.extend(chunks)
    
    add_texts(subject_code, texts)
    
    return {"message": f"PDF uploaded successfully for {subject_code}"}


@app.get("/history/{student_id}/{subject_code}")
def get_chat_history(student_id: str, subject_code: str):
    history = get_history(student_id, subject_code)
    return {"history": history}


@app.post("/quiz")
def create_quiz(
    student_id: str = Form(...),
    subject_code: str = Form(...),
    topic: str = Form(...),
    num_questions: int = Form(5)
):
    quiz = generate_quiz(student_id, subject_code, topic, num_questions)
    return {"quiz": quiz}


@app.post("/quiz/check")
def check_answer(
    subject_code: str = Form(...),
    quiz_text: str = Form(...),
    student_answer: str = Form(...)
):
    result = check_quiz_answer(subject_code, quiz_text, student_answer)
    return {"result": result}