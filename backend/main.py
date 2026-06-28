import os
import json
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from ai_engine import generate_academic_response
from faiss_engine import search
from db import init_db, get_db, User, Conversation, Message
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user, require_instructor
)

app = FastAPI(title="Smart Student Assistant N — Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()


# ── Request Models ──────────────────────────────────────────

class ChatRequest(BaseModel):
    subject_code: str
    message: str
    history: List[Dict[str, str]] = []
    image_data: Optional[str] = None
    image_mime_type: Optional[str] = None
    conversation_id: Optional[int] = None

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class QuizRequest(BaseModel):
    subject_code: str
    topic: Optional[str] = None
    num_questions: int = 5

class QuizCheckRequest(BaseModel):
    question: str
    correct_answer: str
    student_answer: str


# ── Auth Endpoints ──────────────────────────────────────────

@app.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.name.strip() or not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="All fields are required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

@app.get("/auth/me")
def get_me(user: User = Depends(require_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


# ── Conversation Endpoints ──────────────────────────────────

@app.get("/conversations")
def list_conversations(subject_code: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    convos = db.query(Conversation).filter(
        Conversation.user_id == user.id,
        Conversation.subject_code == subject_code,
    ).order_by(Conversation.updated_at.desc()).limit(30).all()
    return [{"id": c.id, "title": c.title, "subject_code": c.subject_code, "updated_at": str(c.updated_at)} for c in convos]

@app.post("/conversations")
def create_conversation(subject_code: str = "", title: str = "New Chat", user: User = Depends(require_user), db: Session = Depends(get_db)):
    convo = Conversation(user_id=user.id, subject_code=subject_code, title=title)
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return {"id": convo.id, "title": convo.title, "subject_code": convo.subject_code}

@app.get("/conversations/{convo_id}/messages")
def get_conversation_messages(convo_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    msgs = db.query(Message).filter(Message.conversation_id == convo_id).order_by(Message.id).all()
    return [{"role": m.role, "content": m.content, "time": str(m.created_at)} for m in msgs]

@app.delete("/conversations/{convo_id}")
def delete_conversation(convo_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    db.query(Message).filter(Message.conversation_id == convo_id).delete()
    db.delete(convo)
    db.commit()
    return {"ok": True}


# ── Chat Endpoints ──────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Smart Student Assistant N backend is running ✓"}

@app.post("/ask")
async def ask_assistant(request: ChatRequest, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        book_chunks = search(request.subject_code, request.message, top_k=5)
        context_from_books = ""

        answer = generate_academic_response(
            user_query=request.message,
            chat_history=request.history,
            context_from_books=context_from_books,
            image_data=request.image_data,
            image_mime_type=request.image_mime_type,
        )

        # Save to database if user is logged in
        convo_id = request.conversation_id
        if user:
            if not convo_id:
                title = request.message[:40]
                convo = Conversation(user_id=user.id, subject_code=request.subject_code, title=title)
                db.add(convo)
                db.commit()
                db.refresh(convo)
                convo_id = convo.id
            else:
                convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
                if convo:
                    convo.updated_at = __import__("datetime").datetime.utcnow()

            db.add(Message(conversation_id=convo_id, role="user", content=request.message))
            db.add(Message(conversation_id=convo_id, role="assistant", content=answer))
            db.commit()

        return {
            "answer": answer,
            "subject_code": request.subject_code,
            "source": "course_materials" if book_chunks else "general_knowledge",
            "conversation_id": convo_id,
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
    try:
        chat_history = json.loads(history)
    except Exception:
        chat_history = []

    file_bytes = await file.read()
    encoded = base64.b64encode(file_bytes).decode("utf-8")
    mime_type = file.content_type

    image_data = None
    image_mime_type = None
    extra_context = ""

    if mime_type and mime_type.startswith("image/"):
        image_data = encoded
        image_mime_type = mime_type
    else:
        extra_context = f"\n[Note: Student uploaded a file named '{file.filename}' — type: {mime_type}]"

    book_chunks = search(subject_code, message, top_k=5)
    context_from_books = ""

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
    try:
        topic_note = f" Focus on the topic: {request.topic}." if request.topic else ""
        book_chunks = []
        try:
            query = f"Generate a quiz with {request.num_questions} multiple-choice questions.{topic_note}"
            book_chunks = search(request.subject_code, query, top_k=8)
        except Exception as e:
            print(f"[/quiz] FAISS search failed: {e}")
        context_from_books = "\n\n".join(book_chunks) if book_chunks else ""
        prompt = (
            f"Generate {request.num_questions} multiple-choice questions "
            f"for subject {request.subject_code}.{topic_note}\n"
            f"Mix question types: MCQ, True/False, and fill-in-the-blank.\n"
            f"Format each question clearly with the answer at the end."
        )
        answer = generate_academic_response(user_query=prompt, chat_history=[], context_from_books=context_from_books)
        return {"quiz": answer, "subject_code": request.subject_code}
    except Exception as e:
        print(f"[/quiz Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quiz/check")
async def check_quiz_answer(request: QuizCheckRequest):
    prompt = (
        f"Question: {request.question}\n"
        f"Correct answer: {request.correct_answer}\n"
        f"Student's answer: {request.student_answer}\n\n"
        f"Is the student correct? Explain why clearly and briefly."
    )
    result = generate_academic_response(user_query=prompt, chat_history=[])
    is_correct = request.student_answer.strip().lower() == request.correct_answer.strip().lower()
    return {"is_correct": is_correct, "explanation": result}
