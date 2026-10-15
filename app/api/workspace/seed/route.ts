import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    dbRepo.seedDemoData();
    const courses = dbRepo.getCourses();
    const activeCourseId = courses[0]?.id;

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
      success: true,
      courses,
      activeCourseId,
      documents,
      chunks,
      concepts,
      questions,
    });
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}
