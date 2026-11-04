import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { suggestCollectionsForItem } from '@/lib/ai/collectionClassifier';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const suggestions = suggestCollectionsForItem(body);

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error('Suggest collections error:', error);
    return NextResponse.json({ error: error.message || 'Failed to suggest collections' }, { status: 500 });
  }
}
