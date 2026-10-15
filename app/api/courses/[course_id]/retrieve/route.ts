import { NextRequest, NextResponse } from 'next/server';
import { retrieveForCourse } from '@/lib/retrieval-engine';
import { dbRepo } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ course_id: string }> }
) {
  try {
    const { course_id } = await params;
    const body = await req.json();
    const { query, document_ids } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 });
    }

    // Verify course exists
    const course = dbRepo.getCourse(course_id);
    if (!course) {
      return NextResponse.json({
        query: query || '',
        results: [],
        sufficient_evidence: false,
        error: 'Course not found',
      }, { status: 404 });
    }

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({
        query: '',
        results: [],
        sufficient_evidence: false,
      });
    }

    const retrievalResult = retrieveForCourse(course_id, query, document_ids);
    return NextResponse.json(retrievalResult);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Retrieval failed', results: [], sufficient_evidence: false },
      { status: 500 }
    );
  }
}
