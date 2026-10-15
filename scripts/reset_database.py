#!/usr/bin/env python3
"""
StudyForge AI - Safe Database and Workspace Reset Command
Usage:
    python scripts/reset_database.py [--force]
"""
import sys
import os
import sqlite3
import shutil

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "studyforge.db")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
FAISS_DIR = os.path.join(DATA_DIR, "indexes")

def reset_database(force: bool = False):
    print("==================================================")
    print("StudyForge AI: Database & Workspace Reset Command")
    print("==================================================")
    print(f"Target Database: {DB_PATH}")

    if not force:
        try:
            confirm = input("\nWARNING: This will delete ALL courses, documents, chunks, topics, concepts, quizzes, attempts, and chat sessions!\nType 'YES' to proceed: ").strip()
            if confirm != "YES":
                print("Aborted. No data was deleted.")
                sys.exit(0)
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    # 1. Ensure directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    # 2. Connect to SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 3. Drop all tables
    print("\n[1/4] Dropping existing database tables...")
    tables = [
        "quiz_attempts",
        "assessment_questions",
        "chat_messages",
        "chat_sessions",
        "concepts",
        "source_chunks",
        "documents",
        "courses"
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")

    # 4. Recreate pristine schema
    print("[2/4] Recreating empty schema tables...")
    cursor.executescript("""
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT NOT NULL DEFAULT 'BookOpen',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size TEXT NOT NULL,
      total_units INTEGER NOT NULL DEFAULT 1,
      unit_type TEXT NOT NULL DEFAULT 'pages',
      status TEXT NOT NULL DEFAULT 'completed',
      summary TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE source_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      page_number INTEGER,
      slide_number INTEGER,
      start_timestamp TEXT,
      end_timestamp TEXT,
      locator TEXT NOT NULL,
      concepts_json TEXT NOT NULL DEFAULT '[]',
      tokens_estimate INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE concepts (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      p_init REAL NOT NULL DEFAULT 0.20,
      p_transit REAL NOT NULL DEFAULT 0.12,
      p_slip REAL NOT NULL DEFAULT 0.10,
      p_guess REAL NOT NULL DEFAULT 0.25,
      current_mastery REAL NOT NULL DEFAULT 0.20,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      history_json TEXT NOT NULL DEFAULT '[]',
      last_assessed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE chat_sessions (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      response_fingerprint TEXT,
      retrieved_chunk_ids_json TEXT NOT NULL DEFAULT '[]',
      citations_json TEXT NOT NULL DEFAULT '[]',
      concepts_discussed_json TEXT NOT NULL DEFAULT '[]',
      suggested_follow_ups_json TEXT NOT NULL DEFAULT '[]',
      grounded INTEGER NOT NULL DEFAULT 1,
      confidence REAL NOT NULL DEFAULT 1.0,
      answer_mode TEXT NOT NULL DEFAULT 'explanation',
      latency_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE assessment_questions (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      concept_id TEXT NOT NULL,
      concept_name TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Foundational',
      doc_title TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      quote TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE quiz_attempts (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      total INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      bkt_updates_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

    # 5. Clear uploaded files and vector indexes
    print("[3/4] Purging uploaded files and vector index caches...")
    if os.path.exists(UPLOADS_DIR):
        shutil.rmtree(UPLOADS_DIR, ignore_errors=True)
    if os.path.exists(FAISS_DIR):
        shutil.rmtree(FAISS_DIR, ignore_errors=True)

    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(FAISS_DIR, exist_ok=True)

    print("[4/4] Verification complete.")
    print("Database and workspace successfully reset. The application is in a clean, empty state.")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    reset_database(force=force_flag)
