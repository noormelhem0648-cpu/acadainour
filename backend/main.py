import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import base64

from ai_engine import generate_academic_response
from faiss_engine import search

app = FastAPI(title="Smart Student Assistant N — Backend")

# Allow frontend (Vercel) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    subject_code: str
    message: str
    history: List[Dict[str, str]] = []
    image_data: Optional[str] = None       # base64-encoded image
    image_mime_type: Optional[str] = None  # e.g. "image/jpeg"


class QuizRequest(BaseModel):
    subject_code: str
    topic: Optional[str] = None
    num_questions: int = 5


class QuizCheckRequest(BaseModel):
    question: str
    correct_answer: str
    student_answer: str


# ── Endpoints ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Smart Student Assistant N backend is running ✓"}


@app.post("/ask")
async def ask_assistant(request: ChatRequest):
    """Main chat endpoint — answers from course books first, then general knowledge."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        # 1. Search course books via FAISS
        book_chunks = search(request.subject_code, request.message, top_k=5)
        
        # التعديل هنا: جعل الـ context فارغ حالياً بناءً على طلبك
        context_from_books = "" # للآن فارغ

        # 2. Generate AI response
        answer = generate_academic_response(
            user_query=request.message,
            chat_history=request.history,
            context_from_books=context_from_books,
            image_data=request.image_data,
            image_mime_type=request.image_mime_type,
        )

        return {
            "answer": answer,
            "subject_code": request.subject_code,
            "source": "course_materials" if book_chunks else "general_knowledge",
        }

    except Exception as e:
        print(f"[/ask Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-and-ask")
async def upload_and_ask(
    subject_code: str = Form(...),
    message: str = Form(...),
    history: str = Form(default="[]"),
    file: UploadFile = File(...),
):
    """Upload an image or file alongside a question."""
    import json

    try:
        chat_history = json.loads(history)
    except Exception:
        chat_history = []

    # Read file and encode to base64
    file_bytes = await file.read()
    encoded = base64.b64encode(file_bytes).decode("utf-8")
    mime_type = file.content_type  # e.g. "image/jpeg", "application/pdf"

    # Only images are passed directly to Gemini vision
    # PDF/DOCX: extract text first (basic support)
    image_data = None
    image_mime_type = None
    extra_context = ""

    if mime_type and mime_type.startswith("image/"):
        image_data = encoded
        image_mime_type = mime_type
    else:
        # For non-image files, note it in the message
        extra_context = f"\n[Note: Student uploaded a file named '{file.filename}' — type: {mime_type}]"

    book_chunks = search(subject_code, message, top_k=5)
    
    # التعديل هنا أيضاً: جعل الـ context فارغ حالياً بناءً على طلبك
    context_from_books = "" # للآن فارغ

    answer = generate_academic_response(
        user_query=message + extra_context,
        chat_history=chat_history,
        context_from_books=context_from_books,
        image_data=image_data,
        image_mime_type=image_mime_type,
    )

    return {
        "answer": answer,
        "subject_code": subject_code,
        "source": "course_materials" if book_chunks else "general_knowledge",
    }


@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    """Generate MCQ quiz from course materials."""
    topic_note = f" Focus on the topic: {request.topic}." if request.topic else ""

    query = f"Generate a quiz with {request.num_questions} multiple-choice questions.{topic_note}"
    book_chunks = search(request.subject_code, query, top_k=8)
    context_from_books = "\n\n".join(book_chunks) if book_chunks else ""

    prompt = (
        f"Generate {request.num_questions} multiple-choice questions "
        f"for subject {request.subject_code}.{topic_note} "
        f"Format each question as:\n"
        f"Q: [question]\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: [letter]"
    )

    answer = generate_academic_response(
        user_query=prompt,
        chat_history=[],
        context_from_books=context_from_books,
    )

    return {"quiz": answer, "subject_code": request.subject_code}


@app.post("/quiz/check")
async def check_quiz_answer(request: QuizCheckRequest):
    """Check a student's answer and provide explanation."""
    prompt = (
        f"Question: {request.question}\n"
        f"Correct answer: {request.correct_answer}\n"
        f"Student's answer: {request.student_answer}\n\n"
        f"Is the student correct? Explain why clearly and briefly."
    )

    result = generate_academic_response(
        user_query=prompt,
        chat_history=[],
    )

    is_correct = request.student_answer.strip().lower() == request.correct_answer.strip().lower()
    return {
        "is_correct": is_correct,
        "explanation": result,
    }