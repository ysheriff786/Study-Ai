import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { confirmed } = await req.json();

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Confirmation is strictly required to clear the workspace.' },
        { status: 400 }
      );
    }

    dbRepo.resetAll();

    return NextResponse.json({
      success: true,
      message: 'Workspace completely cleared. All courses, documents, chunks, topics, and sessions were safely removed.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 });
  }
}
