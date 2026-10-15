import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from './db';
import { User, UserRole, ExplanationStyle } from './types';

// JWT Secret from env or secure runtime fallback
const JWT_SECRET = process.env.JWT_SECRET || 'studyforge-super-secure-production-jwt-key-2026-b2b-saas';
const ACCESS_TOKEN_EXPIRY = '7d'; // 7 days access token
const AUTH_COOKIE_NAME = 'studyforge_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

/**
 * Normalizes email address to lowercase and trimmed.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Validates email format strictly.
 */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return regex.test(normalized);
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 - 100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  errors: string[];
  rules: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Validates password against enterprise security rules and calculates live strength score.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const minLength = (password || '').length >= 8;
  const hasUppercase = /[A-Z]/.test(password || '');
  const hasNumber = /[0-9]/.test(password || '');
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password || '');

  const errors: string[] = [];
  if (!minLength) errors.push('Password must be at least 8 characters long');
  if (!hasUppercase) errors.push('Password must include at least one uppercase letter');
  if (!hasNumber) errors.push('Password must include at least one number');
  if (!hasSpecial) errors.push('Password must include at least one special character (!@#$%^&* etc.)');

  let points = 0;
  if ((password || '').length >= 8) points += 25;
  if ((password || '').length >= 12) points += 15;
  if (hasUppercase) points += 20;
  if (hasNumber) points += 20;
  if (hasSpecial) points += 20;

  const score = Math.min(100, points);
  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 80) label = 'Strong';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Fair';

  return {
    isValid: errors.length === 0,
    score,
    label,
    errors,
    rules: {
      minLength,
      hasUppercase,
      hasNumber,
      hasSpecial,
    },
  };
}

/**
 * Hashes password using bcrypt with salt rounds 12.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verifies password with constant-time comparison.
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generates signed JWT access token.
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Verifies signed JWT access token.
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Hashes a token using SHA-256 for secure session storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates cryptographically secure random token (e.g. For refresh or reset).
 */
export function generateSecureRandomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Sets the authentication cookie on a response.
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Clears the authentication cookie on logout.
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Extracts authenticated user from request (via HTTP-only cookie or Bearer header).
 */
export async function getAuthUser(req: NextRequest): Promise<User | null> {
  let token: string | undefined;

  // 1. Try Cookie
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    token = cookie.value;
  }

  // 2. Try Authorization header
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload?.userId) return null;

  const user = dbRepo.getUserById(payload.userId);
  return user;
}

/**
 * Requires an authenticated user, returning an unauthorized response if not logged in.
 */
export async function requireAuth(req: NextRequest): Promise<{ user: User } | { errorResponse: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Requires a specific role (e.g. 'instructor'), returning 403 Forbidden if not permitted.
 */
export async function requireRole(
  req: NextRequest,
  requiredRole: UserRole
): Promise<{ user: User } | { errorResponse: NextResponse }> {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) {
    return auth;
  }

  if (auth.user.role !== requiredRole) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: This resource requires ${requiredRole} permissions.` },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}

/**
 * Rate limiting helper for login attempts.
 * Locks out an identifier (normalized email or IP) after 5 consecutive failures for 15 minutes.
 */
export function checkLoginRateLimit(identifier: string): { isLocked: boolean; waitSeconds?: number } {
  return dbRepo.checkRateLimit(identifier);
}

export function recordFailedLogin(identifier: string): void {
  dbRepo.recordFailedLogin(identifier);
}

export function resetLoginRateLimit(identifier: string): void {
  dbRepo.resetRateLimit(identifier);
}

/**
 * Formats a user safe for frontend delivery (never reveals password_hash or internal secrets).
 */
export function sanitizeUser(user: User) {
  return {
    id: user.id,
    full_name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar_url: user.avatarUrl,
    avatarUrl: user.avatarUrl,
    preferred_explanation_style: user.preferredExplanationStyle || 'detailed',
    preferredExplanationStyle: user.preferredExplanationStyle || 'detailed',
    onboarding_completed: Boolean(user.onboardingCompleted),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    created_at: user.createdAt,
    last_login_at: user.lastLoginAt,
  };
}
