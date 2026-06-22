import sqlite3
import os

DB_PATH = "acadai.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            subject TEXT,
            role TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_message(student_id, subject, role, message):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO conversations (student_id, subject, role, message)
        VALUES (?, ?, ?, ?)
    ''', (student_id, subject, role, message))
    conn.commit()
    conn.close()

def get_history(student_id, subject, limit=10):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT role, message FROM conversations
        WHERE student_id=? AND subject=?
        ORDER BY timestamp DESC LIMIT ?
    ''', (student_id, subject, limit))
    rows = c.fetchall()
    conn.close()
    return list(reversed(rows))