import { NextResponse } from 'next/server';
import { removeSessionCookie } from '@/lib/auth/session';

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
