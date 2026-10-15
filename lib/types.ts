export type FileType = 'pdf' | 'pptx' | 'video' | 'notes';

export interface SourceChunk {
  id: string;
  documentId: string;
  docTitle: string;
  fileType: FileType;
  unitLabel: string; // e.g., "Page 14", "Slide 8", "04:15 - 06:30", "Section 2"
  pageNumber?: number;
  slideNumber?: number;
  timestampRange?: string;
  content: string;
  concepts: string[];
  relevanceScore?: number;
  tokensEstimate: number;
}

export interface DocumentSource {
  id: string;
  courseId: string;
  title: string;
  fileType: FileType;
  fileSize: string;
  totalUnits: number; // e.g. 32 pages, 24 slides, 45 minutes
  unitType: 'pages' | 'slides' | 'minutes' | 'sections';
  status: 'indexed' | 'processing' | 'failed';
  uploadedAt: string;
  chunksCount: number;
  summary: string;
}

export interface BKTParameters {
  pL0: number; // Prior knowledge P(L0)
  pT: number;  // Transition prob P(T)
  pS: number;  // Slip prob P(S)
  pG: number;  // Guess prob P(G)
}

export interface ConceptMastery {
  id: string;
  topicId: string;
  topicName: string;
  name: string;
  description: string;
  bktParams: BKTParameters;
  currentMastery: number; // 0.0 to 1.0 (P(Lt))
  attemptsCount: number;
  correctCount: number;
  lastAssessedAt?: string;
  history: {
    timestamp: string;
    isCorrect: boolean;
    previousMastery: number;
    newMastery: number;
    questionSnippet: string;
  }[];
}

export type UserRole = 'student' | 'instructor';
export type ExplanationStyle = 'simple' | 'detailed' | 'exam-focused' | 'example-based';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  preferredExplanationStyle?: ExplanationStyle;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface CourseMember {
  courseId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  subject: string;
  description: string;
  iconName: string;
  totalDocuments: number;
  totalConcepts: number;
  ownerId?: string | null;
  examDate?: string | null;
  visibility?: 'private' | 'shared';
}

export interface CitedSource {
  chunkId: string;
  docTitle: string;
  unitLabel: string;
  fileType: FileType;
  snippet: string;
  fullContent?: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations: CitedSource[];
  conceptsDiscussed: string[];
  suggestedFollowUps?: string[];
  latencyMs?: number;
}

export interface AssessmentQuestion {
  id: string;
  conceptId: string;
  conceptName: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  sourceCitation: {
    docTitle: string;
    unitLabel: string;
    quote: string;
  };
}

export interface RAGASEvalTestCase {
  id: string;
  query: string;
  groundTruthConcept: string;
  retrievedChunksCount: number;
  faithfulnessScore: number; // 0.0 - 1.0 (source groundedness)
  answerRelevanceScore: number; // 0.0 - 1.0
  contextPrecisionScore: number; // 0.0 - 1.0
  contextRecallScore: number; // 0.0 - 1.0
  generatedAnswer: string;
  citationsCount: number;
  evaluationNotes: string;
}

export interface IngestionPayload {
  title: string;
  courseId: string;
  fileType: FileType;
  contentOrText: string;
  unitCount?: number;
}
