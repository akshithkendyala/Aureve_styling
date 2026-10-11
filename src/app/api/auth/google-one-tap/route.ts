import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface GoogleTokenInfo {
  iss?: string;
  sub?: string;
  azp?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  exp?: string;
  error_description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'Missing Google Identity credential token.' },
        { status: 400 }
      );
    }

    const expectedClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '573479877652-rscpbk208vp988s4s5asud0aalm1j3i3.apps.googleusercontent.com';

    // 1. Verify Google ID token via official Google TokenInfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { method: 'GET' }
    );

    if (!verifyRes.ok) {
      console.error('Google One Tap token verification failed HTTP status:', verifyRes.status);
      return NextResponse.json(
        { error: 'Google credential verification failed. Please sign in manually.' },
        { status: 401 }
      );
    }

    const payload: GoogleTokenInfo = await verifyRes.json();

    if (!payload.email) {
      return NextResponse.json(
        { error: 'Google account does not have an associated email address.' },
        { status: 400 }
      );
    }

    // Verify audience matches our authorized client ID
    if (payload.aud !== expectedClientId) {
      console.error(
        'Google token audience mismatch. Expected:',
        expectedClientId,
        'Received:',
        payload.aud
      );
      return NextResponse.json(
        { error: 'Invalid Google OAuth client identification.' },
        { status: 401 }
      );
    }

    const email = payload.email.toLowerCase().trim();
    const displayName = payload.name || payload.given_name || email.split('@')[0] || 'Member';
    const avatarUrl = payload.picture || '';

    let userId: string | null = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Look up existing user in public.users by email
      try {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .eq('email', email)
          .maybeSingle();

        if (existingUser?.id) {
          userId = existingUser.id;
        }
      } catch (err) {
        console.warn('Google One Tap lookup by email in users error:', err);
      }

      // If not in public.users, check auth.users via admin
      if (!userId) {
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const match = listData?.users?.find(
            (u) => u.email?.toLowerCase().trim() === email
          );
          if (match?.id) {
            userId = match.id;
          }
        } catch (authErr) {
          console.warn('Google One Tap listUsers check error:', authErr);
        }
      }

      // If still not found, create a new verified user in Supabase Auth
      if (!userId) {
        try {
          const { data: newAuthUser, error: createAuthErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                name: displayName,
                full_name: displayName,
                picture: avatarUrl,
                avatar_url: avatarUrl,
              },
            });

          if (!createAuthErr && newAuthUser?.user) {
            userId = newAuthUser.user.id;
          } else {
            console.warn('Google One Tap createUser note:', createAuthErr);
          }
        } catch (createErr) {
          console.warn('Google One Tap createUser exception:', createErr);
        }
      }
    }

    if (!userId) {
      // Fallback: derive deterministic UUID-like identifier if Supabase admin creation is blocked
      userId = `google_${payload.sub || Date.now()}`;
    }

    // 2. Synchronize user in public.users and public.profiles safely
    const syncedUser = await Repository.syncUserFromAuth({
      id: userId,
      email,
      user_metadata: {
        name: displayName,
        full_name: displayName,
        avatar_url: avatarUrl,
        picture: avatarUrl,
      },
    });

    // 3. Issue signed JWT session cookie for instant session restoration
    const sessionToken = await createSessionToken({
      userId,
      email,
      name: syncedUser.name || displayName,
      avatarUrl,
      mobile: syncedUser.mobile_number || '',
    });
    await setSessionCookie(sessionToken);

    // 4. Retrieve profile to determine single source of truth for onboarding
    const profile = await Repository.getUserProfile(userId);
    const isProfileCompleted = Boolean(profile?.profile_completed);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: syncedUser.name || displayName,
      },
      profile_completed: isProfileCompleted,
      redirectTo: isProfileCompleted ? '/dashboard' : '/onboarding',
    });
  } catch (error: any) {
    console.error('Google One Tap unhandled error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during Google One Tap sign-in.' },
      { status: 500 }
    );
  }
}
