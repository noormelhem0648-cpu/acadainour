import sqlite3

DATABASE_NAME = "acadai_system.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """تهيئة قاعدة البيانات وإنشاء الجداول الأساسية للمشروع"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. إنشاء جدول المستخدمين (الطلاب)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. إنشاء أو التأكد من وجود جدول المحادثات المرتبط بمعرف الطالب وكود المادة
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            subject_code TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

# استدعاء الدالة عند تشغيل الملف لإنشاء الجداول فوراً
if __name__ == "__main__":
    init_db()