import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await Repository.getWardrobeStats(session.userId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Wardrobe stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve wardrobe insights' }, { status: 500 });
  }
}
