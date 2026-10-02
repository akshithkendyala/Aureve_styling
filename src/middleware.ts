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

  // Also check fallback JWT cookie
  if (!user) {
    const fallbackCookie = request.cookies.get('aureve_session')?.value;
    if (fallbackCookie) {
      const payload = await verifySessionToken(fallbackCookie);
      if (payload?.userId) {
        user = { id: payload.userId } as any;
      }
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login';
  const isCallbackRoute = pathname.startsWith('/auth/callback');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/);

  // Protect internal dashboard & onboarding routes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/wardrobe') ||
    pathname.startsWith('/create-outfit') ||
    pathname.startsWith('/looks') ||
    pathname.startsWith('/style-profile') ||
    pathname.startsWith('/style-yourself') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding');

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting login page, redirect
  if (isAuthRoute && user) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
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
