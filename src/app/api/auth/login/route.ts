import { NextRequest, NextResponse } from 'next/server';
import { isValidPinFormat, normalizeMobileNumber } from '@/lib/auth/pin';
import {
  createSessionToken,
  setSessionCookie,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile_number, pin } = body;

    const cleanMobile = normalizeMobileNumber(mobile_number || '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (!pin || !isValidPinFormat(pin)) {
      return NextResponse.json({ error: 'Please enter your 6-digit security PIN.' }, { status: 400 });
    }

    // Rate limiting check
    const rateCheck = checkRateLimit(cleanMobile);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. For your wardrobe privacy, access is paused. Try again in ${rateCheck.retryAfterMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Lookup user in Supabase
    const user = await Repository.findUserByMobile(cleanMobile);
    if (!user) {
      recordFailedAttempt(cleanMobile);
      return NextResponse.json(
        { error: 'No account found with this mobile number. Please register your account.' },
        { status: 404 }
      );
    }

    // Verify PIN / credentials against Supabase Auth
    const authResult = await Repository.verifyCredentials(cleanMobile, pin);
    if (!authResult.success || !authResult.user) {
      recordFailedAttempt(cleanMobile);
      return NextResponse.json(
        { error: 'Invalid mobile number or PIN.' },
        { status: 401 }
      );
    }

    const authenticatedUser = authResult.user;

    // Success: Clear failed attempts
    clearFailedAttempts(cleanMobile);

    // Create session token and set secure HTTP-only cookie
    const token = await createSessionToken(authenticatedUser);
    await setSessionCookie(token);

    // Check profile completion status
    const profile = await Repository.getUserProfile(authenticatedUser.id);
    const isProfileCompleted = Boolean(profile?.profile_completed);

    return NextResponse.json({
      success: true,
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        mobile_number: authenticatedUser.mobile_number,
      },
      profile_completed: isProfileCompleted,
      redirectTo: isProfileCompleted ? '/dashboard' : '/onboarding',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
