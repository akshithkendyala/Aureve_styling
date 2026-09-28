import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'PIN login has been discontinued. Please sign in with Google.' },
    { status: 410 }
  );
}
