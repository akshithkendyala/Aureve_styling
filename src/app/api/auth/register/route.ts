import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Registration is now handled automatically via Google OAuth.' },
    { status: 410 }
  );
}
