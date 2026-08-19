import os
import json
import base64
import hashlib
import time
import datetime
import secrets
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from ai_engine import generate_academic_response, generate_academic_response_stream, _add_keys
from subjects_meta import get_subject_info
from faiss_engine import search
from db import init_db, get_db, SessionLocal, User, Conversation, Message, Restriction, ContributedKey, StudentProgress, AnalyticsEvent, PaymentProof
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user, require_instructor
)
from social import router as social_router, websocket_endpoint

# ── Rate limiter (in-memory; swap storage= for Redis in prod) ──
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Noura AI — Backend")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Optional Redis cache (graceful fallback to no-cache if Redis unavailable) ──
_redis = None
try:
    import redis as _redis_lib
    _redis_url = os.getenv("REDIS_URL", "")
    if _redis_url:
        _redis = _redis_lib.from_url(_redis_url, decode_responses=True, socket_connect_timeout=2)
        _redis.ping()
        print("[Cache] Redis connected.")
    else:
        print("[Cache] REDIS_URL not set — running without cache.")
except Exception as _e:
    print(f"[Cache] Redis unavailable ({_e}) — running without cache.")
    _redis = None

def cache_get(key: str):
    if not _redis:
        return None
    try:
        return _redis.get(key)
    except Exception:
        return None

def cache_set(key: str, value: str, ttl: int = 3600):
    if not _redis:
        return
    try:
        _redis.setex(key, ttl, value)
    except Exception:
        pass

# Allowed frontend origins. Extra origins can be added via ALLOWED_ORIGINS env (comma-separated).
_default_origins = [
    "https://acadai-frontend.onrender.com",
    "https://english-noura.onrender.com",   # English learning standalone site
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
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

from fastapi.responses import JSONResponse
from fastapi.requests import Request


@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception):
    """Catch any unhandled error so a single bad request never crashes the server."""
    print(f"[Unhandled Error] {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "صار خطأ غير متوقع — حاول مرة ثانية 🔄 (Something went wrong, please retry.)"},
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
        db = SessionLocal()
        keys = [row.api_key for row in db.query(ContributedKey).filter(ContributedKey.active == True).all()]
        db.close()
        if keys:
            _add_keys(keys)
            print(f"[Startup] Loaded {len(keys)} contributed key(s) from DB.")
    except Exception as e:
        print(f"[Startup] Could not load DB keys: {e}")

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

def _validate_email(email: str) -> bool:
    import re
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email))

def _smart_title(text: str, max_len: int = 40) -> str:
    if len(text) <= max_len:
        return text
    truncated = text[:max_len]
    last_space = truncated.rfind(" ")
    return (truncated[:last_space] if last_space > 10 else truncated) + "…"

