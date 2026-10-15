import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import {
  verifyPassword,
  normalizeEmail,
  generateAccessToken,
  generateSecureRandomToken,
  hashToken,
  setAuthCookie,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  sanitizeUser,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body.email || '';
    const password = body.password || '';
    const email = normalizeEmail(rawEmail);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // 1. Rate limiting check
    const rateLimit = checkLoginRateLimit(email);
    if (rateLimit.isLocked) {
      const waitMinutes = Math.max(1, Math.ceil((rateLimit.waitSeconds || 900) / 60));
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For your security, this account is temporarily locked for ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`,
          isLocked: true,
          waitSeconds: rateLimit.waitSeconds,
        },
        { status: 429 }
      );
    }

    // 2. Fetch user by email
    const user = dbRepo.getUserByEmail(email);
    if (!user) {
      recordFailedLogin(email);
      // Generic error per requirement: do not reveal whether email exists
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // 4. Successful login: Reset rate limits & update last login timestamp
    resetLoginRateLimit(email);
    dbRepo.updateUserLastLogin(user.id);

    // 5. Create persistent session in SQLite
    const refreshToken = generateSecureRandomToken(32);
    const refreshTokenHash = hashToken(refreshToken);
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    dbRepo.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      expiresAt: sessionExpiresAt,
    });

    // 6. Generate JWT access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const redirectTo = user.role === 'instructor' ? '/admin/dashboard' : '/student/dashboard';

    const res = NextResponse.json({
      user: sanitizeUser(user),
      token: accessToken,
      redirect_to: redirectTo,
    });

    setAuthCookie(res, accessToken);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    return NextResponse.json(
      { error: 'We could not connect to StudyForge. Check your connection and try again.' },
      { status: 500 }
    );
  }
}
