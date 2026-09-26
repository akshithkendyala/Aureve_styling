import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { generateIntelligentOutfit } from '@/lib/ai/outfitEngine';
import { fetchWeatherData } from '@/lib/weather/weatherService';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { occasion, date, time, location = 'Mumbai', specialMode = 'standard' } = body;

    if (!occasion) {
      return NextResponse.json({ error: 'Occasion is required to style an outfit.' }, { status: 400 });
    }

    // Retrieve user profile, active wardrobe, previous outfits, and user feedback
    const [profile, wardrobe, previousOutfits, userFeedback] = await Promise.all([
      Repository.getUserProfile(session.userId),
      Repository.getWardrobeItems(session.userId, { includeArchived: false }),
      Repository.getUserOutfits(session.userId),
      Repository.getUserFeedback(session.userId),
    ]);

    if (!wardrobe || wardrobe.length === 0) {
      return NextResponse.json(
        {
          error: 'Your wardrobe is empty. Please add your tops and bottoms first so AUREVÉ can style them.',
          needsWardrobe: true,
        },
        { status: 400 }
      );
    }

    // Fetch real-time weather for the designated location
    const weather = await fetchWeatherData(location || profile?.city || 'Mumbai');

    // Run AI Occasion Intelligence & Styling Engine
    const outfitResult = await generateIntelligentOutfit({
      userId: session.userId,
      userProfile: profile,
      wardrobe,
      occasion,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '19:00',
      location: location || profile?.city || 'Mumbai',
      weather,
      previousOutfits,
      specialMode,
    });

    return NextResponse.json({ success: true, outfit: outfitResult });
  } catch (error: any) {
    console.error('Outfit generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outfit recommendation' },
      { status: 500 }
    );
  }
}
