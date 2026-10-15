import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, generateAccessToken, setAuthCookie, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Session expired. Please sign in again.' },
        { status: 401 }
      );
    }

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const res = NextResponse.json({
      user: sanitizeUser(user),
      token,
    });

    setAuthCookie(res, token);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/refresh:', err);
    return NextResponse.json(
      { error: 'Session expired. Please sign in again.' },
      { status: 401 }
    );
  }
}
