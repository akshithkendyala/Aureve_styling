import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { analyzeSkinUndertoneFromImage } from '@/lib/ai/skinAndBodyScanner';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to scan.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No image frame provided for skin undertone scan.' },
        { status: 400 }
      );
    }

    // Ephemeral AI analysis: raw image is processed in RAM and discarded immediately
    const result = await analyzeSkinUndertoneFromImage(image);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Scan skin API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process skin undertone scan. Please try again.',
        rejection_reason: 'Scan encountered a network error. You can retry or select manually.',
      },
      { status: 500 }
    );
  }
}
