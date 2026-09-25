import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Repository.resetUserWardrobe(session.userId);
    return NextResponse.json({
      success: true,
      message: 'Your wardrobe has been cleared completely.',
    });
  } catch (error) {
    console.error('Clear wardrobe error:', error);
    return NextResponse.json({ error: 'Failed to clear wardrobe' }, { status: 500 });
  }
}
