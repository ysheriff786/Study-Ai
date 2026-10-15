import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, sanitizeUser } from '@/lib/auth';
import { dbRepo } from '@/lib/db';
import { ExplanationStyle } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    console.error('Error in GET /api/auth/me:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updates: any = {};

    if (body.full_name !== undefined || body.fullName !== undefined) {
      const name = (body.full_name || body.fullName || '').trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters long.' },
          { status: 400 }
        );
      }
      updates.fullName = name;
    }

    if (body.avatar_url !== undefined || body.avatarUrl !== undefined) {
      updates.avatarUrl = body.avatar_url || body.avatarUrl;
    }

    if (body.preferred_explanation_style !== undefined || body.preferredExplanationStyle !== undefined) {
      const style = body.preferred_explanation_style || body.preferredExplanationStyle;
      const validStyles: ExplanationStyle[] = ['simple', 'detailed', 'exam-focused', 'example-based'];
      if (validStyles.includes(style)) {
        updates.preferredExplanationStyle = style;
      }
    }

    if (body.onboarding_completed !== undefined || body.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = Boolean(
        body.onboarding_completed !== undefined ? body.onboarding_completed : body.onboardingCompleted
      );
    }

    const updatedUser = dbRepo.updateUser(user.id, updates);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User could not be updated.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: sanitizeUser(updatedUser),
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/auth/me:', err);
    return NextResponse.json(
      { error: 'Could not update profile. Please try again.' },
      { status: 500 }
    );
  }
}
