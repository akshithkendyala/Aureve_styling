import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET || 'aureve_default_secure_wardrobe_jwt_secret_2026_key_super_safe';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'aureve_session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// In-memory rate limiting map for login protection
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface SessionPayload {
  userId: string;
  mobile: string;
  name: string;
  exp?: number;
}

/**
 * Check if a mobile number is rate-limited due to repeated failed login attempts
 */
export function checkRateLimit(mobile: string): { allowed: boolean; retryAfterMinutes?: number } {
  const now = Date.now();
  const attemptData = loginAttempts.get(mobile);

  if (!attemptData) {
    return { allowed: true };
  }

  if (now - attemptData.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(mobile);
    return { allowed: true };
  }

  if (attemptData.count >= MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - attemptData.firstAttempt);
    return {
      allowed: false,
      retryAfterMinutes: Math.ceil(remainingMs / 60000),
    };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(mobile: string): void {
  const now = Date.now();
  const attemptData = loginAttempts.get(mobile);

  if (!attemptData || now - attemptData.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(mobile, { count: 1, firstAttempt: now });
  } else {
    attemptData.count += 1;
  }
}

/**
 * Clear failed attempts after a successful login
 */
export function clearFailedAttempts(mobile: string): void {
  loginAttempts.delete(mobile);
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    mobile: user.mobile_number,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);
}

/**
 * Set the session cookie in response headers
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Remove session cookie (Logout)
 */
export async function removeSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Verify session token and return payload
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from request cookies
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) {
      return null;
    }
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}
