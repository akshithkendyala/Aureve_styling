import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { isValidIndianMobile, normalizeMobileNumber } from '@/lib/auth/mobile';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await Repository.getUserProfile(session.userId);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    // Check mobile validation
    if (updates.mobile_number !== undefined && updates.mobile_number !== '') {
      const normalized = normalizeMobileNumber(updates.mobile_number);
      if (!normalized) {
        return NextResponse.json(
          { error: 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210).' },
          { status: 400 }
        );
      }
      updates.mobile_number = normalized;
    }

    // Check age validation if supplied
    if (updates.age !== undefined && updates.age !== null && updates.age !== '') {
      const parsedAge = Number(updates.age);
      if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        return NextResponse.json(
          { error: 'Please enter a valid age between 13 and 120.' },
          { status: 400 }
        );
      }
      updates.age = parsedAge;
    }

    // Check gender validation if supplied
    if (updates.gender !== undefined && updates.gender !== null && updates.gender !== '') {
      const allowedGenders = ['Male', 'Female', 'Non-binary / Other', 'Prefer not to say'];
      if (!allowedGenders.includes(updates.gender)) {
        return NextResponse.json(
          { error: 'Please select a valid gender option.' },
          { status: 400 }
        );
      }
    }

    const existingProfile = await Repository.getUserProfile(session.userId);

    // Only enforce mandatory mobile/age during first-time onboarding completion
    const isFirstTimeOnboarding = updates.is_onboarding === true || (!existingProfile?.profile_completed && updates.profile_completed === true && !updates.from_style_profile);

    if (isFirstTimeOnboarding) {
      const targetName = (updates.name || updates.full_name || existingProfile?.name || '').trim();
      if (!targetName) {
        return NextResponse.json(
          { error: 'Please enter your name to complete your AUREVÉ profile.' },
          { status: 400 }
        );
      }
      updates.name = targetName;
      updates.full_name = targetName;

      const targetMobile = updates.mobile_number || existingProfile?.mobile_number;
      if (!targetMobile || !isValidIndianMobile(targetMobile)) {
        return NextResponse.json(
          { error: 'A valid 10-digit Indian mobile number is required to complete your profile.' },
          { status: 400 }
        );
      }
      updates.mobile_number = normalizeMobileNumber(targetMobile);

      const targetAge = updates.age !== undefined ? Number(updates.age) : existingProfile?.age;
      if (!targetAge || isNaN(targetAge) || targetAge < 13 || targetAge > 120) {
        return NextResponse.json(
          { error: 'Please enter a valid age (13-120) to complete your profile.' },
          { status: 400 }
        );
      }
      updates.age = targetAge;

      if (!updates.city) {
        return NextResponse.json(
          { error: 'Please select your home city for climate calibration.' },
          { status: 400 }
        );
      }

      if (!updates.height) {
        return NextResponse.json(
          { error: 'Please select your height in Step 2 (Proportions).' },
          { status: 400 }
        );
      }

      if (!updates.weight) {
        return NextResponse.json(
          { error: 'Please enter your weight in Step 2 (Proportions).' },
          { status: 400 }
        );
      }

      if (!updates.body_build) {
        return NextResponse.json(
          { error: 'Please select your body build in Step 2 (Proportions).' },
          { status: 400 }
        );
      }

      if (!updates.skin_tone) {
        return NextResponse.json(
          { error: 'Please select your skin undertone in Step 2 (Proportions).' },
          { status: 400 }
        );
      }

      if (!updates.preferred_fit) {
        return NextResponse.json(
          { error: 'Please select your preferred clothing fit in Step 2 (Proportions).' },
          { status: 400 }
        );
      }

      if (!Array.isArray(updates.favorite_colors) || updates.favorite_colors.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least 1 favorite color in Step 3 (Palette).' },
          { status: 400 }
        );
      }

      if (!Array.isArray(updates.style_preferences) || updates.style_preferences.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least 1 style aesthetic in Step 3 (Palette).' },
          { status: 400 }
        );
      }

      if (!Array.isArray(updates.typical_occasions) || updates.typical_occasions.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least 1 typical occasion in Step 4 (Lifestyle).' },
          { status: 400 }
        );
      }

      if (!updates.comfort_preference) {
        return NextResponse.json(
          { error: 'Please select your comfort vs structure preference in Step 4 (Lifestyle).' },
          { status: 400 }
        );
      }

      updates.profile_completed = true;
    } else {
      // Styling profile edit mode: retain existing required fields if not provided
      const resolvedName = (updates.name || updates.full_name || existingProfile?.name || session.name || 'Member').trim();
      updates.name = resolvedName;
      updates.full_name = resolvedName;

      if (updates.mobile_number === undefined && existingProfile?.mobile_number) {
        updates.mobile_number = existingProfile.mobile_number;
      }
      if (updates.age === undefined && existingProfile?.age) {
        updates.age = existingProfile.age;
      }
      if (updates.city === undefined && existingProfile?.city) {
        updates.city = existingProfile.city;
      }
      if (updates.height === undefined && existingProfile?.height) {
        updates.height = existingProfile.height;
      }
      if (updates.weight === undefined && existingProfile?.weight) {
        updates.weight = existingProfile.weight;
      }
      if (updates.body_build === undefined && existingProfile?.body_build) {
        updates.body_build = existingProfile.body_build;
      }
      if (updates.skin_tone === undefined && existingProfile?.skin_tone) {
        updates.skin_tone = existingProfile.skin_tone;
      }
      if (updates.preferred_fit === undefined && existingProfile?.preferred_fit) {
        updates.preferred_fit = existingProfile.preferred_fit;
      }
      if (updates.comfort_preference === undefined && existingProfile?.comfort_preference) {
        updates.comfort_preference = existingProfile.comfort_preference;
      }
      if (updates.favorite_colors === undefined && existingProfile?.favorite_colors) {
        updates.favorite_colors = existingProfile.favorite_colors;
      }
      if (updates.avoided_colors === undefined && existingProfile?.avoided_colors) {
        updates.avoided_colors = existingProfile.avoided_colors;
      }
      if (updates.style_preferences === undefined && existingProfile?.style_preferences) {
        updates.style_preferences = existingProfile.style_preferences;
      }
      if (updates.typical_occasions === undefined && existingProfile?.typical_occasions) {
        updates.typical_occasions = existingProfile.typical_occasions;
      }

      // Preserve profile completion or mark complete if previously completed
      updates.profile_completed = existingProfile?.profile_completed ?? true;
    }

    const updatedProfile = await Repository.upsertUserProfile(session.userId, updates);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
