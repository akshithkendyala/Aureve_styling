import { NextResponse } from 'next/server';
import { removeSessionCookie } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Sign out from Supabase Auth
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (sbErr) {
      console.warn('Supabase signOut error:', sbErr);
    }

    // 2. Clear JWT session cookie
    await removeSessionCookie();

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.set('aureve_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
