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
    const {
      occasion = 'Date',
      customOccasionText,
      date,
      time,
      location,
      specialMode = 'standard',
    } = body;

    if (!occasion && (!customOccasionText || customOccasionText.trim().length === 0)) {
      return NextResponse.json({ error: 'Occasion or description is required to style an outfit.' }, { status: 400 });
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

    // Location Resolution: 1. Current outfit location from body -> 2. Saved profile city -> 3. Fallback
    const resolvedLocation = (location && String(location).trim()) || profile?.city?.trim() || 'Hyderabad';
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetTime = time || '19:00';

    // Fetch real-time weather or planned outing forecast for the designated location
    const weather = await fetchWeatherData(resolvedLocation, { date: targetDate, time: targetTime });

    // Run AI Occasion Intelligence & Styling Engine with continuous feedback learning and custom occasion reasoning
    const outfitResult = await generateIntelligentOutfit({
      userId: session.userId,
      userProfile: profile,
      wardrobe,
      occasion,
      customOccasionText,
      date: targetDate,
      time: targetTime,
      location: resolvedLocation,
      weather,
      previousOutfits,
      userFeedback,
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
