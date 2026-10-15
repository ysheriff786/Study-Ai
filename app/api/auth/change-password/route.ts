import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  verifyPassword,
  validatePassword,
  hashPassword,
  generateAccessToken,
  setAuthCookie,
} from '@/lib/auth';
import { dbRepo } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentPassword = body.current_password || body.currentPassword || '';
    const newPassword = body.new_password || body.newPassword || '';
    const confirmPassword = body.confirm_password || body.confirmPassword || '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch user with password hash
    const userWithHash = dbRepo.getUserByEmail(user.email);
    if (!userWithHash) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 2. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, userWithHash.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Incorrect current password.' },
        { status: 400 }
      );
    }

    // 3. Validate new password
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

    // 4. Hash and update
    const newHash = await hashPassword(newPassword);
    dbRepo.updateUserPassword(user.id, newHash);
    dbRepo.revokeAllUserSessions(user.id);

    // 5. Re-issue fresh access token
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const res = NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });

    setAuthCookie(res, token);
    return res;
  } catch (err: any) {
    console.error('Error in /api/auth/change-password:', err);
    return NextResponse.json(
      { error: 'Failed to update password. Please try again.' },
      { status: 500 }
    );
  }
}
