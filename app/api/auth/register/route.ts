import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import {
  hashPassword,
  validatePassword,
  normalizeEmail,
  isValidEmail,
  generateAccessToken,
  setAuthCookie,
  sanitizeUser,
} from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = (body.full_name || body.fullName || '').trim();
    const rawEmail = body.email || '';
    const password = body.password || '';
    const confirmPassword = body.confirm_password || body.confirmPassword || '';
    const role: UserRole = body.role === 'instructor' ? 'instructor' : 'student';

    // 1. Validation
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    const email = normalizeEmail(rawEmail);

    // 2. Check Password complexity
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        {
          error: passwordCheck.errors[0] || 'Use at least 8 characters, including a number, an uppercase letter, and a symbol.',
          details: passwordCheck.errors,
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // 3. Check for existing user
    const existing = dbRepo.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // 4. Hash password with bcrypt
    const passwordHash = await hashPassword(password);
    const userId = `usr_${role}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    // 5. Create user in SQLite
    const newUser = dbRepo.createUser({
      id: userId,
      fullName,
      email,
      passwordHash,
      role,
      preferredExplanationStyle: 'detailed',
      onboardingCompleted: false,
    });

    // 6. Generate access token & set secure HTTP-only cookie
    const token = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
    });

    const res = NextResponse.json({
      user: sanitizeUser(newUser),
      token,
      redirect_to: role === 'student' ? '/student/dashboard' : '/admin/dashboard',
      message: 'Account created successfully.',
    });

    setAuthCookie(res, token);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    return NextResponse.json(
      { error: 'We could not connect to StudyForge. Check your connection and try again.' },
      { status: 500 }
    );
  }
}
