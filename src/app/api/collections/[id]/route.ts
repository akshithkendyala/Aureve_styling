import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await Repository.getCollectionById(session.userId, params.id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const items = await Repository.getItemsInCollection(session.userId, params.id);
    return NextResponse.json({ success: true, collection, items });
  } catch (error: any) {
    console.error('Fetch collection by id error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await Repository.updateCollection(session.userId, params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Collection not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, collection: updated });
  } catch (error: any) {
    console.error('Update collection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await Repository.deleteCollection(session.userId, params.id);
    if (!success) {
      return NextResponse.json({ error: 'Collection not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully. Wardrobe pieces remain intact in your wardrobe.',
    });
  } catch (error: any) {
    console.error('Delete collection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete collection' }, { status: 500 });
  }
}
