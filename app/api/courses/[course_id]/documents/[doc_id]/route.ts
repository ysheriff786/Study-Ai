import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import { invalidateRetrievalCache } from '@/lib/retrieval-engine';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ course_id: string; doc_id: string }> }
) {
  try {
    const { course_id, doc_id } = await params;

    if (!course_id || !doc_id) {
      return NextResponse.json({ error: 'Course ID and Document ID are required' }, { status: 400 });
    }

    dbRepo.deleteDocument(doc_id, course_id);
    invalidateRetrievalCache(course_id);

    return NextResponse.json({
      success: true,
      audit: `Document ${doc_id} was removed from course ${course_id}. Vectors and chunks purged. Cache invalidated.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
