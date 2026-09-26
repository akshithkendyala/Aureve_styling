import { NextRequest, NextResponse } from 'next/server';
import { isValidPinFormat, normalizeMobileNumber } from '@/lib/auth/pin';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile_number, pin } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide a valid name (at least 2 characters).' }, { status: 400 });
    }

    const cleanMobile = normalizeMobileNumber(mobile_number || '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (!pin || !isValidPinFormat(pin)) {
      return NextResponse.json({ error: 'Security PIN must be exactly 6 numeric digits.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await Repository.findUserByMobile(cleanMobile);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists.' },
        { status: 409 }
      );
    }

    // Create user securely in Supabase Auth & database
    const newUser = await Repository.createUser(name.trim(), cleanMobile, pin);

    // Generate JWT session token
    const token = await createSessionToken(newUser);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        mobile_number: newUser.mobile_number,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
