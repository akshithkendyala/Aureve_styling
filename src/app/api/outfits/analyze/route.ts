import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { evaluateSelfStyledLook } from '@/lib/ai/outfitEvaluator';
import { fetchWeatherData } from '@/lib/weather/weatherService';
import { buildLearnedStyleProfile } from '@/lib/ai/personalStyleEngine';
import { WardrobeItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      item_ids,
      occasion,
      customOccasionText,
      location = 'Mumbai',
    } = body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'Please select items from your wardrobe to analyze your outfit.' },
        { status: 400 }
      );
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
        { error: 'Your wardrobe is empty. Please add items to your wardrobe first.' },
        { status: 400 }
      );
    }

    // Strict Ownership & User Isolation: Ensure all selected item IDs exist in the user's active wardrobe
    const wardrobeMap = new Map<string, WardrobeItem>(wardrobe.map((item) => [item.id, item]));
    const selectedItems: WardrobeItem[] = [];

    for (const id of item_ids) {
      const item = wardrobeMap.get(id);
      if (!item) {
        return NextResponse.json(
          { error: 'One or more selected items do not belong to your wardrobe.' },
          { status: 403 }
        );
      }
      selectedItems.push(item);
    }

    // Fetch real-time weather if location available
    const weather = await fetchWeatherData(location || profile?.city || 'Mumbai');

    // Build user's learned style profile
    const learnedProfile = buildLearnedStyleProfile(session.userId, userFeedback, previousOutfits, wardrobe);

    const targetOccasion = customOccasionText?.trim() || occasion || 'Casual';

    // Perform comprehensive evaluation
    const analysis = await evaluateSelfStyledLook({
      selectedItems,
      wardrobe,
      occasion: targetOccasion,
      userProfile: profile,
      learnedProfile,
      weather,
    });

    return NextResponse.json({
      success: true,
      analysis,
      selectedItems,
    });
  } catch (err: any) {
    console.error('Error analyzing self-styled look:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred while analyzing your outfit.' },
      { status: 500 }
    );
  }
}
