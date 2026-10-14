import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET || 'aureve_luxury_styling_assistant_jwt_secret_dev_key_987654321';
const secretKey = new TextEncoder().encode(JWT_SECRET);
export const SESSION_COOKIE_NAME = 'aureve_session';
const COOKIE_NAME = SESSION_COOKIE_NAME;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  mobile?: string;
  avatarUrl?: string;
  profileCompleted?: boolean;
  sessionDate?: string;
  exp?: number;
  iat?: number;
}

export interface DailySessionExpiry {
  expiresAtTimestamp: number; // Unix epoch seconds
  secondsRemaining: number;   // MaxAge in seconds
  formattedDate: string;      // YYYY-MM-DD in Asia/Kolkata
  expiresAtIso: string;
}

/**
 * Calculates session expiration targeting midnight in Asia/Kolkata timezone (UTC+5:30).
 * Late-night buffer: If signing in within 4 hours of midnight (e.g. 11:55 PM),
 * we extend the expiration to the following day's midnight so the session does not
 * abruptly expire 5 minutes later, guaranteeing at least 4 hours (and up to 28 hours).
 */
export function getDailySessionExpiry(
  timezone: string = 'Asia/Kolkata',
  referenceDate: Date = new Date()
): DailySessionExpiry {
  const nowMs = referenceDate.getTime();
  // Asia/Kolkata is UTC+5:30 (19,800,000 ms), with no daylight saving shifts
  const tzOffsetMs = 5.5 * 60 * 60 * 1000;
  const localTime = new Date(nowMs + tzOffsetMs);

  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  const date = localTime.getUTCDate();

  // Midnight of today in target timezone (which is 00:00:00 of tomorrow local time)
  const localMidnightToday = Date.UTC(year, month, date + 1, 0, 0, 0, 0);
  const targetMidnightUtc = localMidnightToday - tzOffsetMs;

  let secondsUntilMidnight = Math.floor((targetMidnightUtc - nowMs) / 1000);

  // Buffer: If remaining time is less than 4 hours (14,400s), extend to next midnight
  const FOUR_HOURS_IN_SECONDS = 4 * 60 * 60;
  let finalTargetUtcMs = targetMidnightUtc;

  if (secondsUntilMidnight < FOUR_HOURS_IN_SECONDS) {
    finalTargetUtcMs += 24 * 60 * 60 * 1000;
    secondsUntilMidnight += 24 * 60 * 60;
  }

  const expiresAtTimestamp = Math.floor(finalTargetUtcMs / 1000);
  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  return {
    expiresAtTimestamp,
    secondsRemaining: Math.max(secondsUntilMidnight, 3600),
    formattedDate,
    expiresAtIso: new Date(finalTargetUtcMs).toISOString(),
  };
}

/**
 * Create a signed JWT session token aligned with the daily session policy
 */
export async function createSessionToken(payload: {
  userId: string;
  email?: string;
  name?: string;
  mobile?: string;
  avatarUrl?: string;
  profileCompleted?: boolean;
}): Promise<string> {
  const expiry = getDailySessionExpiry();
  return new SignJWT({
    userId: payload.userId,
    email: payload.email || '',
    name: payload.name || '',
    mobile: payload.mobile || '',
    avatarUrl: payload.avatarUrl || '',
    profileCompleted: Boolean(payload.profileCompleted),
    sessionDate: expiry.formattedDate,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry.expiresAtTimestamp)
    .sign(secretKey);
}

/**
 * Set the session cookie in response headers with exact daily session maxAge
 */
export async function setSessionCookie(token: string): Promise<void> {
  try {
    const expiry = getDailySessionExpiry();
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiry.secondsRemaining,
      path: '/',
    });
  } catch (err) {
    console.warn('setSessionCookie note:', err);
  }
}

/**
 * Remove session cookie (Logout) - thoroughly expires across all browsers
 */
export async function removeSessionCookie(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    cookieStore.delete(COOKIE_NAME);
  } catch (err) {
    console.warn('removeSessionCookie note:', err);
  }
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
 * Get current authenticated user from Supabase Auth session or backup cookie
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  // Check signed JWT cookie first or in parallel
  let cookiePayload: SessionPayload | null = null;
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie?.value) {
      cookiePayload = await verifySessionToken(sessionCookie.value);
    }
  } catch {
    // Ignore cookie read error
  }

  try {
    // 1. Check official Supabase Auth user via SSR server client
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      return {
        userId: user.id,
        email: user.email || '',
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Member',
        mobile: user.user_metadata?.mobile_number || '',
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        profileCompleted: cookiePayload?.profileCompleted,
        sessionDate: cookiePayload?.sessionDate,
      };
    }
  } catch (err) {
    // Fall back to cookie check if Supabase Auth check threw
  }

  // 2. Return fallback signed JWT cookie payload if Supabase auth was unavailable
  if (cookiePayload && cookiePayload.userId) {
    return cookiePayload;
  }

  return null;
}
