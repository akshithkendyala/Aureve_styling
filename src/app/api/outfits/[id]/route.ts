import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await Repository.deleteOutfit(session.userId, params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Could not delete outfit' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Look removed from your history' });
  } catch (error) {
    console.error('Delete outfit error:', error);
    return NextResponse.json({ error: 'Failed to delete outfit' }, { status: 500 });
  }
}
