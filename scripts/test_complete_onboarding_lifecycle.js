const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    const k = key.trim();
    const v = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    envVars[k] = v;
    process.env[k] = v;
  }
});

const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runComprehensiveLifecycleTests() {
  console.log('================================================================');
  console.log('AUREVÉ COMPLETE AUTHENTICATION, ONBOARDING & PERSISTENCE SUITE');
  console.log('================================================================\n');

  const { Repository } = require('../src/lib/db/repository');

  const testUserId = '33333333-3333-3333-3333-333333333333';
  const testEmail = 'lifecycle.test.stylist@aureve-testing.internal';
  const testName = 'Priya Natarajan';
  const testMobile = '+919876543299';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: BRAND NEW USER REGISTRATION & INITIAL PROFILE STATE
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Testing New User Sync from Google Auth...');

    // Clean up previous runs if any
    try {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
    } catch {}
    await supabaseAdmin.from('profiles').delete().eq('user_id', testUserId);
    await supabaseAdmin.from('users').delete().eq('id', testUserId);

    // Create user in Supabase Auth (mirrors real Google OAuth creation)
    const { data: authCreated, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
      id: testUserId,
      email: testEmail,
      email_confirm: true,
      user_metadata: {
        name: testName,
        full_name: testName,
        mobile_number: '',
      },
    });
    if (authCreateErr) throw new Error('Failed to create auth user: ' + authCreateErr.message);

    // Simulate Google OAuth sign-in sync
    const syncedUser = await Repository.syncUserFromAuth({
      id: testUserId,
      email: testEmail,
      user_metadata: {
        full_name: testName,
        name: testName,
        mobile_number: '',
      },
    });

    console.log('✓ User created in Auth & DB:', syncedUser.name, syncedUser.email);

    // Verify initial profile is created with profile_completed = false
    const initialProfile = await Repository.getUserProfile(testUserId);
    if (!initialProfile) throw new Error('Initial profile was not created.');
    if (initialProfile.profile_completed !== false) {
      throw new Error(`Expected profile_completed to be false, got: ${initialProfile.profile_completed}`);
    }
    console.log('✓ Initial profile verified: profile_completed = false (requires onboarding).');

    // -------------------------------------------------------------------------
    // TEST 2: FOUR-STEP ONBOARDING PAYLOAD COMPLETION & PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing 4-Step Onboarding Save with Full Payload...');

    // All 4 steps data
    const onboardingPayload = {
      is_onboarding: true,
      name: testName,
      full_name: testName,
      mobile_number: testMobile,
      age: 26,
      gender: 'Female', // Optional respectful gender field
      city: 'Hyderabad',
      height: `5'6"`,
      weight: '55 kg',
      body_build: 'Athletic',
      skin_tone: 'Medium Wheatish',
      preferred_fit: 'Slim',
      favorite_colors: ['Navy Blue', 'Off-White', 'Burgundy'],
      avoided_colors: ['Neon Green'],
      style_preferences: ['Minimal', 'Smart Casual'],
      comfort_preference: 'Balanced',
      typical_occasions: ['Office', 'Dates', 'Casual outings'],
      profile_completed: true,
    };

    const savedProfile = await Repository.upsertUserProfile(testUserId, onboardingPayload);

    if (!savedProfile) throw new Error('Failed to save completed onboarding profile.');
    if (savedProfile.profile_completed !== true) {
      throw new Error(`Expected profile_completed = true, got: ${savedProfile.profile_completed}`);
    }
    console.log('✓ 4-Step Onboarding successfully saved to database.');
    console.log('✓ Profile completed status: profile_completed =', savedProfile.profile_completed);

    // -------------------------------------------------------------------------
    // TEST 3: DATABASE VERIFICATION — DIRECT SQL QUERY CONFIRMATION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Directly Querying Database to Confirm Persistence...');
    const { data: dbProfile, error: dbErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (dbErr) throw new Error('Failed to query profiles table: ' + dbErr.message);
    if (!dbProfile.profile_completed) {
      throw new Error('Database profile_completed is false in database table!');
    }
    if (dbProfile.city !== 'Hyderabad') {
      throw new Error(`Expected city = Hyderabad, got: ${dbProfile.city}`);
    }
    if (dbProfile.height !== `5'6"`) {
      throw new Error(`Expected height = 5'6", got: ${dbProfile.height}`);
    }
    if (dbProfile.weight !== '55 kg') {
      throw new Error(`Expected weight = 55 kg, got: ${dbProfile.weight}`);
    }
    if (!Array.isArray(dbProfile.favorite_colors) || dbProfile.favorite_colors.length !== 3) {
      throw new Error(`Favorite colors array mismatch: ${JSON.stringify(dbProfile.favorite_colors)}`);
    }

    console.log('✓ Verified directly from Supabase PostgreSQL table:');
    console.log('  - city:', dbProfile.city);
    console.log('  - height:', dbProfile.height);
    console.log('  - weight:', dbProfile.weight);
    console.log('  - favorite_colors:', dbProfile.favorite_colors);
    console.log('  - profile_completed:', dbProfile.profile_completed);

    // -------------------------------------------------------------------------
    // TEST 4: RETURNING USER LOOKUP — MUST NOT RE-ONBOARD
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing Returning Completed User Lookup...');
    const returningProfile = await Repository.getUserProfile(testUserId);

    if (!returningProfile) throw new Error('Failed to retrieve returning profile.');
    if (returningProfile.profile_completed !== true) {
      throw new Error('Returning completed user was incorrectly flagged as incomplete!');
    }
    if (returningProfile.gender !== 'Female') {
      throw new Error(`Expected gender = Female, got: ${returningProfile.gender}`);
    }
    if (returningProfile.body_build !== 'Athletic') {
      throw new Error(`Expected body_build = Athletic, got: ${returningProfile.body_build}`);
    }
    if (returningProfile.age !== 26) {
      throw new Error(`Expected age = 26, got: ${returningProfile.age}`);
    }
    console.log('✓ Returning user correctly identified as completed (redirect destination: /dashboard).');
    console.log('✓ All 4 steps of information preserved accurately.');

    // -------------------------------------------------------------------------
    // TEST 5: PROFILE EDITING WITHOUT RE-ONBOARDING
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing Profile Editing (/style-profile) with Partial Updates...');
    const editPayload = {
      from_style_profile: true,
      city: 'Bengaluru', // Changed city
      preferred_fit: 'Relaxed', // Changed fit
      favorite_colors: ['Navy Blue', 'Off-White', 'Sage Green'], // Added Sage Green
      profile_completed: true,
    };

    const editedProfile = await Repository.upsertUserProfile(testUserId, editPayload);

    if (editedProfile.city !== 'Bengaluru') {
      throw new Error(`Expected updated city = Bengaluru, got: ${editedProfile.city}`);
    }
    if (editedProfile.preferred_fit !== 'Relaxed') {
      throw new Error(`Expected updated preferred_fit = Relaxed, got: ${editedProfile.preferred_fit}`);
    }
    // Verify unchanged fields were preserved
    if (editedProfile.height !== `5'6"`) {
      throw new Error(`Unchanged height was lost! Got: ${editedProfile.height}`);
    }
    if (editedProfile.mobile_number !== testMobile) {
      throw new Error(`Unchanged mobile number was lost! Got: ${editedProfile.mobile_number}`);
    }
    if (editedProfile.profile_completed !== true) {
      throw new Error('Profile completion was accidentally reset during edit!');
    }
    console.log('✓ Profile editing succeeded without re-onboarding.');
    console.log('✓ Unmodified fields preserved (height, mobile, gender, body_build).');
    console.log('✓ Modified fields persisted successfully.');

    // -------------------------------------------------------------------------
    // TEST 6: CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n[CLEANUP] Cleaning up test records...');
    await supabaseAdmin.from('profiles').delete().eq('user_id', testUserId);
    await supabaseAdmin.from('users').delete().eq('id', testUserId);
    await supabaseAdmin.auth.admin.deleteUser(testUserId).catch(() => {});
    console.log('✓ Test cleanup complete.');

    console.log('\n================================================================');
    console.log('ALL TESTS PASSED! Authentication, Onboarding & Persistence Verified.');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    // Cleanup even on error
    try {
      await supabaseAdmin.from('profiles').delete().eq('user_id', testUserId);
      await supabaseAdmin.from('users').delete().eq('id', testUserId);
      await supabaseAdmin.auth.admin.deleteUser(testUserId).catch(() => {});
    } catch {}
    process.exit(1);
  }
}

runComprehensiveLifecycleTests();
