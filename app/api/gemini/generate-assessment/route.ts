import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithFallback } from '@/lib/gemini-server';
import { SourceChunk, AssessmentQuestion } from '@/lib/types';
import { generateLocalAssessmentQuestions } from '@/lib/local-rag';
import { dbRepo } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { targetConcepts, courseId, courseTitle, retrievedChunks, count = 3 } = await req.json();

    // 1. Fetch chunks from SQLite if courseId provided and no direct chunks given
    let chunks = (retrievedChunks || []) as SourceChunk[];
    if (chunks.length === 0 && courseId) {
      chunks = dbRepo.getChunks(courseId);
    }

    // 2. Strict Requirement: If no chunks have been uploaded/indexed, return empty list!
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        questions: [],
        message: 'No uploaded material found. Upload documents first to generate source-grounded questions.',
      });
    }

    const contextText = chunks
      .slice(0, 5)
      .map(c => `Source: "${c.docTitle}" (${c.unitLabel})\nContent:\n${c.content}`)
      .join('\n---\n');

    const prompt = `You are an expert university professor creating diagnostic multiple-choice assessment questions for the course "${courseTitle || 'Curriculum'}".
Target Concepts to Test: ${(targetConcepts || []).join(', ') || 'Core Ingested Concepts'}

SOURCE REFERENCE MATERIAL (Generate questions ONLY from this material):
${contextText}

REQUIREMENTS:
1. Generate ${count} rigorous diagnostic questions strictly based on the provided source excerpts.
2. For each question, provide 4 distinct options (index 0 to 3), exactly one of which is definitively correct according to the source material.
3. Distractors must represent plausible student misconceptions.
4. Provide a technical explanation and cite the specific source document and unit label with a direct supporting quote.
5. Difficulty: 'Foundational', 'Intermediate', or 'Advanced'.

OUTPUT FORMAT: Return pure JSON:
{
  "questions": [
    {
      "id": "gen-q-1",
      "conceptId": "target concept id or name",
      "conceptName": "Name of concept",
      "questionText": "Question statement...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation...",
      "difficulty": "Intermediate",
      "sourceCitation": {
        "docTitle": "Exact name of source document",
        "unitLabel": "e.g. Page 12 or Slide 8",
        "quote": "Short exact supporting quote from source"
      }
    }
  ]
}
Do not wrap in backticks or markdown formatting. Output pure JSON only.`;

    let generatedQuestions: AssessmentQuestion[] = [];

    const rawResult = await callGeminiWithFallback(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.2,
    });

    if (rawResult) {
      try {
        const parsed = JSON.parse(rawResult);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          generatedQuestions = parsed.questions.map((q: any, i: number) => {
            const matchedChunk = chunks.find(c => c.docTitle === q.sourceCitation?.docTitle) || chunks[i % chunks.length];
            return {
              id: `q-${Date.now().toString(36)}-${i}`,
              conceptId: q.conceptId || matchedChunk?.concepts[0] || 'c-concept',
              conceptName: q.conceptName || matchedChunk?.concepts[0] || 'Key Concept',
              questionText: q.questionText,
              options: Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
              explanation: q.explanation || `Verified in ${matchedChunk?.docTitle}.`,
              difficulty: q.difficulty || 'Intermediate',
              sourceCitation: {
                docTitle: q.sourceCitation?.docTitle || matchedChunk?.docTitle || 'Source',
                unitLabel: q.sourceCitation?.unitLabel || matchedChunk?.unitLabel || 'Section 1',
                quote: q.sourceCitation?.quote || matchedChunk?.content.slice(0, 90) || '',
              },
            };
          });
        }
      } catch {
        generatedQuestions = [];
      }
    }

    if (generatedQuestions.length === 0) {
      generatedQuestions = generateLocalAssessmentQuestions(
        targetConcepts || [],
        courseTitle || 'Curriculum',
        chunks,
        count
      );
    }

    // Persist into SQLite if courseId exists
    if (courseId && generatedQuestions.length > 0) {
      dbRepo.insertQuestions(generatedQuestions, courseId);
    }

    return NextResponse.json({ questions: generatedQuestions });
  } catch (err: any) {
    return NextResponse.json({ questions: [], error: err.message }, { status: 500 });
  }
}
