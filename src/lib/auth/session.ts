import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET || 'aureve_luxury_styling_assistant_jwt_secret_dev_key_987654321';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'aureve_session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  mobile?: string;
  avatarUrl?: string;
  exp?: number;
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(payload: {
  userId: string;
  email?: string;
  name?: string;
  mobile?: string;
  avatarUrl?: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email || '',
    name: payload.name || '',
    mobile: payload.mobile || '',
    avatarUrl: payload.avatarUrl || '',
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
  try {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });
  } catch (err) {
    console.warn('setSessionCookie note:', err);
  }
}

/**
 * Remove session cookie (Logout)
 */
export async function removeSessionCookie(): Promise<void> {
  try {
    const cookieStore = cookies();
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
      };
    }
  } catch (err) {
    // Fall back to cookie check if Supabase Auth check threw
  }

  // 2. Check fallback signed JWT cookie
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie?.value) {
      return await verifySessionToken(sessionCookie.value);
    }
  } catch {
    // Ignore cookie read error
  }

  return null;
}
