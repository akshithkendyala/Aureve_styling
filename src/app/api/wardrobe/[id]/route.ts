import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await Repository.getWardrobeItemById(session.userId, params.id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found in your wardrobe' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Fetch wardrobe item by id error:', error);
    return NextResponse.json({ error: 'Failed to retrieve item' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();
    const updated = await Repository.updateWardrobeItem(session.userId, params.id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Item not found or could not be updated' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Update wardrobe item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await Repository.deleteWardrobeItem(session.userId, params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Could not delete item' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Item removed from your wardrobe' });
  } catch (error) {
    console.error('Delete wardrobe item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
