import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { outfit_id, rating, feedback_tags = [], comment } = body;

    if (!outfit_id || !rating) {
      return NextResponse.json({ error: 'Outfit ID and rating are required.' }, { status: 400 });
    }

    const feedback = await Repository.recordFeedback(session.userId, {
      outfit_id,
      rating,
      feedback_tags,
      comment,
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Record outfit feedback error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
