import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, itemIds } = body;

    const idsToAdd: string[] = Array.isArray(itemIds)
      ? itemIds
      : itemId
      ? [itemId]
      : [];

    if (idsToAdd.length === 0) {
      return NextResponse.json({ error: 'itemId or itemIds required.' }, { status: 400 });
    }

    for (const id of idsToAdd) {
      await Repository.addItemToCollection(session.userId, id, params.id);
    }

    const updatedItems = await Repository.getItemsInCollection(session.userId, params.id);
    return NextResponse.json({ success: true, count: idsToAdd.length, items: updatedItems });
  } catch (error: any) {
    console.error('Add items to collection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add items to collection' }, { status: 500 });
  }
}
