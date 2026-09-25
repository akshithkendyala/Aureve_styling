import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, isValidPinFormat, normalizeMobileNumber } from '@/lib/auth/pin';
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

    // Lookup user
    const user = await Repository.findUserByMobile(cleanMobile);
    if (!user || !user.pin_hash) {
      recordFailedAttempt(cleanMobile);
      return NextResponse.json(
        { error: 'No account found with this mobile number. Please register your account.' },
        { status: 404 }
      );
    }

    // Verify PIN with bcrypt
    const isPinValid = await verifyPin(pin, user.pin_hash);
    if (!isPinValid) {
      recordFailedAttempt(cleanMobile);
      return NextResponse.json({ error: 'Incorrect 6-digit PIN. Please try again.' }, { status: 401 });
    }

    // Success: Clear failed attempts
    clearFailedAttempts(cleanMobile);

    // Create session token and set secure cookie
    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        mobile_number: user.mobile_number,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
