import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await Repository.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const profile = await Repository.getUserProfile(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        mobile_number: user.mobile_number,
      },
      profile,
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
