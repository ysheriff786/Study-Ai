import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUser } from '@/lib/auth';
import { dbRepo } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (user) {
      dbRepo.revokeAllUserSessions(user.id);
    }

    const res = NextResponse.json({
      success: true,
      message: 'You have been signed out successfully.',
    });

    clearAuthCookie(res);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/logout:', err);
    const res = NextResponse.json({ success: true });
    clearAuthCookie(res);
    return res;
  }
}
