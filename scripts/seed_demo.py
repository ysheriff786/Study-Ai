#!/usr/bin/env python3
"""
StudyForge AI - Optional Demo Seed Script
Explicit developer utility. Never executed automatically during application startup.
Usage:
    python scripts/seed_demo.py
"""
import os
import sqlite3
import json

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "studyforge.db")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def seed_demo_data():
    print("==================================================")
    print("StudyForge AI: Optional Demo Seeding Script")
    print("==================================================")
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Insert sample course
    cursor.execute("""
    INSERT OR REPLACE INTO courses (id, code, title, subject, description, icon_name)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "cs-301",
        "CS 301",
        "Distributed Systems & OS Concurrency",
        "Computer Science",
        "Comprehensive coverage of mutual exclusion, deadlock avoidance, Raft consensus, and vector clocks.",
        "Cpu"
    ))

    # Insert sample document
    cursor.execute("""
    INSERT OR REPLACE INTO documents (id, course_id, title, file_type, file_size, total_units, unit_type, status, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "doc-os-deadlock-pdf",
        "cs-301",
        "Silberschatz_OS_Deadlocks_Ch7.pdf",
        "pdf",
        "4.8 MB",
        32,
        "pages",
        "completed",
        "Formal treatment of deadlock conditions, Banker's Algorithm safety vectors, and Resource Allocation Graphs."
    ))

    # Insert sample chunks
    chunks = [
        (
            "chunk-os-1",
            "doc-os-deadlock-pdf",
            "cs-301",
            "A deadlock state occurs if and only if four Coffman conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
            "Page 12",
            12,
            None,
            None,
            None,
            "page:12",
            json.dumps(["Coffman Conditions", "Deadlock"]),
            110
        ),
        (
            "chunk-os-2",
            "doc-os-deadlock-pdf",
            "cs-301",
            "Dijkstra's Banker's Algorithm ensures safety by calculating Need = Max - Allocation. If Work >= Need[i], process i can finish and release its resources.",
            "Page 18",
            18,
            None,
            None,
            None,
            "page:18",
            json.dumps(["Banker's Algorithm", "Resource Allocation"]),
            145
        )
    ]

    for c in chunks:
        cursor.execute("""
        INSERT OR REPLACE INTO source_chunks (
            id, document_id, course_id, content, unit_label,
            page_number, slide_number, start_timestamp, end_timestamp, locator, concepts_json, tokens_estimate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, c)

    # Insert sample concepts
    cursor.execute("""
    INSERT OR REPLACE INTO concepts (
        id, course_id, topic_id, topic_name, name, description,
        p_init, p_transit, p_slip, p_guess, current_mastery, attempts_count, correct_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "c-coffman",
        "cs-301",
        "t-deadlocks",
        "Deadlocks & Concurrency",
        "Coffman Conditions",
        "The 4 necessary conditions for deadlock in concurrent systems.",
        0.25, 0.15, 0.10, 0.20, 0.40, 2, 1
    ))

    conn.commit()
    conn.close()
    print("Demo data seeded into studyforge.db. Note: This script must only be run manually.")

if __name__ == "__main__":
    seed_demo_data()
