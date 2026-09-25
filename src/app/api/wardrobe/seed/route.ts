import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seededItems = await Repository.seedDefaultWardrobe(session.userId);
    return NextResponse.json({
      success: true,
      message: `Curated ${seededItems.length} classic pieces into your wardrobe`,
      itemsCount: seededItems.length,
    });
  } catch (error) {
    console.error('Seed wardrobe error:', error);
    return NextResponse.json({ error: 'Failed to seed wardrobe pieces' }, { status: 500 });
  }
}
