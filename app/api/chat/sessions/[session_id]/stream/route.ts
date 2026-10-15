import { NextRequest } from 'next/server';
import { retrieveForCourse, rewriteContextualQuery, normalizeQuestion, computeTokenSimilarity } from '@/lib/retrieval-engine';
import { generateLocalGroundedTutorAnswer, classifyQuestionMode } from '@/lib/local-rag';
import { dbRepo } from '@/lib/db';
import { callGeminiWithFallback } from '@/lib/gemini-server';
import { SourceChunk, CitedSource } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id } = await params;
  const body = await req.json();
  const { query, courseId, history = [], forceMode } = body;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Immediate notification: "Searching your uploaded material..."
        sendEvent('searching', { status: 'Searching your uploaded material...' });

        if (!query || typeof query !== 'string' || query.trim() === '') {
          sendEvent('error', { message: 'Query is required' });
          controller.close();
          return;
        }

        const trimmedQuery = query.trim();

        // Ensure session exists in SQLite
        if (courseId) {
          dbRepo.getOrCreateSession(session_id, courseId);
        }

        // Step 2: Contextual Pronoun Resolution
        const recentMessages = dbRepo.getRecentMessages(session_id, 8);
        const combinedHistory: Array<{ role: 'user' | 'assistant'; text: string }> = recentMessages.length > 0
          ? recentMessages.map(m => ({ role: m.role, text: m.text }))
          : (history as Array<{ role: 'user' | 'assistant'; text: string }>);
        const contextualQuery = rewriteContextualQuery(trimmedQuery, combinedHistory);

        // Step 3: Duplicate / Repeated Question Detection
        const normalizedNew = normalizeQuestion(trimmedQuery);
        let isRepeatedQuestion = false;

        for (let i = combinedHistory.length - 1; i >= 0; i--) {
          const pastMsg = combinedHistory[i];
          if (pastMsg.role === 'user' && pastMsg.text) {
            const pastNorm = normalizeQuestion(pastMsg.text);
            const sim = computeTokenSimilarity(normalizedNew, pastNorm);
            if (sim >= 0.85 || normalizedNew === pastNorm) {
              isRepeatedQuestion = true;
              break;
            }
          }
        }

        // Step 4: Course-scoped Retrieval
        let chunks: SourceChunk[] = [];
        let sufficientEvidence = false;

        if (courseId) {
          const retrieval = retrieveForCourse(courseId, contextualQuery);
          sufficientEvidence = retrieval.sufficient_evidence;

          if (sufficientEvidence && retrieval.results.length > 0) {
            chunks = retrieval.results.map(r => ({
              id: r.chunk_id,
              documentId: r.document_id,
              docTitle: r.document_name,
              fileType: (r.page_number ? 'pdf' : r.slide_number ? 'pptx' : r.start_timestamp ? 'video' : 'notes') as any,
              unitLabel: r.locator,
              pageNumber: r.page_number || undefined,
              slideNumber: r.slide_number || undefined,
              timestampRange: r.start_timestamp ? `${r.start_timestamp} - ${r.end_timestamp}` : undefined,
              content: r.content,
              concepts: [r.concept],
              tokensEstimate: Math.round(r.content.split(/\s+/).length * 1.3),
            }));
          }
        }

        // Step 5: Check if unsupported
        if (!sufficientEvidence || chunks.length === 0) {
          sendEvent('citations', { citations: [], grounded: false });
          const refusal = 'This is not covered clearly in the uploaded material.';
          for (const word of refusal.split(' ')) {
            sendEvent('token', { token: word + ' ' });
            await new Promise(r => setTimeout(r, 20));
          }
          sendEvent('done', {
            answer: refusal,
            grounded: false,
            confidence: 0.0,
            citations: [],
            unsupported_parts: ['No sufficiently relevant source passage was found.'],
          });
          controller.close();
          return;
        }

        // Step 6: Display source cards immediately as soon as retrieval completes
        const primary = chunks[0];
        const secondary = chunks.length > 1 ? chunks[1] : null;

        const citations: CitedSource[] = [
          {
            chunkId: primary.id,
            docTitle: primary.docTitle,
            unitLabel: primary.unitLabel,
            fileType: primary.fileType,
            snippet: primary.content.slice(0, 160) + '...',
            fullContent: primary.content,
            relevanceScore: 0.96,
          },
        ];

        if (secondary && secondary.id !== primary.id) {
          citations.push({
            chunkId: secondary.id,
            docTitle: secondary.docTitle,
            unitLabel: secondary.unitLabel,
            fileType: secondary.fileType,
            snippet: secondary.content.slice(0, 150) + '...',
            fullContent: secondary.content,
            relevanceScore: 0.90,
          });
        }

        sendEvent('citations', { citations, grounded: true });

        // Step 7: Mode selection & Answer generation
        const explanationMode = forceMode || classifyQuestionMode(trimmedQuery);
        const recentAnswers = combinedHistory
          .filter(m => m.role === 'assistant')
          .map(m => m.text)
          .slice(-3);

        const structuredAnswer = generateLocalGroundedTutorAnswer(trimmedQuery, chunks, {
          history: combinedHistory,
          recentAnswers,
          isRepeatedQuestion,
          explanationMode,
        });

        // Step 8: Stream tokens to frontend
        const words = structuredAnswer.answer.split(' ');
        for (const w of words) {
          sendEvent('token', { token: w + ' ' });
          await new Promise(r => setTimeout(r, 12));
        }

        // Step 9: Save message and send done event
        dbRepo.saveChatMessage({
          id: `msg-${Date.now().toString(36)}`,
          sessionId: session_id,
          role: 'assistant',
          content: structuredAnswer.answer,
          responseFingerprint: `${explanationMode}-${trimmedQuery.slice(0, 20)}`,
          retrievedChunkIds: chunks.map(c => c.id),
          citations,
          conceptsDiscussed: structuredAnswer.related_concepts,
          suggestedFollowUps: structuredAnswer.suggested_follow_ups,
          grounded: structuredAnswer.grounded,
          confidence: structuredAnswer.confidence,
          answerMode: structuredAnswer.answer_mode,
        });

        sendEvent('done', {
          answer: structuredAnswer.answer,
          grounded: structuredAnswer.grounded,
          confidence: structuredAnswer.confidence,
          answer_mode: structuredAnswer.answer_mode,
          citations,
          conceptsDiscussed: structuredAnswer.related_concepts,
          suggestedFollowUps: structuredAnswer.suggested_follow_ups,
          novelty_check: structuredAnswer.novelty_check,
        });

        controller.close();
      } catch (err: any) {
        sendEvent('error', { message: err.message || 'Streaming failed' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
