import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import { invalidateRetrievalCache } from '@/lib/retrieval-engine';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ course_id: string }> }
) {
  try {
    const { course_id } = await params;
    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    dbRepo.deleteCourse(course_id);
    invalidateRetrievalCache(course_id);

    return NextResponse.json({
      success: true,
      message: `Course ${course_id} and all indexed materials removed.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
