import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import {
  normalizeEmail,
  isValidEmail,
  generateSecureRandomToken,
  hashToken,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body.email || '';

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    const email = normalizeEmail(rawEmail);
    const user = dbRepo.getUserByEmail(email);

    if (user) {
      // Generate secure 32-byte reset token
      const rawResetToken = generateSecureRandomToken(32);
      const tokenHash = hashToken(rawResetToken);
      const resetId = `rst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      dbRepo.createPasswordReset(resetId, user.id, tokenHash, expiresAt);

      // Console-only dev output per requirement: "Never expose it in a production response"
      console.log(`\n======================================================`);
      console.log(`[StudyForge Security] Password Reset Token Generated`);
      console.log(`User: ${user.fullName} (${user.email})`);
      console.log(`Reset Token: ${rawResetToken}`);
      console.log(`Expires: ${expiresAt}`);
      console.log(`======================================================\n`);
    }

    // Generic response: Never reveal whether an email address exists
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been generated.',
    });
  } catch (err: any) {
    console.error('Error in /api/auth/forgot-password:', err);
    return NextResponse.json(
      { error: 'We could not connect to StudyForge. Check your connection and try again.' },
      { status: 500 }
    );
  }
}
