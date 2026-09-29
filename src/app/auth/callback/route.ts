import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Repository } from '@/lib/db/repository';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Robust origin detection across local dev and Vercel reverse proxy
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;

  if (error) {
    console.error('Google OAuth callback error from provider:', error, errorDescription);
    const msg = error === 'access_denied' 
      ? 'Google sign-in was cancelled.' 
      : (errorDescription || 'Google authentication failed. Please try again.');
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Supabase exchangeCodeForSession error:', exchangeError);
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Unable to complete Google sign-in. Please try again.')}`
        );
      }

      if (data?.user) {
        const authUser = data.user;

        // Sync or initialize user in public.users and public.profiles
        await Repository.syncUserFromAuth(authUser);

        // Also create our backup signed session cookie to guarantee session resilience
        try {
          const token = await createSessionToken({
            userId: authUser.id,
            email: authUser.email,
            name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split('@')[0] ||
              'Member',
            mobile: authUser.user_metadata?.mobile_number || '',
            avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          });
          await setSessionCookie(token);
        } catch (cookieErr) {
          console.warn('Set fallback cookie error:', cookieErr);
        }

        // Check if user has already completed onboarding
        const profile = await Repository.getUserProfile(authUser.id);

        if (profile && profile.profile_completed === true) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
    } catch (err) {
      console.error('OAuth callback unhandled exception:', err);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('An unexpected error occurred during authentication.')}`
      );
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/login`);
}
