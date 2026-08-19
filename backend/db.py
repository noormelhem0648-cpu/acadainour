import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
    SessionLocal = sessionmaker(bind=engine)
else:
    print("[DB] WARNING: No DATABASE_URL set. Database features disabled.")
    engine = None
    SessionLocal = None
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    role = Column(String(20), default="student")  # student / instructor
    plan = Column(String(20), default="free")  # free / premium — controls daily message quota
    created_at = Column(DateTime, server_default=func.now())
    # Daily usage limit tracking
    daily_count = Column(Integer, default=0)
    daily_date = Column(String(10), default="")  # YYYY-MM-DD
    # Password reset
    reset_token = Column(String(200), nullable=True)
    reset_expiry = Column(DateTime, nullable=True)
    conversations = relationship("Conversation", back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_code = Column(String(20), nullable=False)
    title = Column(String(200), default="New Chat")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.id")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(10), nullable=False)  # user / assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    conversation = relationship("Conversation", back_populates="messages")


class ContributedKey(Base):
    __tablename__ = "contributed_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    api_key = Column(String(200), unique=True, nullable=False)
    active = Column(Boolean, default=True)
    added_at = Column(DateTime, server_default=func.now())


class Restriction(Base):
    __tablename__ = "restrictions"
    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_code = Column(String(20), nullable=False)
    unit = Column(String(10), default="all")
    reason = Column(Text, default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ── Social / Messaging ────────────────────────────────────────────

class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending / accepted / rejected
    created_at = Column(DateTime, server_default=func.now())


class ChatGroup(Base):
    __tablename__ = "chat_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    members = relationship("GroupMember", back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, server_default=func.now())
    group = relationship("ChatGroup", back_populates="members")


class SocialMessage(Base):
    __tablename__ = "social_messages"
    id = Column(Integer, primary_key=True, index=True)
    # dm_{min_id}_{max_id}  or  group_{group_id}  or  challenge_{challenge_id}
    chat_id = Column(String(50), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    msg_type = Column(String(10), default="text")   # text | voice
    voice_data = Column(Text, nullable=True)         # base64 audio for voice messages
    created_at = Column(DateTime, server_default=func.now())


class StudentProgress(Base):
    __tablename__ = "student_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    xp = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
    last_study_date = Column(String(10), default="")   # YYYY-MM-DD
    hard_words = Column(Text, default="[]")             # JSON array
    badges = Column(Text, default="[]")                 # JSON array
    notebook = Column(Text, default="{}")               # JSON object
    errors = Column(Text, default="[]")                 # JSON array
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    goal_level = Column(String(10), nullable=False)   # a1 / a2 / b1 / b2 / c1 / c2
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    participants = relationship("ChallengeParticipant", back_populates="challenge")


class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    share_progress = Column(Boolean, default=False)   # user controls visibility
    progress_pct = Column(Integer, default=0)          # 0-100, self-reported
    joined_at = Column(DateTime, server_default=func.now())
    challenge = relationship("Challenge", back_populates="participants")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String(50), nullable=False, index=True)   # e.g. page_view, chat_sent, signup
    path = Column(String(200), nullable=True)
    session_id = Column(String(64), nullable=False, index=True)   # anonymous, client-generated
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    meta = Column(Text, nullable=True)                            # optional JSON string
    created_at = Column(DateTime, server_default=func.now(), index=True)


def _migrate():
    """Add new columns to existing tables (create_all does not alter tables)."""
    from sqlalchemy import text
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_count INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_date VARCHAR(10) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(200)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'",
        "ALTER TABLE social_messages ADD COLUMN IF NOT EXISTS msg_type VARCHAR(10) DEFAULT 'text'",
        "ALTER TABLE social_messages ADD COLUMN IF NOT EXISTS voice_data TEXT",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"[DB Migrate] {stmt[:50]}... -> {e}")
    print("[DB] Migration checked.")


def init_db():
    if engine:
        Base.metadata.create_all(bind=engine)
        _migrate()
        print("[DB] Tables created successfully.")
    else:
        print("[DB] Skipped — no DATABASE_URL.")


def get_db():
    if not SessionLocal:
        raise Exception("Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
