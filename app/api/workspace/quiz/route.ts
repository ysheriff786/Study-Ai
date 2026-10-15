import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { courseId, total, correct, answers, bktUpdates, updatedConcepts } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    dbRepo.saveQuizAttempt({
      id: `attempt-${Date.now()}`,
      courseId,
      total: Number(total),
      correct: Number(correct),
      answers: answers || [],
      bktUpdates: bktUpdates || [],
    });

    if (updatedConcepts && Array.isArray(updatedConcepts) && updatedConcepts.length > 0) {
      dbRepo.upsertConcepts(updatedConcepts, courseId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save quiz attempt' }, { status: 500 });
  }
}
