import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithFallback } from '@/lib/gemini-server';
import { FileType, ConceptMastery } from '@/lib/types';
import { dbRepo } from '@/lib/db';
import { invalidateRetrievalCache } from '@/lib/retrieval-engine';

export async function POST(req: NextRequest) {
  try {
    const { title, courseId, fileType, rawText, unitCount = 5, fileData, fileSize } = await req.json();

    if (!title || (!rawText && !fileData?.base64)) {
      return NextResponse.json({ error: 'Title and content text or file data are required' }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Verify course exists
    const course = dbRepo.getCourse(courseId);
    if (!course) {
      return NextResponse.json({ error: `Course ${courseId} not found` }, { status: 404 });
    }

    const docId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sanitizedTitle = title.trim();
    const cleanType: FileType = fileType || 'pdf';
    const textSnippet = (rawText || '').slice(0, 3500);

    const prompt = `You are a source-grounded multimodal document ingestion analyzer for StudyForge AI.
Analyze the following course material:
Document: "${sanitizedTitle}"
File Format: "${cleanType}" (pdf, pptx, video, or notes)
Content / Transcript excerpt:
"""
${textSnippet}
"""

TASKS:
1. Provide a concise executive academic summary (1-2 sentences).
2. Segment the material into 3 to 6 coherent source chunks. For each chunk:
   - If 'pdf': assign "unitLabel": "Page 1", "Page 2", etc.
   - If 'pptx': assign "unitLabel": "Slide 1", "Slide 2", etc.
   - If 'video': assign "unitLabel": "00:00 - 04:30", "04:30 - 09:00", etc.
   - If 'notes': assign "unitLabel": "Section 1", "Section 2", etc.
   - Extract a 1-3 word topic name and 1-2 distinct key concept tags.
3. Identify 2 to 4 distinct key concepts for cognitive Bayesian Knowledge Tracing (BKT).

OUTPUT FORMAT: Return pure JSON:
{
  "summary": "Academic summary of the uploaded material...",
  "chunks": [
    {
      "unitLabel": "Page 1",
      "content": "Paragraph content...",
      "concepts": ["Concept Name"]
    }
  ],
  "extractedConcepts": [
    {
      "name": "Concept Name",
      "topicName": "Topic Category",
      "description": "Educational definition of this concept"
    }
  ]
}
Do not wrap in markdown or backticks. Return pure JSON only.`;

    let parsedResult: any = null;

    // Multimodal payload if fileData base64 is provided
    const contents: any[] = [];
    if (fileData && fileData.base64 && typeof fileData.base64 === 'string') {
      const mime = fileData.mimeType || (cleanType === 'pdf' ? 'application/pdf' : 'application/octet-stream');
      if (mime === 'application/pdf' || mime.startsWith('image/')) {
        contents.push({
          inlineData: {
            mimeType: mime,
            data: fileData.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }
    }
    contents.push(prompt);

    const rawResult = await callGeminiWithFallback(contents.length > 1 ? contents : prompt, {
      responseMimeType: 'application/json',
      temperature: 0.2,
    });

    if (rawResult) {
      try {
        parsedResult = JSON.parse(rawResult);
      } catch {
        parsedResult = null;
      }
    }

    // Deterministic fallback if Gemini quota is reached
    if (!parsedResult || !Array.isArray(parsedResult.chunks) || parsedResult.chunks.length === 0) {
      const paragraphs = rawText
        .split(/\n\s*\n/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 30);

      const slices = paragraphs.length > 0 ? paragraphs : [rawText.trim()];
      const chunksData = slices.slice(0, 6).map((para: string, idx: number) => {
        const num = idx + 1;
        const unitLabel =
          cleanType === 'pdf'
            ? `Page ${num}`
            : cleanType === 'pptx'
            ? `Slide ${num}`
            : cleanType === 'video'
            ? `0${idx * 3}:00 - 0${num * 3}:00`
            : `Section ${num}`;

        const baseTitle = sanitizedTitle.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        return {
          unitLabel,
          content: para,
          concepts: [baseTitle],
        };
      });

      const baseTitle = sanitizedTitle.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      parsedResult = {
        summary: `Source-grounded curriculum material covering ${baseTitle}.`,
        chunks: chunksData,
        extractedConcepts: [
          {
            name: baseTitle,
            topicName: 'Core Curriculum',
            description: `Primary conceptual definitions and models from ${sanitizedTitle}.`,
          },
        ],
      };
    }

    // 1. Create Document in SQLite
    const unitType =
      cleanType === 'pdf' ? 'pages' : cleanType === 'pptx' ? 'slides' : cleanType === 'video' ? 'minutes' : 'sections';

    dbRepo.createDocument({
      id: docId,
      courseId,
      title: sanitizedTitle,
      fileType: cleanType,
      fileSize: fileSize || `${((rawText?.length || 1024) / 1024).toFixed(1)} KB`,
      totalUnits: parsedResult.chunks.length || 1,
      unitType,
      status: 'completed',
      summary: parsedResult.summary || `Indexed material from ${sanitizedTitle}`,
    });

    // 2. Insert Chunks with explicit Locators
    const chunksToInsert = parsedResult.chunks.map((c: any, i: number) => {
      const chunkId = `chunk-${docId}-${i + 1}`;
      let pageNumber: number | undefined;
      let slideNumber: number | undefined;
      let startTimestamp: string | undefined;
      let endTimestamp: string | undefined;
      let locator = c.unitLabel;

      if (cleanType === 'pdf') {
        const m = c.unitLabel.match(/\d+/);
        pageNumber = m ? parseInt(m[0], 10) : i + 1;
        locator = `page:${pageNumber}`;
      } else if (cleanType === 'pptx') {
        const m = c.unitLabel.match(/\d+/);
        slideNumber = m ? parseInt(m[0], 10) : i + 1;
        locator = `slide:${slideNumber}`;
      } else if (cleanType === 'video') {
        const m = c.unitLabel.match(/(\d+:\d+)\s*-\s*(\d+:\d+)/);
        if (m) {
          startTimestamp = m[1];
          endTimestamp = m[2];
          locator = `time:${startTimestamp}`;
        }
      }

      return {
        id: chunkId,
        documentId: docId,
        courseId,
        content: c.content,
        unitLabel: c.unitLabel,
        pageNumber,
        slideNumber,
        startTimestamp,
        endTimestamp,
        locator,
        concepts: c.concepts || [sanitizedTitle.replace(/\.[^/.]+$/, '')],
        tokensEstimate: Math.round(c.content.split(/\s+/).length * 1.3),
      };
    });

    dbRepo.insertChunks(chunksToInsert);

    // 3. Extract & Upsert Concepts for Bayesian Knowledge Tracing
    const rawConcepts = parsedResult.extractedConcepts || [];
    const conceptsToUpsert: ConceptMastery[] = rawConcepts.map((ec: any, i: number) => {
      const cId = `c-${ec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${docId.slice(-4)}`;
      return {
        id: cId,
        topicId: `t-${(ec.topicName || 'General').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        topicName: ec.topicName || 'Core Curriculum',
        name: ec.name,
        description: ec.description || `Concept introduced in ${sanitizedTitle}`,
        bktParams: {
          pL0: 0.20,
          pT: 0.12,
          pS: 0.10,
          pG: 0.25,
        },
        currentMastery: 0.20, // Clean initial prior, no fake mastery
        attemptsCount: 0,
        correctCount: 0,
        history: [],
      };
    });

    if (conceptsToUpsert.length > 0) {
      dbRepo.upsertConcepts(conceptsToUpsert, courseId);
    }

    // Invalidate retrieval cache
    invalidateRetrievalCache(courseId);

    // Fetch freshly persisted records from SQLite
    const createdDocs = dbRepo.getDocuments(courseId);
    const newlyCreatedDoc = createdDocs.find(d => d.id === docId);
    const persistedChunks = dbRepo.getChunks(courseId, docId);
    const courseConcepts = dbRepo.getConcepts(courseId);

    return NextResponse.json({
      success: true,
      document: newlyCreatedDoc,
      chunks: persistedChunks,
      concepts: courseConcepts,
      stats: {
        pagesOrUnits: newlyCreatedDoc?.totalUnits || chunksToInsert.length,
        chunksExtracted: chunksToInsert.length,
        conceptsIdentified: conceptsToUpsert.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ingestion failed' }, { status: 500 });
  }
}
