import { SourceChunk, FileType } from './types';
import { dbRepo, getCourseIndexVersion } from './db';

export interface RetrievalResultItem {
  chunk_id: string;
  content: string;
  score: number;
  document_id: string;
  document_name: string;
  page_number: number | null;
  slide_number: number | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  topic: string;
  concept: string;
  locator: string;
}

export interface RetrievalResponse {
  query: string;
  results: RetrievalResultItem[];
  sufficient_evidence: boolean;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'about', 'how', 'what', 'why', 'when', 'which', 'who', 'does', 'can',
  'explain', 'describe', 'tell', 'me', 'please', 'and', 'or', 'that', 'this', 'it', 'its',
  'them', 'they', 'you', 'your', 'i', 'we', 'us', 'would', 'could', 'should',
]);

// Normalization function
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize query removing stopwords
export function getQueryTerms(text: string): string[] {
  return normalizeQuestion(text)
    .split(' ')
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// Pronoun resolution & Contextual Query Rewriter
export function rewriteContextualQuery(
  rawQuery: string,
  history: { role: string; content?: string; text?: string }[]
): string {
  const norm = rawQuery.trim().toLowerCase();
  const pronouns = ['it', 'this', 'that', 'they', 'these', 'those', 'its'];
  const hasPronoun = pronouns.some(p => norm.split(/\s+/).includes(p));

  if (!hasPronoun || !history || history.length === 0) {
    return rawQuery;
  }

  // Look backwards for recent subject or concept in history
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const text = msg.content || msg.text || '';
    if (!text) continue;

    // Extract potential subject terms from previous user question or tutor answer
    const terms = getQueryTerms(text);
    if (terms.length > 0) {
      // Pick the most prominent noun terms from the previous message
      const subject = terms.slice(0, 3).join(' ');
      return `${rawQuery} regarding ${subject}`;
    }
  }

  return rawQuery;
}

// Token Jaccard Similarity for novelty / duplicate detection
export function computeTokenSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(getQueryTerms(textA));
  const tokensB = new Set(getQueryTerms(textB));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

// In-memory cache for course retrieval keyed by courseId + docVersion + normalizedQuery
interface CacheEntry {
  version: number;
  data: RetrievalResponse;
  timestamp: number;
}
const retrievalCache = new Map<string, CacheEntry>();

export function retrieveForCourse(
  courseId: string,
  rawQuery: string,
  selectedDocIds?: string[]
): RetrievalResponse {
  const currentVersion = getCourseIndexVersion(courseId);
  const normalized = normalizeQuestion(rawQuery);
  const cacheKey = `${courseId}:v${currentVersion}:${normalized}:${(selectedDocIds || []).sort().join(',')}`;

  const cached = retrievalCache.get(cacheKey);
  if (cached && cached.version === currentVersion && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  // Fetch verified chunks from SQLite
  const allChunks = dbRepo.getChunks(courseId);
  const activeChunks = selectedDocIds && selectedDocIds.length > 0
    ? allChunks.filter(c => selectedDocIds.includes(c.documentId))
    : allChunks;

  if (activeChunks.length === 0) {
    const response: RetrievalResponse = {
      query: rawQuery,
      results: [],
      sufficient_evidence: false,
    };
    retrievalCache.set(cacheKey, { version: currentVersion, data: response, timestamp: Date.now() });
    return response;
  }

  const queryTerms = getQueryTerms(rawQuery);

  // If query has no meaningful content terms and chunks exist, still avoid false matches
  if (queryTerms.length === 0) {
    const response: RetrievalResponse = {
      query: rawQuery,
      results: [],
      sufficient_evidence: false,
    };
    return response;
  }

  // Score each chunk using term frequency + concept weighting
  const scoredItems: RetrievalResultItem[] = [];

  for (const chunk of activeChunks) {
    const contentLower = chunk.content.toLowerCase();
    const titleLower = chunk.docTitle.toLowerCase();
    const conceptsLower = chunk.concepts.map(c => c.toLowerCase()).join(' ');

    let matchCount = 0;
    let conceptHits = 0;
    let titleHits = 0;

    for (const term of queryTerms) {
      const stem = term.length > 4 && term.endsWith('s') ? term.slice(0, -1) : term;
      const conceptMatch = conceptsLower.includes(term) || (stem.length > 3 && conceptsLower.includes(stem));
      const titleMatch = titleLower.includes(term) || (stem.length > 3 && titleLower.includes(stem));
      const contentMatch = contentLower.includes(term) || (stem.length > 3 && contentLower.includes(stem));

      if (conceptMatch) conceptHits++;
      if (titleMatch) titleHits++;
      if (contentMatch) matchCount++;
    }

    if (matchCount === 0 && conceptHits === 0 && titleHits === 0) {
      continue; // No evidence match at all
    }

    const termOverlapRatio = matchCount / queryTerms.length;
    let rawScore = termOverlapRatio * 0.70 + (conceptHits > 0 ? 0.20 : 0) + (titleHits > 0 ? 0.10 : 0);
    rawScore = Math.min(Math.max(Number(rawScore.toFixed(3)), 0.40), 0.99);

    let pageNum: number | null = null;
    let slideNum: number | null = null;
    let startTs: string | null = null;
    let endTs: string | null = null;
    let locator = chunk.unitLabel;

    if (chunk.fileType === 'pdf') {
      const match = chunk.unitLabel.match(/\d+/);
      pageNum = match ? parseInt(match[0], 10) : 1;
      locator = `page:${pageNum}`;
    } else if (chunk.fileType === 'pptx') {
      const match = chunk.unitLabel.match(/\d+/);
      slideNum = match ? parseInt(match[0], 10) : 1;
      locator = `slide:${slideNum}`;
    } else if (chunk.fileType === 'video') {
      const match = chunk.unitLabel.match(/(\d+:\d+)\s*-\s*(\d+:\d+)/);
      if (match) {
        startTs = match[1];
        endTs = match[2];
        locator = `time:${startTs}`;
      }
    }

    scoredItems.push({
      chunk_id: chunk.id,
      content: chunk.content,
      score: rawScore,
      document_id: chunk.documentId,
      document_name: chunk.docTitle,
      page_number: pageNum,
      slide_number: slideNum,
      start_timestamp: startTs,
      end_timestamp: endTs,
      topic: chunk.concepts[0] || 'Core Course Topic',
      concept: chunk.concepts[0] || 'Key Concept',
      locator,
    });
  }

  scoredItems.sort((a, b) => b.score - a.score);

  // Sufficient evidence requires matching evidence (top item score >= 0.48 or matchCount > 0)
  const topEvidence = scoredItems.filter(item => item.score >= 0.48);
  const sufficient_evidence = topEvidence.length > 0;

  const finalResponse: RetrievalResponse = {
    query: rawQuery,
    results: sufficient_evidence ? topEvidence.slice(0, 5) : [],
    sufficient_evidence,
  };

  retrievalCache.set(cacheKey, { version: currentVersion, data: finalResponse, timestamp: Date.now() });
  return finalResponse;
}

// Invalidate cache for a course
export function invalidateRetrievalCache(courseId: string) {
  for (const key of retrievalCache.keys()) {
    if (key.startsWith(`${courseId}:`)) {
      retrievalCache.delete(key);
    }
  }
}
