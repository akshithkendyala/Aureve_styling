import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collections = await Repository.getCollections(session.userId);
    return NextResponse.json({ success: true, collections });
  } catch (error: any) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Collection name is required.' }, { status: 400 });
    }

    const collection = await Repository.createCollection(session.userId, {
      name: name.trim(),
      description: description?.trim(),
      icon: icon || 'FolderHeart',
    });

    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create collection' }, { status: 500 });
  }
}

