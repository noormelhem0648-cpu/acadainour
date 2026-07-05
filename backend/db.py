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


def _migrate():
    """Add new columns to existing tables (create_all does not alter tables)."""
    from sqlalchemy import text
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_count INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_date VARCHAR(10) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(200)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMP",
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
