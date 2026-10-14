import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  let user = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch (e) {
      // Supabase user fetch failed
    }
  }

  // Extract fallback JWT cookie payload
  let sessionPayload: any = null;
  const fallbackCookie = request.cookies.get('aureve_session')?.value;
  if (fallbackCookie) {
    sessionPayload = await verifySessionToken(fallbackCookie);
    if (sessionPayload?.userId && !user) {
      user = { id: sessionPayload.userId } as any;
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login';
  const isRootRoute = pathname === '/';
  const isLandingQuery = request.nextUrl.searchParams.get('landing') === 'true';
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // Protect internal dashboard & onboarding routes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/wardrobe') ||
    pathname.startsWith('/create-outfit') ||
    pathname.startsWith('/looks') ||
    pathname.startsWith('/style-profile') ||
    pathname.startsWith('/style-yourself') ||
    pathname.startsWith('/settings') ||
    isOnboardingRoute;

  // Unauthenticated user attempting to access protected route -> redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user with completed profile visiting onboarding -> redirect to dashboard
  if (isOnboardingRoute && user && sessionPayload?.profileCompleted === true) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Authenticated user visiting /login -> redirect directly to dashboard (or onboarding if incomplete)
  if (isAuthRoute && user) {
    const target = sessionPayload?.profileCompleted === false ? '/onboarding' : '/dashboard';
    const redirectUrl = new URL(target, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user reopening root / -> redirect directly to dashboard (or onboarding)
  // unless explicitly requesting marketing landing page with ?landing=true
  if (isRootRoute && user && !isLandingQuery) {
    const target = sessionPayload?.profileCompleted === false ? '/onboarding' : '/dashboard';
    const redirectUrl = new URL(target, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
