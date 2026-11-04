import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { classifyClothingImage } from '@/lib/ai/visionClassifier';
import { suggestCollectionsForItem } from '@/lib/ai/collectionClassifier';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { image, hint, clientColorHint } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image data or URL is required' }, { status: 400 });
    }

    const classification = await classifyClothingImage(image, hint, clientColorHint);
    const suggestedCollections = suggestCollectionsForItem(classification);

    return NextResponse.json({
      success: true,
      classification: {
        ...classification,
        suggested_collections: suggestedCollections,
      },
    });
  } catch (error) {
    console.error('AI clothing classification error:', error);
    return NextResponse.json({ error: 'Failed to classify clothing piece' }, { status: 500 });
  }
}