@app.post("/auth/register")
@limiter.limit("10/minute")
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.name.strip() or not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="All fields are required.")
    if not _validate_email(req.email.strip()):
        raise HTTPException(status_code=400, detail="بريد إلكتروني غير صالح — Invalid email address.")
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
@limiter.limit("20/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

@app.post("/auth/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    # Always return success (don't reveal whether email exists)
    if user:
        reset_token = secrets.token_urlsafe(32)
        # Store only the hash — the raw token travels only in the email link
        user.reset_token = hashlib.sha256(reset_token.encode()).hexdigest()
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
@limiter.limit("5/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="كلمة السر لازم 6 أحرف على الأقل.")
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    user = db.query(User).filter(User.reset_token == token_hash).first()
    if not user or not user.reset_expiry or user.reset_expiry < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="الرابط غير صالح أو منتهي. اطلب رابط جديد.")
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_expiry = None
    db.commit()
    return {"ok": True, "message": "تم تغيير كلمة السر بنجاح! سجّل دخول بكلمتك الجديدة."}

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
def list_conversations(
    subject_code: str,
    skip: int = 0,
    limit: int = 30,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    skip = max(skip, 0)
    q = db.query(Conversation).filter(
        Conversation.user_id == user.id,
        Conversation.subject_code == subject_code,
    ).order_by(Conversation.updated_at.desc())
    total = q.count()
    convos = q.offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [{"id": c.id, "title": c.title, "subject_code": c.subject_code, "updated_at": str(c.updated_at)} for c in convos],
    }

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

@app.get("/health")
def health():
    """Ultra-light endpoint for uptime pingers (UptimeRobot/cron-job.org)."""
    return {"ok": True}


# ──────────────────────────────────────────────
# Lightweight first-party analytics (no external service)
# ──────────────────────────────────────────────
ALLOWED_EVENT_NAMES = {
    "page_view", "signup", "login", "chat_sent", "lesson_started",
    "lesson_completed", "quiz_started", "quiz_completed", "shadowing_recorded",
    "grammar_detective_used", "dialogue_partner_used", "file_uploaded",
    "key_contributed", "logout", "payment_proof_submitted",
}

class AnalyticsTrackRequest(BaseModel):
    event_name: str
    path: str = ""
    session_id: str
    meta: Optional[str] = None

@app.post("/analytics/track")
@limiter.limit("60/minute")
def track_event(
    request: Request,
    body: AnalyticsTrackRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    if body.event_name not in ALLOWED_EVENT_NAMES:
        raise HTTPException(status_code=400, detail="Unknown event_name.")
    if not SessionLocal:
        return {"ok": True}
    ev = AnalyticsEvent(
        event_name=body.event_name,
        path=body.path[:200] if body.path else None,
        session_id=body.session_id[:64],
        user_id=user.id if user else None,
        meta=(body.meta[:2000] if body.meta else None),
    )
    db.add(ev)
    db.commit()
    return {"ok": True}

@app.get("/analytics/summary")
def analytics_summary(days: int = 7, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    """Instructor-only dashboard data: DAU, top events, top pages, funnel drop-off."""
    days = min(max(days, 1), 90)
    since = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    rows = db.query(AnalyticsEvent).filter(AnalyticsEvent.created_at >= since).all()

    dau = {}
    event_counts = {}
    page_counts = {}
    unique_sessions = set()
    unique_users = set()

    for r in rows:
        day_key = str(r.created_at.date()) if r.created_at else "unknown"
        dau.setdefault(day_key, set()).add(r.session_id)
        event_counts[r.event_name] = event_counts.get(r.event_name, 0) + 1
        if r.path:
            page_counts[r.path] = page_counts.get(r.path, 0) + 1
        unique_sessions.add(r.session_id)
        if r.user_id:
            unique_users.add(r.user_id)

    dau_series = sorted([{"date": d, "active_sessions": len(s)} for d, s in dau.items()], key=lambda x: x["date"])
    top_events = sorted(event_counts.items(), key=lambda x: -x[1])[:15]
    top_pages = sorted(page_counts.items(), key=lambda x: -x[1])[:15]

    return {
        "range_days": days,
        "total_events": len(rows),
        "unique_sessions": len(unique_sessions),
        "unique_logged_in_users": len(unique_users),
        "daily_active_sessions": dau_series,
        "top_events": [{"event_name": k, "count": v} for k, v in top_events],
        "top_pages": [{"path": k, "count": v} for k, v in top_pages],
    }


# ──────────────────────────────────────────────
# Manual plan management (Premium is granted by an instructor after
# receiving payment out-of-band — no payment gateway is wired up yet)
# ──────────────────────────────────────────────
@app.get("/admin/users")
def admin_list_users(search: str = "", user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    q = db.query(User)
    if search.strip():
        like = f"%{search.strip()}%"
        q = q.filter((User.email.ilike(like)) | (User.name.ilike(like)))
    rows = q.order_by(User.created_at.desc()).limit(50).all()
    changed = False
    for u in rows:
        if _ensure_plan_current(u):
            changed = True
    if changed:
        db.commit()
    return [
        {
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "plan": u.plan or "free", "daily_count": u.daily_count or 0,
            "premium_expires_at": u.premium_expires_at.isoformat() if u.premium_expires_at else None,
        }
        for u in rows
    ]

class SetPlanRequest(BaseModel):
    plan: str  # "free" | "premium"

@app.patch("/admin/users/{user_id}/plan")
def admin_set_plan(user_id: int, body: SetPlanRequest, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    if body.plan not in ("free", "premium"):
        raise HTTPException(status_code=400, detail="plan must be 'free' or 'premium'.")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.plan == "premium":
        _grant_premium(target)
    else:
        _revert_to_free(target)
    db.commit()
    return {"ok": True, "id": target.id, "plan": target.plan, "premium_expires_at": target.premium_expires_at.isoformat() if target.premium_expires_at else None}


# ──────────────────────────────────────────────
# Payment proof upload (self-serve checkout without a payment gateway)
# Student pays out-of-band (bank transfer / Cliq / cash), uploads a screenshot,
# an instructor reviews it in /admin/payments and approves → auto-upgrades to premium.
# ──────────────────────────────────────────────
PREMIUM_PRICE = os.getenv("PREMIUM_PRICE", "3 JOD / شهرياً")
PAYMENT_INSTRUCTIONS = {
    "bank_name": os.getenv("PAYMENT_BANK_NAME", "بنك الاتحاد (Bank Al Etihad)"),
    "account_holder": os.getenv("PAYMENT_ACCOUNT_HOLDER", ""),
    "iban": os.getenv("PAYMENT_IBAN", ""),
    "note": "بعد التحويل، ارفعي صورة سكرين شوت من عملية التحويل هون.",
}
MAX_PAYMENT_IMAGE_CHARS = 3_500_000  # ~2.5MB decoded

@app.get("/payments/info")
def payment_info():
    return {"price": PREMIUM_PRICE, "instructions": PAYMENT_INSTRUCTIONS, "card_checkout_available": bool(MYFATOORAH_API_KEY)}


# ──────────────────────────────────────────────
# Automated card checkout via MyFatoorah (Send Payment + Get Payment Status).
# Falls back gracefully — if MYFATOORAH_API_KEY isn't set, /payments/checkout
# just returns a 503 and the frontend keeps offering the manual proof-upload flow.
# ──────────────────────────────────────────────
MYFATOORAH_API_KEY = os.getenv("MYFATOORAH_API_KEY", "")
MYFATOORAH_MODE = os.getenv("MYFATOORAH_MODE", "test")  # "test" or "live"
MYFATOORAH_BASE_URL = "https://api.myfatoorah.com" if MYFATOORAH_MODE == "live" else "https://apitest.myfatoorah.com"
PREMIUM_PRICE_JOD = float(os.getenv("PREMIUM_PRICE_JOD", "3.000"))

@app.post("/payments/checkout")
@limiter.limit("10/hour")
def create_card_checkout(request: Request, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if not MYFATOORAH_API_KEY:
        raise HTTPException(status_code=503, detail="الدفع بالبطاقة غير متاح حالياً — استخدمي التحويل البنكي.")
    import requests as _requests
    backend_url = os.getenv("BACKEND_URL", "https://acadai-backend-avvo.onrender.com")
    frontend_url = os.getenv("FRONTEND_URL", "https://acadai-frontend.onrender.com")
    # DisplayCurrencyIso is optional — omitted so MyFatoorah falls back to the
    # merchant account's configured default currency (in case JOD isn't
    # enabled on this account yet, which crashes their SendPayment with a
    # bare 500 instead of a clean validation error).
    payload = {
        "CustomerName": user.name,
        "CustomerEmail": user.email,
        "NotificationOption": "LNK",
        "InvoiceValue": PREMIUM_PRICE_JOD,
        "Language": "en",
        "CallBackUrl": f"{backend_url}/payments/callback?user_id={user.id}",
        "ErrorUrl": f"{frontend_url}/?upgrade=failed",
    }
    print(f"[MyFatoorah] SendPayment payload={payload}")
    headers = {"Authorization": f"Bearer {MYFATOORAH_API_KEY}", "Content-Type": "application/json"}
    try:
        resp = _requests.post(f"{MYFATOORAH_BASE_URL}/v2/SendPayment", headers=headers, json=payload, timeout=15)
        data = resp.json()
        print(f"[MyFatoorah] POST /v2/SendPayment status={resp.status_code} body={resp.text[:1000]}")
        if data.get("IsSuccess"):
            return {"invoice_url": data["Data"]["InvoiceURL"], "invoice_id": data["Data"]["InvoiceId"]}
        errors = data.get("ValidationErrors") or []
        error_detail = "; ".join(f"{e.get('Name', '')}: {e.get('Error', '')}" for e in errors) if errors else ""
        msg = error_detail or data.get("Message", "تعذّر إنشاء رابط الدفع.")
        raise HTTPException(status_code=502, detail=f"MyFatoorah: {msg}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[MyFatoorah] POST /v2/SendPayment error: {e}")
        raise HTTPException(status_code=502, detail="تعذّر الاتصال ببوابة الدفع.")

@app.get("/payments/callback")
def card_checkout_callback(user_id: int, paymentId: str = "", Id: str = "", db: Session = Depends(get_db)):
    """MyFatoorah redirects the browser here after checkout. We independently
    verify payment status server-side (never trust the redirect alone) before upgrading."""
    frontend_url = os.getenv("FRONTEND_URL", "https://acadai-frontend.onrender.com")
    key = paymentId or Id
    if not key or not MYFATOORAH_API_KEY:
        return RedirectResponse(f"{frontend_url}/?upgrade=failed")
    import requests as _requests
    try:
        resp = _requests.post(
            f"{MYFATOORAH_BASE_URL}/v2/GetPaymentStatus",
            headers={"Authorization": f"Bearer {MYFATOORAH_API_KEY}", "Content-Type": "application/json"},
            json={"Key": key, "KeyType": "PaymentId"},
            timeout=15,
        )
        data = resp.json()
        status = data.get("Data", {}).get("InvoiceStatus", "")
        if data.get("IsSuccess") and status == "Paid":
            student = db.query(User).filter(User.id == user_id).first()
            if student:
                _grant_premium(student)
                db.commit()
            return RedirectResponse(f"{frontend_url}/?upgrade=success")
        return RedirectResponse(f"{frontend_url}/?upgrade=failed")
    except Exception as e:
        print(f"[MyFatoorah] GetPaymentStatus error: {e}")
        return RedirectResponse(f"{frontend_url}/?upgrade=failed")


class PaymentSubmitRequest(BaseModel):
    plan_requested: str = "premium"
    amount: str
    method: str
    note: Optional[str] = None
    image_data: str  # base64, no data: prefix required

@app.post("/payments/submit")
@limiter.limit("5/hour")
def submit_payment(request: Request, body: PaymentSubmitRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if len(body.image_data) > MAX_PAYMENT_IMAGE_CHARS:
        raise HTTPException(status_code=400, detail="الصورة كبيرة جداً — اختاري صورة أصغر.")
    if body.plan_requested not in ("premium",):
        raise HTTPException(status_code=400, detail="plan_requested غير مدعوم.")
    proof = PaymentProof(
        user_id=user.id,
        plan_requested=body.plan_requested,
        amount=body.amount[:30],
        method=body.method[:50],
        note=(body.note[:1000] if body.note else None),
        image_data=body.image_data,
        status="pending",
    )
    db.add(proof)
    db.commit()
    return {"ok": True, "id": proof.id, "status": "pending"}

@app.get("/payments/mine")
def my_payments(user: User = Depends(require_user), db: Session = Depends(get_db)):
    rows = db.query(PaymentProof).filter(PaymentProof.user_id == user.id).order_by(PaymentProof.created_at.desc()).limit(10).all()
    return [
        {"id": p.id, "plan_requested": p.plan_requested, "amount": p.amount, "status": p.status, "created_at": p.created_at.isoformat() if p.created_at else None}
        for p in rows
    ]

@app.get("/admin/payments")
def admin_list_payments(status: str = "pending", user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    q = db.query(PaymentProof)
    if status in ("pending", "approved", "rejected"):
        q = q.filter(PaymentProof.status == status)
    rows = q.order_by(PaymentProof.created_at.desc()).limit(50).all()
    out = []
    for p in rows:
        student = db.query(User).filter(User.id == p.user_id).first()
        out.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": student.name if student else "?",
            "user_email": student.email if student else "?",
            "plan_requested": p.plan_requested,
            "amount": p.amount,
            "method": p.method,
            "note": p.note,
            "image_data": p.image_data,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return out

class ReviewPaymentRequest(BaseModel):
    action: str  # "approve" | "reject"

@app.patch("/admin/payments/{payment_id}")
def admin_review_payment(payment_id: int, body: ReviewPaymentRequest, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'.")
    proof = db.query(PaymentProof).filter(PaymentProof.id == payment_id).first()
    if not proof:
        raise HTTPException(status_code=404, detail="Payment proof not found.")
    if proof.status != "pending":
        raise HTTPException(status_code=400, detail="Already reviewed.")
    proof.status = "approved" if body.action == "approve" else "rejected"
    proof.reviewed_by = user.id
    proof.reviewed_at = datetime.datetime.utcnow()
    if body.action == "approve":
        student = db.query(User).filter(User.id == proof.user_id).first()
        if student and proof.plan_requested == "premium":
            _grant_premium(student)
    db.commit()
    return {"ok": True, "id": proof.id, "status": proof.status}


# ──────────────────────────────────────────────
# English Learning — AI Tutor Chat (no auth required)
# ──────────────────────────────────────────────
class EnglishChatRequest(BaseModel):
    message: str
    history: List[Dict] = []
    subject_info: str = ""  # carries day context + companion system prompt

@app.post("/english-tutor/stream")
@limiter.limit("30/minute")
async def english_tutor_stream(request: Request, req: EnglishChatRequest):
    """Streaming SSE endpoint for the English learning AI companion. No auth needed."""
    if not req.message or len(req.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too short or too long.")

    async def event_stream():
        try:
            for chunk in generate_academic_response_stream(
                user_query=req.message,
                chat_history=req.history,
                context_from_books="",
                subject_info=req.subject_info,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: ⚠️ Error: {str(e)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                              headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

def _is_subject_blocked(subject_code: str, db: Session, user: Optional[User] = None) -> Optional[Restriction]:
    """Return active restriction for a subject, or None. Instructors are never blocked."""
    if user is not None and getattr(user, "role", "") == "instructor":
        return None
    now = datetime.datetime.utcnow()
    return db.query(Restriction).filter(
        Restriction.subject_code == subject_code.upper(),
        Restriction.start_time <= now,
        Restriction.end_time >= now,
    ).first()


def _sanitize_subject(code: str) -> str:
    """Normalize subject code: uppercase alphanumeric only, max 20 chars."""
    import re
    return re.sub(r"[^A-Za-z0-9]", "", code).upper()[:20]

def _get_book_context(subject_code: str, query: str, top_k: int = 5) -> str:
    """Search the course FAISS index and return joined relevant chunks (or '')."""
    try:
        chunks = search(_sanitize_subject(subject_code), query, top_k=top_k)
        if chunks:
            return "\n\n".join(chunks)
    except Exception as e:
        print(f"[Book Context] search failed for {subject_code}: {e}")
    return ""


FREE_DAILY_LIMIT = 15
PREMIUM_DAILY_LIMIT = 300
MAX_MESSAGE_LEN = 4000


def _check_message_length(message: str):
    if len(message) > MAX_MESSAGE_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"الرسالة طويلة جداً (الحد {MAX_MESSAGE_LEN} حرف). اختصرها شوي — Message too long (max {MAX_MESSAGE_LEN} chars).",
        )


PREMIUM_DURATION_DAYS = 30

def _grant_premium(user: User, days: int = PREMIUM_DURATION_DAYS):
    """Upgrade a user to premium for `days` days from now (renews from now, not from any previous expiry)."""
    user.plan = "premium"
    user.premium_expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=days)

def _revert_to_free(user: User):
    user.plan = "free"
    user.premium_expires_at = None

def _ensure_plan_current(user: User) -> bool:
    """If premium has expired, downgrade in-place. Returns True if a downgrade happened (caller must commit)."""
    if user.plan == "premium" and user.premium_expires_at and user.premium_expires_at < datetime.datetime.utcnow():
        _revert_to_free(user)
        return True
    return False


def _check_daily_limit(user: User, db: Session):
    """Raise 429 if the user exceeded their daily message quota. Increments on success."""
    if not user:
        return
    today = datetime.date.today().isoformat()
    # Re-fetch with a row-level lock to prevent race conditions under concurrent requests
    locked_user = db.query(User).filter(User.id == user.id).with_for_update().first()
    if not locked_user:
        return
    if getattr(locked_user, "daily_date", None) != today:
        locked_user.daily_date = today
        locked_user.daily_count = 0
    _ensure_plan_current(locked_user)
    limit = PREMIUM_DAILY_LIMIT if locked_user.plan == "premium" else FREE_DAILY_LIMIT
    if (locked_user.daily_count or 0) >= limit:
        upgrade_hint = "" if locked_user.plan == "premium" else " رقّي حسابك لـ Premium لرسائل أكتر 💎 — Upgrade to Premium for more messages."
        raise HTTPException(
            status_code=429,
            detail=f"وصلت الحد اليومي ({limit} رسالة). جرب بكرا 🌙{upgrade_hint} — You reached your daily limit of {limit} messages. Try again tomorrow.",
        )
    locked_user.daily_count = (locked_user.daily_count or 0) + 1
    db.commit()


@app.get("/restrictions/check/{subject_code}")
def check_restriction(subject_code: str, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    r = _is_subject_blocked(subject_code, db, user)  # instructors bypass
    if r:
        return {"blocked": True, "reason": r.reason or ""}
    return {"blocked": False}


@app.get("/restrictions")
def list_restrictions(user: User = Depends(require_instructor), db: Session = Depends(get_db)):
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
    try:
        # Normalize to UTC naive datetime regardless of input timezone offset
        dt = datetime.datetime.fromisoformat(val.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        return dt
    except Exception:
        return default


@app.post("/restrictions")
def create_restriction(req: RestrictionRequest, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
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
@limiter.limit("20/minute")
async def ask_assistant(request: Request, body: ChatRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    request = body  # re-alias so the rest of the function body is unchanged
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
                title = _smart_title(request.message)
                convo = Conversation(user_id=user.id, subject_code=request.subject_code, title=title)
                db.add(convo)
                db.commit()
                db.refresh(convo)
                convo_id = convo.id
            else:
                convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
                if convo:
                    convo.updated_at = datetime.datetime.utcnow()

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
@limiter.limit("20/minute")
async def ask_assistant_stream(request: Request, body: ChatRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    request = body  # re-alias; fastapi Request is consumed by slowapi before function body
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
            convo = Conversation(user_id=user.id, subject_code=request.subject_code, title=_smart_title(request.message))
            db.add(convo)
            db.commit()
            db.refresh(convo)
            convo_id = convo.id
        else:
            convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
            if convo:
                convo.updated_at = datetime.datetime.utcnow()
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


def _parse_upload(file_bytes: bytes, filename: str, mime_type: str):
    """Parse an uploaded file into (image_data, image_mime, file_data, file_mime, extra_context).
    Returns a dict with keys: image_data, image_mime_type, file_data, file_data_mime, extra_context.
    """
    fname = (filename or "").lower()
    mime = mime_type or ""

    if mime.startswith("image/"):
        return dict(
            image_data=base64.b64encode(file_bytes).decode("utf-8"),
            image_mime_type=mime,
            file_data=None, file_data_mime=None,
            extra_context=(
                f"\n\n[STUDENT UPLOADED IMAGE: '{filename}']\n"
                "INSTRUCTIONS: Analyse the image above carefully. "
                "Use it as your primary source. Reference specific parts you see in it."
            ),
        )

    if mime == "application/pdf" or fname.endswith(".pdf"):
        return dict(
            image_data=None, image_mime_type=None,
            file_data=file_bytes, file_data_mime="application/pdf",
            extra_context=(
                f"\n\n[STUDENT UPLOADED PDF: '{filename}']\n"
                "INSTRUCTIONS: Read the attached PDF document thoroughly. "
                "It is your ABSOLUTE PRIMARY source — answer the question directly from what you read in it. "
                "Quote or reference specific sections/pages you find. "
                "Only add course-book knowledge as a supplement if the PDF doesn't fully answer the question."
            ),
        )

    if mime in ("text/plain", "text/csv") or fname.endswith((".txt", ".csv")):
        try:
            text = file_bytes.decode("utf-8", errors="replace")
            truncated = ""
            if len(text) > 14000:
                text = text[:14000]
                truncated = "\n\n⚠️ [الملف طويل — تم عرض أول 14,000 حرف فقط]"
            return dict(
                image_data=None, image_mime_type=None,
                file_data=None, file_data_mime=None,
                extra_context=(
                    f"\n\n[STUDENT UPLOADED TEXT FILE: '{filename}']\n"
                    f"=== DOCUMENT START ===\n{text}{truncated}\n=== DOCUMENT END ===\n\n"
                    "INSTRUCTIONS: The document above is the student's PRIMARY source. "
                    "Answer the question based on its content first. "
                    "Reference specific parts of the document in your answer."
                ),
            )
        except Exception:
            return dict(
                image_data=None, image_mime_type=None,
                file_data=None, file_data_mime=None,
                extra_context=f"\n[تعذّر قراءة الملف '{filename}' — أخبر الطالب بلطف أن يعيد الرفع.]",
            )

    # Unsupported (DOCX, PPTX, XLSX …)
    return dict(
        image_data=None, image_mime_type=None,
        file_data=None, file_data_mime=None,
        extra_context=(
            f"\n[الطالب رفع '{filename}' ({mime}) — هذا النوع غير مدعوم مباشرةً. "
            "أخبره بلطف أن يحوّل الملف إلى PDF أو TXT ويرفعه مرة ثانية. "
            "اشرح له كيف يعمل ذلك بسهولة.]"
        ),
    )


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
    restriction = _is_subject_blocked(subject_code, db, user)
    if restriction:
        reason = restriction.reason or "لا يوجد سبب محدد"
        return {"answer": f"🔒 **هاي المادة محجوبة حالياً من قِبَل الدكتور.**\n\n📋 السبب: {reason}", "subject_code": subject_code, "blocked": True}

    _check_daily_limit(user, db)

    try:
        chat_history = json.loads(history)
    except Exception:
        chat_history = []

    file_bytes = await file.read()
    MAX_UPLOAD = 10 * 1024 * 1024
    if len(file_bytes) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="الملف كبير جداً (الحد 10MB).")

    parsed = _parse_upload(file_bytes, file.filename, file.content_type or "")
    context_from_books = _get_book_context(subject_code, message, top_k=5)

    answer = generate_academic_response(
        user_query=message + parsed["extra_context"],
        chat_history=chat_history,
        context_from_books=context_from_books,
        image_data=parsed["image_data"],
        image_mime_type=parsed["image_mime_type"],
        file_data=parsed["file_data"],
        file_data_mime=parsed["file_data_mime"],
        subject_info=get_subject_info(subject_code),
    )

    return {"answer": answer, "subject_code": subject_code, "source": "course_materials" if context_from_books else "general_knowledge"}


@app.post("/upload-and-ask/stream")
async def upload_and_ask_stream(
    subject_code: str = Form(...),
    message: str = Form(...),
    history: str = Form(default="[]"),
    conversation_id: Optional[int] = Form(default=None),
    file: UploadFile = File(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Streaming version of /upload-and-ask — yields SSE chunks so the UI can animate the response."""
    _check_message_length(message)
    restriction = _is_subject_blocked(subject_code, db, user)
    if restriction:
        reason = restriction.reason or "لا يوجد سبب محدد"
        blocked_msg = f"🔒 **هاي المادة محجوبة حالياً من قِبَل الدكتور.**\n\n📋 السبب: {reason}"

        def _blocked():
            yield f"data: {json.dumps({'type': 'chunk', 'text': blocked_msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(_blocked(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    _check_daily_limit(user, db)

    # Resolve or create conversation
    convo_id = conversation_id
    if not convo_id:
        convo = Conversation(user_id=user.id, subject_code=subject_code, title=_smart_title(message))
        db.add(convo)
        db.commit()
        db.refresh(convo)
        convo_id = convo.id
    else:
        convo = db.query(Conversation).filter(Conversation.id == convo_id, Conversation.user_id == user.id).first()
        if convo:
            convo.updated_at = datetime.datetime.utcnow()
            db.commit()

    try:
        chat_history = json.loads(history)
    except Exception:
        chat_history = []

    file_bytes = await file.read()
    MAX_UPLOAD = 10 * 1024 * 1024
    if len(file_bytes) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="الملف كبير جداً (الحد 10MB).")

    parsed = _parse_upload(file_bytes, file.filename, file.content_type or "")
    context_from_books = _get_book_context(subject_code, message, top_k=5)
    user_query = message + parsed["extra_context"]
    subject_info = get_subject_info(subject_code)

    def event_stream():
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': convo_id})}\n\n"
        full_answer = ""
        try:
            for chunk in generate_academic_response_stream(
                user_query=user_query,
                chat_history=chat_history,
                context_from_books=context_from_books,
                image_data=parsed["image_data"],
                image_mime_type=parsed["image_mime_type"],
                file_data=parsed["file_data"],
                file_data_mime=parsed["file_data_mime"],
                subject_info=subject_info,
            ):
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            # Save messages to DB after stream completes
            try:
                db.add(Message(conversation_id=convo_id, role="user", content=message))
                db.add(Message(conversation_id=convo_id, role="assistant", content=full_answer))
                db.commit()
            except Exception:
                pass
        except Exception as e:
            print(f"[/upload-and-ask/stream Error] {e}")
            yield f"data: {json.dumps({'type': 'chunk', 'text': 'صار خطأ — حاول مرة ثانية 🔄'})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/quiz")
@limiter.limit("10/minute")
async def generate_quiz(request: Request, body: QuizRequest, user: User = Depends(require_user), db: Session = Depends(get_db)):
    request = body
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
async def check_quiz_answer(
    request: QuizCheckRequest,
    current_user: User = Depends(require_user),
):
    prompt = (
        f"Question: {request.question}\n"
        f"Correct answer: {request.correct_answer}\n"
        f"Student's answer: {request.student_answer}\n\n"
        f"Is the student correct? Explain why clearly and briefly."
    )
    result = generate_academic_response(user_query=prompt, chat_history=[])
    is_correct = request.student_answer.strip().lower() == request.correct_answer.strip().lower()
    return {"is_correct": is_correct, "explanation": result}


# ── Social router + WebSocket ──────────────────────────────────────
app.include_router(social_router)

from fastapi import WebSocket as FWS
from db import get_db as _get_db_gen

@app.websocket("/ws/social/{user_id}")
async def ws_social(ws: FWS, user_id: int, token: str = ""):
    if not SessionLocal:
        await ws.close(code=1008)
        return
    db = SessionLocal()
    try:
        await websocket_endpoint(ws, user_id, token, db)
    finally:
        db.close()


# ── Profile / Account endpoints ─────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.get("/auth/me")
def get_profile(me: User = Depends(require_user), db: Session = Depends(get_db)):
    if _ensure_plan_current(me):
        db.commit()
    return {
        "id": me.id,
        "name": me.name,
        "email": me.email,
        "role": me.role,
        "plan": me.plan or "free",
        "premium_expires_at": me.premium_expires_at.isoformat() if me.premium_expires_at else None,
        "created_at": me.created_at.isoformat() if me.created_at else None,
    }

@app.put("/auth/me")
def update_profile(
    req: UpdateProfileRequest,
    me: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if req.name and req.name.strip():
        me.name = req.name.strip()
        db.commit()
        db.refresh(me)
        # Update localStorage token will keep working; name change is cosmetic only
        return {"id": me.id, "name": me.name, "email": me.email, "role": me.role}
    raise HTTPException(400, "Name cannot be empty")

@app.delete("/auth/me")
def delete_account(
    req: ChangePasswordRequest,
    me: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, me.hashed_password):
        raise HTTPException(400, "كلمة المرور غير صحيحة")
    # Delete all user data
    from db import StudentProgress, Friendship, GroupMember, SocialMessage, ChallengeParticipant
    db.query(StudentProgress).filter(StudentProgress.user_id == me.id).delete()
    db.query(Friendship).filter(
        (Friendship.requester_id == me.id) | (Friendship.addressee_id == me.id)
    ).delete()
    db.query(GroupMember).filter(GroupMember.user_id == me.id).delete()
    db.query(ChallengeParticipant).filter(ChallengeParticipant.user_id == me.id).delete()
    db.query(Message).filter(
        Message.conversation_id.in_(
            db.query(Conversation.id).filter(Conversation.user_id == me.id)
        )
    ).delete(synchronize_session=False)
    db.query(Conversation).filter(Conversation.user_id == me.id).delete()
    db.query(ContributedKey).filter(ContributedKey.user_id == me.id).delete()
    db.delete(me)
    db.commit()
    return {"ok": True}

@app.put("/auth/me/password")
def change_password(
    req: ChangePasswordRequest,
    me: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, me.hashed_password):
        raise HTTPException(400, "كلمة المرور الحالية غير صحيحة")
    if len(req.new_password) < 6:
        raise HTTPException(400, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل")
    me.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"ok": True}


# ── Student Progress Sync ─────────────────────────────────────────

class ProgressSyncRequest(BaseModel):
    xp: Optional[int] = None
    streak_count: Optional[int] = None
    last_study_date: Optional[str] = None
    hard_words: Optional[str] = None   # JSON string
    badges: Optional[str] = None       # JSON string
    notebook: Optional[str] = None     # JSON string
    errors: Optional[str] = None       # JSON string

@app.get("/progress/me")
def get_progress(
    me: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    p = db.query(StudentProgress).filter(StudentProgress.user_id == me.id).first()
    if not p:
        return {
            "xp": 0, "streak_count": 0, "last_study_date": "",
            "hard_words": "[]", "badges": "[]", "notebook": "{}", "errors": "[]",
        }
    return {
        "xp": p.xp,
        "streak_count": p.streak_count,
        "last_study_date": p.last_study_date,
        "hard_words": p.hard_words,
        "badges": p.badges,
        "notebook": p.notebook,
        "errors": p.errors,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }

@app.put("/progress/me")
def save_progress(
    req: ProgressSyncRequest,
    me: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    p = db.query(StudentProgress).filter(StudentProgress.user_id == me.id).first()
    if not p:
        p = StudentProgress(user_id=me.id)
        db.add(p)
    if req.xp is not None:             p.xp = req.xp
    if req.streak_count is not None:   p.streak_count = req.streak_count
    if req.last_study_date is not None: p.last_study_date = req.last_study_date
    if req.hard_words is not None:     p.hard_words = req.hard_words
    if req.badges is not None:         p.badges = req.badges
    if req.notebook is not None:       p.notebook = req.notebook
    if req.errors is not None:         p.errors = req.errors
    db.commit()
    return {"ok": True}
