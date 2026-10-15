import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';

export async function GET() {
  try {
    const courses = dbRepo.getCourses();
    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, title, subject, description, iconName } = body;

    if (!code || !title) {
      return NextResponse.json({ error: 'Course code and title are required' }, { status: 400 });
    }

    const id = `course-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const newCourse = dbRepo.createCourse({
      id,
      code: code.trim(),
      title: title.trim(),
      subject: subject?.trim() || 'General Academics',
      description: description?.trim() || `Course workspace for ${title.trim()}`,
      iconName: iconName || 'BookOpen',
    });

    return NextResponse.json({ success: true, course: newCourse }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
