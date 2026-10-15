import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import {
  hashPassword,
  generateAccessToken,
  setAuthCookie,
  sanitizeUser,
  resetLoginRateLimit,
} from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role: UserRole = body.role === 'instructor' ? 'instructor' : 'student';

    const demoConfig = role === 'instructor' ? {
      email: 'demo.instructor@studyforge.ai',
      fullName: 'Prof. Sarah Lin',
      password: 'DemoInstructor!2026',
    } : {
      email: 'demo.student@studyforge.ai',
      fullName: 'Alex Chen',
      password: 'DemoStudent!2026',
    };

    let userWithHash = dbRepo.getUserByEmail(demoConfig.email);

    if (!userWithHash) {
      // Seed the demo user only on explicit user click
      const passwordHash = await hashPassword(demoConfig.password);
      const userId = `demo_${role}_${Date.now().toString(36)}`;
      
      const created = dbRepo.createUser({
        id: userId,
        fullName: demoConfig.fullName,
        email: demoConfig.email,
        passwordHash,
        role,
        preferredExplanationStyle: 'detailed',
        onboardingCompleted: true,
      });

      userWithHash = {
        ...created,
        passwordHash,
      };
    }

    // Reset rate limits & record login
    resetLoginRateLimit(demoConfig.email);
    dbRepo.updateUserLastLogin(userWithHash.id);

    const token = generateAccessToken({
      userId: userWithHash.id,
      email: userWithHash.email,
      role: userWithHash.role,
      fullName: userWithHash.fullName,
    });

    const redirectTo = role === 'instructor' ? '/admin/dashboard' : '/student/dashboard';

    const res = NextResponse.json({
      user: sanitizeUser(userWithHash),
      token,
      redirect_to: redirectTo,
      isDemo: true,
    });

    setAuthCookie(res, token);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/demo-login:', err);
    return NextResponse.json(
      { error: 'Failed to initialize demo session. Please try again.' },
      { status: 500 }
    );
  }
}
