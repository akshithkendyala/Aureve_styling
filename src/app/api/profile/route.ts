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

    // If attempting to complete profile, enforce required fields (Name, Mobile, Age)
    if (updates.profile_completed === true) {
      const existingProfile = await Repository.getUserProfile(session.userId);

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
    }

    const updatedProfile = await Repository.upsertUserProfile(session.userId, updates);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
