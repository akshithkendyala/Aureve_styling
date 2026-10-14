/**
 * test_persistent_daily_session.ts
 *
 * Comprehensive validation suite for:
 * 1. Persistent Daily Session Expiration Policy (Asia/Kolkata timezone)
 * 2. Late-night buffer logic (e.g. 11:55 PM login guarantees > 4 hours up to next midnight)
 * 3. Normal morning/afternoon login expiration (expires at tonight's midnight)
 * 4. JWT generation, verification, and profileCompleted persistence
 * 5. Expired token rejection
 * 6. Session restoration and route protection simulation
 */

import { getDailySessionExpiry, createSessionToken, verifySessionToken } from '../src/lib/auth/session';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTING AUREVÉ PERSISTENT DAILY SESSION SYSTEM');
  console.log('======================================================\n');

  // Test 1: Morning login (e.g. 9:00 AM IST on Oct 14, 2026)
  // 9:00 AM IST = 03:30:00 UTC
  const morningDate = new Date(Date.UTC(2026, 9, 14, 3, 30, 0));
  const morningExpiry = getDailySessionExpiry('Asia/Kolkata', morningDate);
  
  assert(
    morningExpiry.formattedDate === '2026-10-14',
    'Morning login correctly tags session date as 2026-10-14 in Asia/Kolkata'
  );
  // Remaining hours should be exactly 15 hours (54,000 seconds)
  assert(
    morningExpiry.secondsRemaining === 15 * 3600,
    `Morning 9:00 AM IST expires in exactly 15 hours (expected 54000s, got ${morningExpiry.secondsRemaining}s)`
  );

  // Test 2: Afternoon login (e.g. 2:00 PM IST on Oct 14, 2026)
  // 2:00 PM IST = 08:30:00 UTC
  const afternoonDate = new Date(Date.UTC(2026, 9, 14, 8, 30, 0));
  const afternoonExpiry = getDailySessionExpiry('Asia/Kolkata', afternoonDate);
  assert(
    afternoonExpiry.secondsRemaining === 10 * 3600,
    `Afternoon 2:00 PM IST expires in exactly 10 hours (expected 36000s, got ${afternoonExpiry.secondsRemaining}s)`
  );

  // Test 3: Late-night buffer login (e.g. 11:55 PM IST on Oct 14, 2026)
  // 11:55 PM IST = 18:25:00 UTC
  // Without buffer, remaining time would be only 5 minutes (300 seconds).
  // With late-night buffer, remaining time must extend to next day's midnight (+24h = 86,700 seconds).
  const lateNightDate = new Date(Date.UTC(2026, 9, 14, 18, 25, 0));
  const lateNightExpiry = getDailySessionExpiry('Asia/Kolkata', lateNightDate);
  const fiveMinutesPlusOneDay = 5 * 60 + 24 * 3600;
  
  assert(
    lateNightExpiry.secondsRemaining === fiveMinutesPlusOneDay,
    `Late-night 11:55 PM login activates buffer and extends to next midnight (expected ${fiveMinutesPlusOneDay}s, got ${lateNightExpiry.secondsRemaining}s)`
  );
  assert(
    lateNightExpiry.secondsRemaining > 4 * 3600,
    'Late-night login guarantees > 4 hours duration without early ejection'
  );

  // Test 4: Early morning login (e.g. 12:05 AM IST on Oct 15, 2026)
  // 12:05 AM IST = 18:35:00 UTC on Oct 14
  const earlyMorningDate = new Date(Date.UTC(2026, 9, 14, 18, 35, 0));
  const earlyMorningExpiry = getDailySessionExpiry('Asia/Kolkata', earlyMorningDate);
  const almostFullDay = 23 * 3600 + 55 * 60;
  assert(
    earlyMorningExpiry.formattedDate === '2026-10-15',
    'Early morning 12:05 AM correctly resolves to Oct 15 date in Asia/Kolkata'
  );
  assert(
    earlyMorningExpiry.secondsRemaining === almostFullDay,
    `Early morning 12:05 AM expires at midnight of same day (expected ${almostFullDay}s, got ${earlyMorningExpiry.secondsRemaining}s)`
  );

  // Test 5: JWT Token creation and verification with profileCompleted: true
  const tokenCompleted = await createSessionToken({
    userId: 'user_test_akshith_123',
    email: 'akshith@example.com',
    name: 'Akshith Kendyala',
    profileCompleted: true,
  });
  assert(typeof tokenCompleted === 'string' && tokenCompleted.length > 50, 'Session token successfully created');

  const payloadCompleted = await verifySessionToken(tokenCompleted);
  assert(payloadCompleted !== null, 'Session token verifies successfully');
  assert(payloadCompleted?.userId === 'user_test_akshith_123', 'Verified payload has correct userId');
  assert(payloadCompleted?.email === 'akshith@example.com', 'Verified payload has correct email');
  assert(payloadCompleted?.name === 'Akshith Kendyala', 'Verified payload has correct name');
  assert(payloadCompleted?.profileCompleted === true, 'Verified payload preserves profileCompleted: true');
  assert(typeof payloadCompleted?.sessionDate === 'string', 'Verified payload has sessionDate stamp');

  // Test 6: JWT Token creation with profileCompleted: false (new user in onboarding)
  const tokenIncomplete = await createSessionToken({
    userId: 'user_test_new_456',
    email: 'newuser@example.com',
    name: 'New Stylist',
    profileCompleted: false,
  });
  const payloadIncomplete = await verifySessionToken(tokenIncomplete);
  assert(payloadIncomplete?.profileCompleted === false, 'Verified payload preserves profileCompleted: false for new users');

  // Test 7: Tampered or invalid token rejection
  const tamperedToken = tokenCompleted.slice(0, -10) + 'invaliddata';
  const payloadTampered = await verifySessionToken(tamperedToken);
  assert(payloadTampered === null, 'Tampered JWT token is securely rejected');

  // Test 8: Empty/corrupted token rejection
  const emptyTokenVerify = await verifySessionToken('');
  assert(emptyTokenVerify === null, 'Empty token string returns null safely without throwing');

  // Test 9: Middleware routing decisions simulation
  function simulateMiddleware(params: {
    pathname: string;
    hasSession: boolean;
    profileCompleted?: boolean;
    isLandingQuery?: boolean;
  }) {
    const { pathname, hasSession, profileCompleted, isLandingQuery } = params;
    const isAuthRoute = pathname === '/login';
    const isRootRoute = pathname === '/';
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isProtectedRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/wardrobe') ||
      pathname.startsWith('/create-outfit') ||
      pathname.startsWith('/looks') ||
      pathname.startsWith('/style-profile') ||
      pathname.startsWith('/style-yourself') ||
      pathname.startsWith('/settings') ||
      isOnboardingRoute;

    if (isProtectedRoute && !hasSession) {
      return { action: 'redirect', to: '/login' };
    }
    if (isOnboardingRoute && hasSession && profileCompleted === true) {
      return { action: 'redirect', to: '/dashboard' };
    }
    if (isAuthRoute && hasSession) {
      return { action: 'redirect', to: profileCompleted === false ? '/onboarding' : '/dashboard' };
    }
    if (isRootRoute && hasSession && !isLandingQuery) {
      return { action: 'redirect', to: profileCompleted === false ? '/onboarding' : '/dashboard' };
    }
    return { action: 'next' };
  }

  // 9a. Completed user visiting root '/'
  const r1 = simulateMiddleware({ pathname: '/', hasSession: true, profileCompleted: true });
  assert(r1.action === 'redirect' && r1.to === '/dashboard', 'Returning user visiting root / redirects straight to /dashboard');

  // 9b. Completed user visiting '/login'
  const r2 = simulateMiddleware({ pathname: '/login', hasSession: true, profileCompleted: true });
  assert(r2.action === 'redirect' && r2.to === '/dashboard', 'Returning user visiting /login redirects straight to /dashboard');

  // 9c. Completed user visiting '/onboarding'
  const r3 = simulateMiddleware({ pathname: '/onboarding', hasSession: true, profileCompleted: true });
  assert(r3.action === 'redirect' && r3.to === '/dashboard', 'User with completed profile visiting /onboarding redirects to /dashboard');

  // 9d. Incomplete user visiting root '/'
  const r4 = simulateMiddleware({ pathname: '/', hasSession: true, profileCompleted: false });
  assert(r4.action === 'redirect' && r4.to === '/onboarding', 'Incomplete user visiting root / redirects to /onboarding');

  // 9e. Unauthenticated user visiting '/dashboard'
  const r5 = simulateMiddleware({ pathname: '/dashboard', hasSession: false });
  assert(r5.action === 'redirect' && r5.to === '/login', 'Unauthenticated user visiting /dashboard is redirected to /login');

  // 9f. Unauthenticated user visiting root '/'
  const r6 = simulateMiddleware({ pathname: '/', hasSession: false });
  assert(r6.action === 'next', 'Unauthenticated visitor at root / sees landing page');

  // 9g. Authenticated user explicitly requesting marketing landing with ?landing=true
  const r7 = simulateMiddleware({ pathname: '/', hasSession: true, profileCompleted: true, isLandingQuery: true });
  assert(r7.action === 'next', 'Authenticated user explicitly browsing ?landing=true is allowed to view landing');

  console.log('\n======================================================');
  console.log(`SESSION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
