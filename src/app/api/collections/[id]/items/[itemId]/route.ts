import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Repository.removeItemFromCollection(session.userId, params.itemId, params.id);
    return NextResponse.json({
      success: true,
      message: 'Item removed from collection. (Item remains saved in your wardrobe)',
    });
  } catch (error: any) {
    console.error('Remove item from collection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove item from collection' }, { status: 500 });
  }
}
