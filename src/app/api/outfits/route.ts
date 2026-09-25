import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const outfits = await Repository.getUserOutfits(session.userId);
    return NextResponse.json({ success: true, outfits });
  } catch (error) {
    console.error('Fetch outfits error:', error);
    return NextResponse.json({ error: 'Failed to retrieve outfit history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      occasion,
      date,
      time,
      location,
      weather_data,
      title,
      ai_explanation,
      style_match,
      style_direction,
      items,
      markAsWorn,
    } = body;

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Title and items are required to save an outfit.' }, { status: 400 });
    }

    const savedOutfit = await Repository.saveOutfit(session.userId, {
      occasion: occasion || 'Casual Outing',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '19:00',
      location: location || 'Mumbai',
      weather_data,
      title,
      ai_explanation: ai_explanation || '',
      style_match: style_match || 94,
      style_direction: style_direction || ['Simple', 'Classy', 'Modern'],
      items,
    });

    // If marked as worn, update wear count on each individual wardrobe item
    if (markAsWorn) {
      for (const it of items) {
        if (it.wardrobe_item_id) {
          await Repository.recordItemWorn(session.userId, it.wardrobe_item_id);
        }
      }
    }

    return NextResponse.json({ success: true, outfit: savedOutfit });
  } catch (error) {
    console.error('Save outfit error:', error);
    return NextResponse.json({ error: 'Failed to save outfit' }, { status: 500 });
  }
}
