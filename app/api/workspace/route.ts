import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const courses = dbRepo.getCourses();
    const queryCourseId = req.nextUrl.searchParams.get('courseId');
    const activeCourseId = queryCourseId && courses.some(c => c.id === queryCourseId)
      ? queryCourseId
      : courses[0]?.id;

    let documents: any[] = [];
    let chunks: any[] = [];
    let concepts: any[] = [];
    let questions: any[] = [];

    if (activeCourseId) {
      documents = dbRepo.getDocuments(activeCourseId);
      chunks = dbRepo.getChunks(activeCourseId);
      concepts = dbRepo.getConcepts(activeCourseId);
      questions = dbRepo.getQuestions(activeCourseId);
    }

    return NextResponse.json({
      courses,
      activeCourseId: activeCourseId || null,
      documents,
      chunks,
      concepts,
      questions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load workspace' }, { status: 500 });
  }
}
