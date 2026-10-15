import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db';
import {
  hashToken,
  validatePassword,
  hashPassword,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token || '').trim();
    const newPassword = body.new_password || body.newPassword || '';
    const confirmPassword = body.confirm_password || body.confirmPassword || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required.' },
        { status: 400 }
      );
    }

    // 1. Verify token in database
    const tokenHash = hashToken(token);
    const validReset = dbRepo.getValidPasswordReset(tokenHash);
    if (!validReset) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token. Please request a new one.' },
        { status: 400 }
      );
    }

    // 2. Validate new password
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        {
          error: passwordCheck.errors[0] || 'Use at least 8 characters, including a number, an uppercase letter, and a symbol.',
          details: passwordCheck.errors,
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // 3. Hash new password and update user
    const newHash = await hashPassword(newPassword);
    dbRepo.updateUserPassword(validReset.userId, newHash);
    dbRepo.consumePasswordReset(validReset.id);
    dbRepo.revokeAllUserSessions(validReset.userId);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (err: any) {
    console.error('Error in /api/auth/reset-password:', err);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
