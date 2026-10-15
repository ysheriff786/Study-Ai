import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  Course,
  DocumentSource,
  SourceChunk,
  ConceptMastery,
  AssessmentQuestion,
  ChatMessage,
  CitedSource,
  FileType,
  User,
  UserRole,
  ExplanationStyle,
} from './types';
import {
  INITIAL_COURSES,
  INITIAL_DOCUMENTS,
  INITIAL_CHUNKS,
  INITIAL_CONCEPTS,
  INITIAL_ASSESSMENT_QUESTIONS,
} from './seed-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'studyforge.db');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabaseSchema(dbInstance);
  }
  return dbInstance;
}

export function initDatabaseSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      avatar_url TEXT,
      preferred_explanation_style TEXT NOT NULL DEFAULT 'detailed',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      exam_date TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      icon_name TEXT NOT NULL DEFAULT 'BookOpen',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_members (
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'student',
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (course_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      identifier TEXT PRIMARY KEY,
      failed_attempts INTEGER NOT NULL DEFAULT 1,
      locked_until TEXT,
      last_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
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

    CREATE TABLE IF NOT EXISTS source_chunks (
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

    CREATE TABLE IF NOT EXISTS concepts (
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

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
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

    CREATE TABLE IF NOT EXISTS assessment_questions (
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

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      total INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      bkt_updates_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe schema migrations for existing database files
  try { db.exec(`ALTER TABLE courses ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE SET NULL;`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN exam_date TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';`); } catch (_) {}

  // Auto-seed starter courses and source groundings if empty
  seedStarterDataIfEmpty(db);
}

export function seedStarterData(db: DatabaseSync): void {
  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (id, code, title, subject, description, visibility, icon_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_COURSES) {
    insertCourse.run(c.id, c.code, c.title, c.subject, c.description, c.visibility || 'shared', c.iconName || 'BookOpen');
  }

  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO documents (id, course_id, title, file_type, file_size, total_units, unit_type, status, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const d of INITIAL_DOCUMENTS) {
    insertDoc.run(d.id, d.courseId, d.title, d.fileType, d.fileSize, d.totalUnits, d.unitType, d.status, d.summary);
  }

  const insertChunk = db.prepare(`
    INSERT OR REPLACE INTO source_chunks (
      id, document_id, course_id, content, unit_label,
      page_number, slide_number, start_timestamp, end_timestamp, locator, concepts_json, tokens_estimate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const sc of INITIAL_CHUNKS) {
    const doc = INITIAL_DOCUMENTS.find(d => d.id === sc.documentId);
    const courseId = doc ? doc.courseId : 'cs-301';
    insertChunk.run(
      sc.id,
      sc.documentId,
      courseId,
      sc.content,
      sc.unitLabel,
      sc.pageNumber || null,
      sc.slideNumber || null,
      null,
      null,
      `page:${sc.pageNumber || 1}`,
      JSON.stringify(sc.concepts || []),
      sc.tokensEstimate || 100
    );
  }

  const insertConcept = db.prepare(`
    INSERT OR REPLACE INTO concepts (
      id, course_id, topic_id, topic_name, name, description,
      p_init, p_transit, p_slip, p_guess, current_mastery,
      attempts_count, correct_count, history_json, last_assessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const cp of INITIAL_CONCEPTS) {
    insertConcept.run(
      cp.id,
      'cs-301',
      cp.topicId,
      cp.topicName,
      cp.name,
      cp.description,
      cp.bktParams.pL0,
      cp.bktParams.pT,
      cp.bktParams.pS,
      cp.bktParams.pG,
      cp.currentMastery,
      cp.attemptsCount,
      cp.correctCount,
      JSON.stringify(cp.history || []),
      cp.lastAssessedAt || null
    );
  }

  const insertQuestion = db.prepare(`
    INSERT OR REPLACE INTO assessment_questions (
      id, course_id, concept_id, concept_name, question_text,
      options_json, correct_option_index, explanation, difficulty,
      doc_title, unit_label, quote
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const q of INITIAL_ASSESSMENT_QUESTIONS) {
    insertQuestion.run(
      q.id,
      'cs-301',
      q.conceptId,
      q.conceptName,
      q.questionText,
      JSON.stringify(q.options),
      q.correctOptionIndex,
      q.explanation,
      q.difficulty,
      q.sourceCitation.docTitle,
      q.sourceCitation.unitLabel,
      q.sourceCitation.quote
    );
  }
}

export function seedStarterDataIfEmpty(db: DatabaseSync): void {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM courses').get() as any;
    if (!row || Number(row.count) === 0) {
      seedStarterData(db);
    }
  } catch (err) {
    console.error('Error auto-seeding starter data:', err);
  }
}

// Invalidation & Cache Version tracking
let courseCacheVersions: Record<string, number> = {};

export function getCourseIndexVersion(courseId: string): number {
  return courseCacheVersions[courseId] || 1;
}

export function bumpCourseIndexVersion(courseId: string): number {
  courseCacheVersions[courseId] = (courseCacheVersions[courseId] || 1) + 1;
  return courseCacheVersions[courseId];
}

// Repositories
export const dbRepo = {
  // Reset Everything
  resetAll(): void {
    const db = getDatabase();
    db.exec(`
      DELETE FROM quiz_attempts;
      DELETE FROM assessment_questions;
      DELETE FROM chat_messages;
      DELETE FROM chat_sessions;
      DELETE FROM concepts;
      DELETE FROM source_chunks;
      DELETE FROM documents;
      DELETE FROM courses;
    `);
    courseCacheVersions = {};
  },

  // Seed Demo Starter Dataset
  seedDemoData(): void {
    const db = getDatabase();
    seedStarterData(db);
  },

  // Courses
  getCourses(ownerId?: string): Course[] {
    const db = getDatabase();
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documents d WHERE d.course_id = c.id) as doc_count,
        (SELECT COUNT(*) FROM concepts con WHERE con.course_id = c.id) as concept_count
      FROM courses c
    `;
    const params: any[] = [];
    if (ownerId) {
      query += ` WHERE c.owner_id = ? `;
      params.push(ownerId);
    }
    query += ` ORDER BY c.created_at DESC `;
    const stmt = db.prepare(query);
    const rows = (params.length > 0 ? stmt.all(...params) : stmt.all()) as any[];
    return rows.map(r => ({
      id: r.id,
      code: r.code,
      title: r.title,
      subject: r.subject,
      description: r.description,
      iconName: r.icon_name || 'BookOpen',
      totalDocuments: Number(r.doc_count || 0),
      totalConcepts: Number(r.concept_count || 0),
      ownerId: r.owner_id || null,
      examDate: r.exam_date || null,
      visibility: r.visibility || 'private',
    }));
  },

  getCourse(id: string): Course | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documents d WHERE d.course_id = c.id) as doc_count,
        (SELECT COUNT(*) FROM concepts con WHERE con.course_id = c.id) as concept_count
      FROM courses c WHERE c.id = ?
    `);
    const r = stmt.get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      subject: r.subject,
      description: r.description,
      iconName: r.icon_name || 'BookOpen',
      totalDocuments: Number(r.doc_count || 0),
      totalConcepts: Number(r.concept_count || 0),
      ownerId: r.owner_id || null,
      examDate: r.exam_date || null,
      visibility: r.visibility || 'private',
    };
  },

  createCourse(course: {
    id: string;
    code: string;
    title: string;
    subject: string;
    description: string;
    iconName?: string;
    ownerId?: string | null;
    examDate?: string | null;
    visibility?: 'private' | 'shared';
  }): Course {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO courses (id, code, title, subject, description, icon_name, owner_id, exam_date, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      course.id,
      course.code,
      course.title,
      course.subject,
      course.description,
      course.iconName || 'BookOpen',
      course.ownerId || null,
      course.examDate || null,
      course.visibility || 'private'
    );
    bumpCourseIndexVersion(course.id);
    return {
      ...course,
      iconName: course.iconName || 'BookOpen',
      totalDocuments: 0,
      totalConcepts: 0,
      ownerId: course.ownerId || null,
      examDate: course.examDate || null,
      visibility: course.visibility || 'private',
    };
  },

  deleteCourse(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
    stmt.run(id);
    delete courseCacheVersions[id];
  },

  // Documents
  getDocuments(courseId: string): DocumentSource[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM source_chunks sc WHERE sc.document_id = d.id) as chunk_count
      FROM documents d 
      WHERE d.course_id = ?
      ORDER BY d.created_at DESC
    `);
    const rows = stmt.all(courseId) as any[];
    return rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      fileType: r.file_type as FileType,
      fileSize: r.file_size,
      totalUnits: Number(r.total_units),
      unitType: r.unit_type as any,
      status: r.status as any,
      uploadedAt: r.created_at.slice(0, 10),
      chunksCount: Number(r.chunk_count || 0),
      summary: r.summary,
    }));
  },

  createDocument(doc: {
    id: string;
    courseId: string;
    title: string;
    fileType: FileType;
    fileSize: string;
    totalUnits: number;
    unitType: string;
    status: string;
    summary: string;
  }): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO documents (id, course_id, title, file_type, file_size, total_units, unit_type, status, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      doc.id,
      doc.courseId,
      doc.title,
      doc.fileType,
      doc.fileSize,
      doc.totalUnits,
      doc.unitType,
      doc.status,
      doc.summary
    );
    bumpCourseIndexVersion(doc.courseId);
  },

  updateDocumentStatus(docId: string, status: string, summary?: string, errorMessage?: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE documents 
      SET status = ?, summary = COALESCE(?, summary), error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, summary || null, errorMessage || null, docId);
  },

  deleteDocument(docId: string, courseId: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    stmt.run(docId);
    // Associated chunks are automatically cascade deleted by SQLite foreign key constraint
    // Also clean up any concepts or questions that reference this document if orphan
    bumpCourseIndexVersion(courseId);
  },

  // Chunks
  getChunks(courseId: string, documentId?: string): SourceChunk[] {
    const db = getDatabase();
    let query = `
      SELECT sc.*, d.title as doc_title, d.file_type
      FROM source_chunks sc
      JOIN documents d ON sc.document_id = d.id
      WHERE sc.course_id = ?
    `;
    const params: any[] = [courseId];
    if (documentId) {
      query += ' AND sc.document_id = ?';
      params.push(documentId);
    }
    query += ' ORDER BY sc.created_at ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      documentId: r.document_id,
      docTitle: r.doc_title,
      fileType: r.file_type as FileType,
      unitLabel: r.unit_label,
      pageNumber: r.page_number || undefined,
      slideNumber: r.slide_number || undefined,
      timestampRange: r.start_timestamp ? `${r.start_timestamp} - ${r.end_timestamp}` : undefined,
      content: r.content,
      concepts: JSON.parse(r.concepts_json || '[]'),
      tokensEstimate: Number(r.tokens_estimate || 0),
    }));
  },

  insertChunks(chunks: {
    id: string;
    documentId: string;
    courseId: string;
    content: string;
    unitLabel: string;
    pageNumber?: number;
    slideNumber?: number;
    startTimestamp?: string;
    endTimestamp?: string;
    locator: string;
    concepts: string[];
    tokensEstimate: number;
  }[]): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO source_chunks (
        id, document_id, course_id, content, unit_label, 
        page_number, slide_number, start_timestamp, end_timestamp, locator, concepts_json, tokens_estimate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of chunks) {
      stmt.run(
        c.id,
        c.documentId,
        c.courseId,
        c.content,
        c.unitLabel,
        c.pageNumber || null,
        c.slideNumber || null,
        c.startTimestamp || null,
        c.endTimestamp || null,
        c.locator,
        JSON.stringify(c.concepts || []),
        c.tokensEstimate || 0
      );
    }
    if (chunks.length > 0) {
      bumpCourseIndexVersion(chunks[0].courseId);
    }
  },

  // Concepts
  getConcepts(courseId: string): ConceptMastery[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM concepts WHERE course_id = ? ORDER BY current_mastery ASC
    `);
    const rows = stmt.all(courseId) as any[];
    return rows.map(r => ({
      id: r.id,
      topicId: r.topic_id,
      topicName: r.topic_name,
      name: r.name,
      description: r.description,
      bktParams: {
        pL0: Number(r.p_init),
        pT: Number(r.p_transit),
        pS: Number(r.p_slip),
        pG: Number(r.p_guess),
      },
      currentMastery: Number(r.current_mastery),
      attemptsCount: Number(r.attempts_count),
      correctCount: Number(r.correct_count),
      lastAssessedAt: r.last_assessed_at || undefined,
      history: JSON.parse(r.history_json || '[]'),
    }));
  },

  upsertConcepts(concepts: ConceptMastery[], courseId: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO concepts (
        id, course_id, topic_id, topic_name, name, description,
        p_init, p_transit, p_slip, p_guess, current_mastery,
        attempts_count, correct_count, history_json, last_assessed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        current_mastery = excluded.current_mastery,
        attempts_count = excluded.attempts_count,
        correct_count = excluded.correct_count,
        history_json = excluded.history_json,
        last_assessed_at = excluded.last_assessed_at,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const c of concepts) {
      stmt.run(
        c.id,
        courseId,
        c.topicId || `t-${c.name.toLowerCase().replace(/\s+/g, '-')}`,
        c.topicName || 'General',
        c.name,
        c.description,
        c.bktParams?.pL0 ?? 0.20,
        c.bktParams?.pT ?? 0.12,
        c.bktParams?.pS ?? 0.10,
        c.bktParams?.pG ?? 0.25,
        c.currentMastery,
        c.attemptsCount,
        c.correctCount,
        JSON.stringify(c.history || []),
        c.lastAssessedAt || null
      );
    }
  },

  // Questions
  getQuestions(courseId: string): AssessmentQuestion[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM assessment_questions WHERE course_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(courseId) as any[];
    return rows.map(r => ({
      id: r.id,
      conceptId: r.concept_id,
      conceptName: r.concept_name,
      questionText: r.question_text,
      options: JSON.parse(r.options_json),
      correctOptionIndex: Number(r.correct_option_index),
      explanation: r.explanation,
      difficulty: r.difficulty as any,
      sourceCitation: {
        docTitle: r.doc_title,
        unitLabel: r.unit_label,
        quote: r.quote,
      },
    }));
  },

  insertQuestions(questions: AssessmentQuestion[], courseId: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO assessment_questions (
        id, course_id, concept_id, concept_name, question_text,
        options_json, correct_option_index, explanation, difficulty,
        doc_title, unit_label, quote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const q of questions) {
      stmt.run(
        q.id,
        courseId,
        q.conceptId,
        q.conceptName,
        q.questionText,
        JSON.stringify(q.options),
        q.correctOptionIndex,
        q.explanation,
        q.difficulty,
        q.sourceCitation.docTitle,
        q.sourceCitation.unitLabel,
        q.sourceCitation.quote
      );
    }
  },

  // Chat sessions & messages
  getOrCreateSession(sessionId: string, courseId?: string): string {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM chat_sessions WHERE id = ?').get(sessionId) as any;
    if (existing) return existing.id;

    let validCourseId = courseId;
    if (validCourseId) {
      const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?').get(validCourseId);
      if (!courseExists) validCourseId = undefined;
    }
    if (!validCourseId) {
      const firstCourse = db.prepare('SELECT id FROM courses LIMIT 1').get() as any;
      validCourseId = firstCourse?.id;
    }
    if (!validCourseId) {
      validCourseId = 'course-default';
      db.prepare(`
        INSERT OR IGNORE INTO courses (id, code, title, subject, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(validCourseId, 'GEN-101', 'General Studies', 'General', 'Default workspace course');
    }

    const newId = sessionId || `session-${Date.now()}`;
    db.prepare('INSERT OR IGNORE INTO chat_sessions (id, course_id) VALUES (?, ?)').run(newId, validCourseId);
    return newId;
  },

  getRecentMessages(sessionId: string, limit: number = 8): ChatMessage[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
      LIMIT ?
    `);
    const rows = stmt.all(sessionId, limit) as any[];
    return rows.map(r => ({
      id: r.id,
      role: r.role as 'user' | 'assistant',
      text: r.content,
      timestamp: r.created_at,
      citations: JSON.parse(r.citations_json || '[]'),
      conceptsDiscussed: JSON.parse(r.concepts_discussed_json || '[]'),
      suggestedFollowUps: JSON.parse(r.suggested_follow_ups_json || '[]'),
      latencyMs: r.latency_ms || undefined,
    }));
  },

  saveChatMessage(msg: {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    responseFingerprint?: string;
    retrievedChunkIds?: string[];
    citations?: CitedSource[];
    conceptsDiscussed?: string[];
    suggestedFollowUps?: string[];
    grounded?: boolean;
    confidence?: number;
    answerMode?: string;
    latencyMs?: number;
  }): void {
    const db = getDatabase();
    // Ensure the chat session exists before inserting message
    this.getOrCreateSession(msg.sessionId);

    const stmt = db.prepare(`
      INSERT INTO chat_messages (
        id, session_id, role, content, response_fingerprint,
        retrieved_chunk_ids_json, citations_json, concepts_discussed_json,
        suggested_follow_ups_json, grounded, confidence, answer_mode, latency_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      msg.id,
      msg.sessionId,
      msg.role,
      msg.content,
      msg.responseFingerprint || null,
      JSON.stringify(msg.retrievedChunkIds || []),
      JSON.stringify(msg.citations || []),
      JSON.stringify(msg.conceptsDiscussed || []),
      JSON.stringify(msg.suggestedFollowUps || []),
      msg.grounded !== false ? 1 : 0,
      msg.confidence ?? 1.0,
      msg.answerMode || 'explanation',
      msg.latencyMs || 0
    );
  },

  saveQuizAttempt(attempt: {
    id: string;
    courseId: string;
    total: number;
    correct: number;
    answers: any[];
    bktUpdates: any[];
  }): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO quiz_attempts (id, course_id, total, correct, answers_json, bkt_updates_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      attempt.id,
      attempt.courseId,
      attempt.total,
      attempt.correct,
      JSON.stringify(attempt.answers),
      JSON.stringify(attempt.bktUpdates)
    );
  },

  // ==========================================
  // USERS & AUTHENTICATION REPOSITORY
  // ==========================================
  createUser(userData: {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    avatarUrl?: string;
    preferredExplanationStyle?: ExplanationStyle;
    onboardingCompleted?: boolean;
  }): User {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (
        id, full_name, email, password_hash, role, avatar_url,
        preferred_explanation_style, onboarding_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      userData.id,
      userData.fullName,
      userData.email.toLowerCase().trim(),
      userData.passwordHash,
      userData.role,
      userData.avatarUrl || null,
      userData.preferredExplanationStyle || 'detailed',
      userData.onboardingCompleted ? 1 : 0
    );

    return {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email.toLowerCase().trim(),
      role: userData.role,
      avatarUrl: userData.avatarUrl || undefined,
      preferredExplanationStyle: userData.preferredExplanationStyle || 'detailed',
      onboardingCompleted: Boolean(userData.onboardingCompleted),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getUserById(id: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role as UserRole,
      avatarUrl: row.avatar_url || undefined,
      preferredExplanationStyle: (row.preferred_explanation_style as ExplanationStyle) || 'detailed',
      onboardingCompleted: Boolean(row.onboarding_completed),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at || undefined,
    };
  },

  getUserByEmail(email: string): (User & { passwordHash: string }) | null {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`);
    const row = stmt.get(email.toLowerCase().trim()) as any;
    if (!row) return null;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role as UserRole,
      avatarUrl: row.avatar_url || undefined,
      preferredExplanationStyle: (row.preferred_explanation_style as ExplanationStyle) || 'detailed',
      onboardingCompleted: Boolean(row.onboarding_completed),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at || undefined,
      passwordHash: row.password_hash,
    };
  },

  updateUser(
    id: string,
    updates: Partial<{
      fullName: string;
      avatarUrl: string;
      preferredExplanationStyle: ExplanationStyle;
      onboardingCompleted: boolean;
    }>
  ): User | null {
    const db = getDatabase();
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (updates.fullName !== undefined) {
      fields.push('full_name = ?');
      values.push(updates.fullName);
    }
    if (updates.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updates.avatarUrl);
    }
    if (updates.preferredExplanationStyle !== undefined) {
      fields.push('preferred_explanation_style = ?');
      values.push(updates.preferredExplanationStyle);
    }
    if (updates.onboardingCompleted !== undefined) {
      fields.push('onboarding_completed = ?');
      values.push(updates.onboardingCompleted ? 1 : 0);
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.getUserById(id);
  },

  updateUserPassword(id: string, passwordHash: string): boolean {
    const db = getDatabase();
    const res = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(passwordHash, id);
    return res.changes > 0;
  },

  updateUserLastLogin(id: string): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  },

  deleteUser(id: string): boolean {
    const db = getDatabase();
    const res = db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    return res.changes > 0;
  },

  getAllUsers(): User[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all() as any[];
    return rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role as UserRole,
      avatarUrl: row.avatar_url || undefined,
      preferredExplanationStyle: (row.preferred_explanation_style as ExplanationStyle) || 'detailed',
      onboardingCompleted: Boolean(row.onboarding_completed),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at || undefined,
    }));
  },

  // Sessions
  createSession(session: { id: string; userId: string; refreshTokenHash: string; expiresAt: string }): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(session.id, session.userId, session.refreshTokenHash, session.expiresAt);
  },

  getSession(id: string): any | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM sessions WHERE id = ? AND revoked_at IS NULL`).get(id);
    return row || null;
  },

  revokeSession(id: string): void {
    const db = getDatabase();
    db.prepare(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  },

  revokeAllUserSessions(userId: string): void {
    const db = getDatabase();
    db.prepare(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(userId);
  },

  // Rate Limiting (Brute-force protection: 5 attempts = 15m lockout)
  checkRateLimit(identifier: string): { isLocked: boolean; waitSeconds?: number } {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM rate_limits WHERE identifier = ?`).get(identifier) as any;
    if (!row) return { isLocked: false };

    if (row.locked_until) {
      const lockTime = new Date(row.locked_until).getTime();
      const now = Date.now();
      if (lockTime > now) {
        return { isLocked: true, waitSeconds: Math.ceil((lockTime - now) / 1000) };
      }
      // Lock expired, reset
      this.resetRateLimit(identifier);
    }
    return { isLocked: false };
  },

  recordFailedLogin(identifier: string): void {
    const db = getDatabase();
    const existing = db.prepare(`SELECT * FROM rate_limits WHERE identifier = ?`).get(identifier) as any;

    if (!existing) {
      db.prepare(`
        INSERT INTO rate_limits (identifier, failed_attempts, last_attempt_at)
        VALUES (?, 1, CURRENT_TIMESTAMP)
      `).run(identifier);
      return;
    }

    const newAttempts = existing.failed_attempts + 1;
    let lockedUntil: string | null = null;
    if (newAttempts >= 5) {
      // 15 minutes lockout
      const lockDate = new Date(Date.now() + 15 * 60 * 1000);
      lockedUntil = lockDate.toISOString();
    }

    db.prepare(`
      UPDATE rate_limits 
      SET failed_attempts = ?, locked_until = ?, last_attempt_at = CURRENT_TIMESTAMP
      WHERE identifier = ?
    `).run(newAttempts, lockedUntil, identifier);
  },

  resetRateLimit(identifier: string): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM rate_limits WHERE identifier = ?`).run(identifier);
  },

  // Password Resets
  createPasswordReset(id: string, userId: string, tokenHash: string, expiresAt: string): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO password_resets (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, tokenHash, expiresAt);
  },

  getValidPasswordReset(tokenHash: string): { id: string; userId: string } | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT id, user_id, expires_at FROM password_resets 
      WHERE token_hash = ? AND used_at IS NULL
    `).get(tokenHash) as any;

    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return null;
    }
    return { id: row.id, userId: row.user_id };
  },

  consumePasswordReset(id: string): void {
    const db = getDatabase();
    db.prepare(`UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  },

  // Course Membership
  addCourseMember(courseId: string, userId: string, role: UserRole = 'student'): void {
    const db = getDatabase();
    db.prepare(`
      INSERT OR IGNORE INTO course_members (course_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(courseId, userId, role);
  },

  isCourseMember(courseId: string, userId: string): boolean {
    const db = getDatabase();
    const row = db.prepare(`SELECT 1 FROM course_members WHERE course_id = ? AND user_id = ?`).get(courseId, userId);
    return Boolean(row);
  },
};
