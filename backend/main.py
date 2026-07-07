import os
import json
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from ai_engine import generate_academic_response, generate_academic_response_stream, _add_keys
from subjects_meta import get_subject_info
from faiss_engine import search
from db import init_db, get_db, User, Conversation, Message, Restriction, ContributedKey
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user, require_instructor
)

app = FastAPI(title="Noura AI — Backend")

# Allowed frontend origins. Extra origins can be added via ALLOWED_ORIGINS env (comma-separated).
_default_origins = [
    "https://acadai-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
]
_env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(dict.fromkeys(_default_origins + _env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Send an email via SMTP. Returns True on success. Configure via env vars."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    if not smtp_user or not smtp_pass:
        print("[Email] SMTP not configured (SMTP_USER/SMTP_PASS missing).")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Noura AI <{from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email] Failed to send: {e}")
        return False


def _load_db_keys():
    """Pull all active contributed keys from DB into the AI engine."""
    if not SessionLocal:
        return
    try:
        from db import SessionLocal as SL
        db = SL()
        keys = [row.api_key for row in db.query(ContributedKey).filter(ContributedKey.active == True).all()]
        db.close()
        if keys:
            _add_keys(keys)
            print(f"[Startup] Loaded {len(keys)} contributed key(s) from DB.")
    except Exception as e:
        print(f"[Startup] Could not load DB keys: {e}")

from db import SessionLocal

@app.on_event("startup")
def startup():
    init_db()
    _load_db_keys()


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

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class QuizRequest(BaseModel):
    subject_code: str
    topic: Optional[str] = None
    num_questions: int = 5

class QuizCheckRequest(BaseModel):
    question: str
    correct_answer: str
    student_answer: str

class RestrictionRequest(BaseModel):
    subject_code: str
    reason: Optional[str] = ""
    start_time: Optional[str] = None  # ISO datetime; None = start now
    end_time: Optional[str] = None    # ISO datetime; None = 1 year

class KeyContributeRequest(BaseModel):
    api_key: str


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

@app.post("/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    import secrets, datetime
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    # Always return success (don't reveal whether email exists)
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        db.commit()
        frontend_url = os.getenv("FRONTEND_URL", "https://acadai-frontend.onrender.com")
        link = f"{frontend_url}/?reset_token={reset_token}"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#c9858a">Noura AI 🎓</h2>
          <p>مرحباً {user.name}،</p>
          <p>طلبت إعادة تعيين كلمة السر. اضغط الرابط التالي (صالح لمدة ساعة):</p>
          <p><a href="{link}" style="display:inline-block;background:#c9858a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">إعادة تعيين كلمة السر</a></p>
          <p style="color:#888;font-size:13px">إذا ما طلبت هذا، تجاهل الرسالة.</p>
        </div>
        """
        send_email(email, "إعادة تعيين كلمة السر — Noura AI", html)
    return {"ok": True, "message": "إذا كان الإيميل مسجّل، رح توصلك رسالة خلال دقائق."}

@app.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    import datetime
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="كلمة السر لازم 6 أحرف على الأقل.")
    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user or not user.reset_expiry or user.reset_expiry < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="الرابط غير صالح أو منتهي. اطلب رابط جديد.")
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_expiry = None
    db.commit()
    return {"ok": True, "message": "تم تغيير كلمة السر بنجاح! سجّل دخول بكلمتك الجديدة."}

@app.get("/auth/me")
def get_me(user: User = Depends(require_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@app.get("/auth/make-instructor")
def make_instructor(email: str, secret: str, db: Session = Depends(get_db)):
    """Promote a user to instructor. Requires ADMIN_SECRET env var."""
    admin_secret = os.getenv("ADMIN_SECRET", "")
    if not admin_secret or secret != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid secret.")
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = "instructor"
    db.commit()
    return {"ok": True, "message": f"{user.name} is now an instructor."}

@app.get("/auth/remove-instructor")
def remove_instructor(email: str, secret: str, db: Session = Depends(get_db)):
    admin_secret = os.getenv("ADMIN_SECRET", "")
    if not admin_secret or secret != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid secret.")
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = "student"
    db.commit()
    return {"ok": True, "message": f"{user.name} is now a student."}


# ── API Key Contribution ────────────────────────────────────

@app.post("/keys/contribute")
def contribute_key(req: KeyContributeRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    key = req.api_key.strip()
    # Accept both key formats: classic "AIza..." and newer "AQ...."
    if len(key) < 30 or not (key.startswith("AIza") or key.startswith("AQ")):
        raise HTTPException(status_code=400, detail="مفتاح غير صالح. تأكد أنه من Google AI Studio.")
    existing = db.query(ContributedKey).filter(ContributedKey.api_key == key).first()
    if existing:
        raise HTTPException(status_code=409, detail="هذا المفتاح مضاف مسبقاً.")
    ck = ContributedKey(user_id=user.id, api_key=key, active=True)
    db.add(ck)
    db.commit()
    _add_keys([key])
    return {"ok": True, "message": "تم إضافة مفتاحك للنظام. شكراً! 🎉"}

@app.get("/keys/my")
def my_key(user: User = Depends(require_user), db: Session = Depends(get_db)):
    ck = db.query(ContributedKey).filter(ContributedKey.user_id == user.id, ContributedKey.active == True).first()
    return {"has_key": ck is not None}

@app.delete("/keys/my")
def remove_my_key(user: User = Depends(require_user), db: Session = Depends(get_db)):
    db.query(ContributedKey).filter(ContributedKey.user_id == user.id).delete()
    db.commit()
    return {"ok": True}

@app.get("/keys/stats")
def key_stats(db: Session = Depends(get_db)):
    from ai_engine import _clients
    total_contributed = db.query(ContributedKey).filter(ContributedKey.active == True).count()
    return {"total_active_keys": len(_clients), "contributed": total_contributed}


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
    return {"status": "Noura AI backend is running ✓"}

def _is_subject_blocked(subject_code: str, db: Session, user: Optional[User] = None) -> Optional[Restriction]:
    """Return active restriction for a subject, or None. Instructors are never blocked."""
    if user is not None and getattr(user, "role", "") == "instructor":
        return None
    import datetime
    now = datetime.datetime.utcnow()
    return db.query(Restriction).filter(
        Restriction.subject_code == subject_code.upper(),
        Restriction.start_time <= now,
        Restriction.end_time >= now,
    ).first()


def _get_book_context(subject_code: str, query: str, top_k: int = 5) -> str:
    """Search the course FAISS index and return joined relevant chunks (or '')."""
    try:
        chunks = search(subject_code, query, top_k=top_k)
        if chunks:
            return "\n\n".join(chunks)
    except Exception as e:
        print(f"[Book Context] search failed for {subject_code}: {e}")
    return ""


DAILY_MESSAGE_LIMIT = 100
MAX_MESSAGE_LEN = 4000


def _check_message_length(message: str):
    if len(message) > MAX_MESSAGE_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"الرسالة طويلة جداً (الحد {MAX_MESSAGE_LEN} حرف). اختصرها شوي — Message too long (max {MAX_MESSAGE_LEN} chars).",
        )


def _check_daily_limit(user: User, db: Session):
    """Raise 429 if the user exceeded their daily message quota. Increments on success."""
    if not user:
        return
    import datetime
    today = datetime.date.today().isoformat()
    # Reset counter if it's a new day
    if getattr(user, "daily_date", None) != today:
        user.daily_date = today
        user.daily_count = 0
    if (user.daily_count or 0) >= DAILY_MESSAGE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"وصلت الحد اليومي ({DAILY_MESSAGE_LIMIT} رسالة). جرب بكرا 🌙 — You reached your daily limit of {DAILY_MESSAGE_LIMIT} messages. Try again tomorrow.",
        )
    user.daily_count = (user.daily_count or 0) + 1
    db.commit()


@app.get("/restrictions/check/{subject_code}")
def check_restriction(subject_code: str, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    r = _is_subject_blocked(subject_code, db, user)  # instructors bypass
    if r:
        return {"blocked": True, "reason": r.reason or ""}
    return {"blocked": False}


@app.get("/restrictions")
def list_restrictions(user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    import datetime
    now = datetime.datetime.utcnow()
    rows = db.query(Restriction).filter(Restriction.instructor_id == user.id).order_by(Restriction.start_time.desc()).all()
    return [
        {
            "id": r.id,
            "subject_code": r.subject_code,
            "reason": r.reason,
            "start_time": str(r.start_time),
            "end_time": str(r.end_time),
            "active": r.start_time <= now <= r.end_time,
            "scheduled": r.start_time > now,
        }
        for r in rows
    ]


def _parse_dt(val, default):
    if not val:
        return default
    import datetime
    try:
        # Accept "YYYY-MM-DDTHH:MM" (from <input type=datetime-local>) as local→naive UTC
        return datetime.datetime.fromisoformat(val.replace("Z", ""))
    except Exception:
        return default


@app.post("/restrictions")
def create_restriction(req: RestrictionRequest, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    import datetime
    now = datetime.datetime.utcnow()
    start = _parse_dt(req.start_time, now)
    end = _parse_dt(req.end_time, now + datetime.timedelta(days=365))
    if end <= start:
        raise HTTPException(status_code=400, detail="وقت النهاية لازم يكون بعد وقت البداية.")

    # Create a NEW scheduled restriction each time (allows multiple future windows)
    r = Restriction(
        instructor_id=user.id,
        subject_code=req.subject_code.upper(),
        reason=req.reason or "",
        start_time=start,
        end_time=end,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"ok": True, "id": r.id, "scheduled": start > now}


@app.delete("/restrictions/{restriction_id}")
def delete_restriction(restriction_id: int, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    r = db.query(Restriction).filter(Restriction.id == restriction_id, Restriction.instructor_id == user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restriction not found.")
    db.delete(r)
    db.commit()
    return {"ok": True}


@app.post("/ask")
async def ask_assistant(request: ChatRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    _check_message_length(request.message)

    restriction = _is_subject_blocked(request.subject_code, db, user)
    if restriction:
        reason = restriction.reason or "لا يوجد سبب محدد"
        return {
            "answer": f"🔒 **هاي المادة محجوبة حالياً من قِبَل الدكتور.**\n\n📋 السبب: {reason}\n\nراجع دكتورك للمزيد من المعلومات.",
            "subject_code": request.subject_code,
            "blocked": True,
            "conversation_id": None,
        }

    _check_daily_limit(user, db)

    try:
        context_from_books = _get_book_context(request.subject_code, request.message, top_k=5)

        answer = generate_academic_response(
            user_query=request.message,
            chat_history=request.history,
            context_from_books=context_from_books,
            image_data=request.image_data,
            image_mime_type=request.image_mime_type,
            subject_info=get_subject_info(request.subject_code),
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
            "source": "course_materials" if context_from_books else "general_knowledge",
            "conversation_id": convo_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[/ask Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask/stream")
async def ask_assistant_stream(request: ChatRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    _check_message_length(request.message)

    restriction = _is_subject_blocked(request.subject_code, db, user)

    # Daily limit (only when not blocked — blocked messages are free)
    limit_error = None
    if not restriction:
        try:
            _check_daily_limit(user, db)
        except HTTPException as e:
            limit_error = e.detail

    # Fetch course book context (unless blocked/limited)
    book_context = ""
    if not restriction and not limit_error:
        book_context = _get_book_context(request.subject_code, request.message, top_k=5)

    # Create/resolve conversation up front so we can return its id
    convo_id = request.conversation_id
    if user and not restriction and not limit_error:
        if not convo_id:
            convo = Conversation(user_id=user.id, subject_code=request.subject_code, title=request.message[:40])
            db.add(convo)
            db.commit()
            db.refresh(convo)
            convo_id = convo.id
        else:
            convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
            if convo:
                convo.updated_at = __import__("datetime").datetime.utcnow()
                db.commit()

    def event_stream():
        # Send conversation id first
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': convo_id})}\n\n"

        if restriction:
            reason = restriction.reason or "لا يوجد سبب محدد"
            blocked_msg = f"🔒 **هاي المادة محجوبة حالياً من قِبَل الدكتور.**\n\n📋 السبب: {reason}\n\nراجع دكتورك للمزيد من المعلومات."
            yield f"data: {json.dumps({'type': 'chunk', 'text': blocked_msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        if limit_error:
            yield f"data: {json.dumps({'type': 'chunk', 'text': '⏳ ' + limit_error})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        full_answer = ""
        try:
            for chunk in generate_academic_response_stream(
                user_query=request.message,
                chat_history=request.history,
                context_from_books=book_context,
                image_data=request.image_data,
                image_mime_type=request.image_mime_type,
                subject_info=get_subject_info(request.subject_code),
            ):
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        except Exception as e:
            print(f"[/ask/stream Error] {e}")
            yield f"data: {json.dumps({'type': 'chunk', 'text': 'صار خطأ — حاول مرة ثانية 🔄'})}\n\n"

        # Persist after generation
        if user and convo_id and full_answer:
            try:
                db.add(Message(conversation_id=convo_id, role="user", content=request.message))
                db.add(Message(conversation_id=convo_id, role="assistant", content=full_answer))
                db.commit()
            except Exception as e:
                print(f"[/ask/stream DB Error] {e}")

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/upload-and-ask")
async def upload_and_ask(
    subject_code: str = Form(...),
    message: str = Form(...),
    history: str = Form(default="[]"),
    file: UploadFile = File(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    _check_message_length(message)
    # Block if subject is restricted (closes the upload bypass)
    restriction = _is_subject_blocked(subject_code, db, user)
    if restriction:
        reason = restriction.reason or "لا يوجد سبب محدد"
        return {
            "answer": f"🔒 **هاي المادة محجوبة حالياً من قِبَل الدكتور.**\n\n📋 السبب: {reason}",
            "subject_code": subject_code,
            "blocked": True,
        }

    _check_daily_limit(user, db)

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

    context_from_books = _get_book_context(subject_code, message, top_k=5)

    answer = generate_academic_response(
        user_query=message + extra_context,
        chat_history=chat_history,
        context_from_books=context_from_books,
        image_data=image_data,
        image_mime_type=image_mime_type,
        subject_info=get_subject_info(subject_code),
    )

    return {
        "answer": answer,
        "subject_code": subject_code,
        "source": "course_materials" if context_from_books else "general_knowledge",
    }


@app.post("/quiz")
async def generate_quiz(request: QuizRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    restriction = _is_subject_blocked(request.subject_code, db, user)
    if restriction:
        return {"quiz": "🔒 هاي المادة محجوبة حالياً من قِبَل الدكتور.", "subject_code": request.subject_code, "blocked": True}
    _check_daily_limit(user, db)
    try:
        topic_note = f" Focus on the topic: {request.topic}." if request.topic else ""
        query = f"Generate a quiz with {request.num_questions} multiple-choice questions.{topic_note}"
        context_from_books = _get_book_context(request.subject_code, query, top_k=8)
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
