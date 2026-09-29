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
      email: session.email || '',
      name: session.name || 'Member',
      mobile_number: session.mobile || '',
      age: undefined,
      avatar_url: session.avatarUrl || '',
      created_at: new Date().toISOString(),
    };

    const profile = await Repository.getUserProfile(resolvedUser.id);
    const finalName = (profile?.name || resolvedUser.name || 'Member').trim();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: resolvedUser.id,
        email: resolvedUser.email,
        name: finalName,
        mobile_number: resolvedUser.mobile_number || profile?.mobile_number || '',
        age: profile?.age ?? resolvedUser.age,
        avatar_url: resolvedUser.avatar_url,
      },
      profile,
      profile_completed: Boolean(profile?.profile_completed),
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
