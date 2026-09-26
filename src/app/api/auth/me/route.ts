import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await Repository.findUserById(session.userId);
    const resolvedUser = user || {
      id: session.userId,
      name: session.name || 'Gentleman',
      mobile_number: session.mobile || '',
      created_at: new Date().toISOString(),
    };

    const profile = await Repository.getUserProfile(resolvedUser.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: resolvedUser.id,
        name: resolvedUser.name,
        mobile_number: resolvedUser.mobile_number,
      },
      profile,
      profile_completed: Boolean(profile?.profile_completed),
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
