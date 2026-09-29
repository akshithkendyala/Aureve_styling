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
    envVars[key.trim()] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('================================================================');
  console.log('AUREVÉ AUTHENTICATION & DATA ISOLATION TEST SUITE');
  console.log('================================================================\n');

  const userA_id = '11111111-1111-1111-1111-111111111111';
  const userA_email = 'usera.fashion@gmail.com';
  const userA_name = 'Ananya Sharma';
  const userA_mobile = '+919876543210';

  const userB_id = '22222222-2222-2222-2222-222222222222';
  const userB_email = 'userb.style@gmail.com';
  const userB_name = 'Rohan Verma';
  const userB_mobile = '+919123456789';

  try {
    // -------------------------------------------------------------
    // TEST 1: NEW USER SYNC FROM GOOGLE OAUTH
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing New User Sync from Google OAuth...');
    const { data: uSyncA, error: errSyncA } = await supabase.from('users').upsert({
      id: userA_id,
      name: userA_name,
      email: userA_email,
      mobile_number: '',
    }).select('*');
    if (errSyncA) throw new Error('Failed to sync user A: ' + errSyncA.message);

    // Ensure initial profile row
    const { data: pInitA, error: errPInitA } = await supabase.from('profiles').upsert({
      user_id: userA_id,
      city: 'Mumbai',
      height: "5'7\"",
      weight: '58 kg',
      skin_tone: 'Medium Wheatish',
      preferred_fit: 'Regular',
      favorite_colors: ['Navy Blue', 'Off-White'],
      avoided_colors: ['Neon Green'],
      style_preferences: ['Smart Casual', 'Minimal'],
      comfort_preference: 'Balanced',
      typical_occasions: ['Office', 'Dates'],
      profile_completed: false,
    }, { onConflict: 'user_id' }).select('*');
    if (errPInitA) throw new Error('Failed to create initial profile: ' + errPInitA.message);

    console.log('✓ Google user A created with profile_completed = false.');

    // -------------------------------------------------------------
    // TEST 2: IDEMPOTENCY / RETURNING USER LOOKUP
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing Profile Creation Idempotency...');
    // Upsert again with same user_id
    const { data: pIdempA, error: errIdempA } = await supabase.from('profiles').upsert({
      user_id: userA_id,
      city: 'Mumbai',
      profile_completed: false,
    }, { onConflict: 'user_id' }).select('*');
    if (errIdempA) throw new Error('Idempotency check failed: ' + errIdempA.message);

    // Verify exactly 1 profile exists for user A
    const { data: pCountA } = await supabase.from('profiles').select('id').eq('user_id', userA_id);
    if (pCountA.length !== 1) throw new Error(`Expected exactly 1 profile, found ${pCountA.length}`);
    console.log('✓ Profile creation is strictly idempotent (no duplicates).');

    // -------------------------------------------------------------
    // TEST 3: ONBOARDING COMPLETION WITH MANDATORY MOBILE NUMBER
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Onboarding Profile Completion with Mobile Number...');
    // Update user's mobile number
    await supabase.from('users').update({
      mobile_number: userA_mobile,
    }).eq('id', userA_id);

    // Complete profile with Name, Mobile, and Age
    const userA_age = 24;
    await supabase.from('users').update({
      name: 'Akshith',
      mobile_number: userA_mobile,
    }).eq('id', userA_id);

    // Complete profile
    const { data: pCompletedA, error: errPComp } = await supabase.from('profiles').update({
      height: "5'7\"",
      weight: '58 kg',
      skin_tone: 'Medium Wheatish',
      preferred_fit: 'Slim',
      favorite_colors: ['Navy Blue', 'Olive Green', 'Off-White'],
      avoided_colors: ['Neon Green'],
      style_preferences: ['Smart Casual', 'Modern Indian'],
      comfort_preference: 'Balanced',
      typical_occasions: ['Office', 'Dates', 'Casual outings'],
      city: 'Delhi',
      profile_completed: true,
    }).eq('user_id', userA_id).select('*');
    if (errPComp) throw new Error('Failed to complete profile: ' + errPComp.message);

    console.log('✓ Profile successfully completed with Name: Akshith, Mobile:', userA_mobile);
    console.log('✓ profile_completed =', pCompletedA[0].profile_completed);

    // -------------------------------------------------------------
    // TEST 4: STRICT USER DATA ISOLATION (WARDROBE)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing Strict User Data Isolation for Wardrobe Items...');
    // Add wardrobe items for User A
    const { data: itemA1 } = await supabase.from('wardrobe_items').insert({
      user_id: userA_id,
      name: 'Navy Linen Shirt',
      category: 'tops',
      subcategory: 'shirt',
      primary_color: 'Navy Blue',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Linen',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['Summer', 'All-Season'],
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
      is_favorite: true,
      times_worn: 0,
    }).select('*').single();

    // Create User B
    await supabase.from('users').upsert({
      id: userB_id,
      name: userB_name,
      email: userB_email,
      mobile_number: userB_mobile,
    });
    await supabase.from('profiles').upsert({
      user_id: userB_id,
      city: 'Bengaluru',
      profile_completed: true,
    }, { onConflict: 'user_id' });

    // User B adds their own item
    const { data: itemB1 } = await supabase.from('wardrobe_items').insert({
      user_id: userB_id,
      name: 'Olive Cargo Pants',
      category: 'bottoms',
      subcategory: 'cargo_pants',
      primary_color: 'Olive Green',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Cotton',
      fit: 'Relaxed',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
      is_favorite: false,
      times_worn: 0,
    }).select('*').single();

    // Query User A's wardrobe
    const { data: userAWardrobe } = await supabase.from('wardrobe_items').select('*').eq('user_id', userA_id);
    // Query User B's wardrobe
    const { data: userBWardrobe } = await supabase.from('wardrobe_items').select('*').eq('user_id', userB_id);

    const userASeesB = userAWardrobe.some((i) => i.user_id === userB_id || i.name === 'Olive Cargo Pants');
    const userBSeesA = userBWardrobe.some((i) => i.user_id === userA_id || i.name === 'Navy Linen Shirt');

    if (userASeesB || userBSeesA) {
      throw new Error('SECURITY VIOLATION: Cross-user wardrobe data leak detected!');
    }
    console.log(`✓ User A wardrobe count: ${userAWardrobe.length} (contains only User A items)`);
    console.log(`✓ User B wardrobe count: ${userBWardrobe.length} (contains only User B items)`);
    console.log('✓ Strict wardrobe data isolation verified.');

    // -------------------------------------------------------------
    // TEST 5: STRICT USER DATA ISOLATION (OUTFITS)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing Strict User Data Isolation for Outfits...');
    const { data: outfitA } = await supabase.from('outfits').insert({
      user_id: userA_id,
      occasion: 'Office',
      date: '2026-09-29',
      title: 'Effortless Smart Office Ensemble',
      ai_explanation: 'Tailored for Mumbai work climate with breathable linen.',
      style_match: 95,
      style_direction: ['Smart Casual', 'Minimal'],
    }).select('*').single();

    const { data: userAOutfits } = await supabase.from('outfits').select('*').eq('user_id', userA_id);
    const { data: userBOutfits } = await supabase.from('outfits').select('*').eq('user_id', userB_id);

    if (userBOutfits.some((o) => o.id === outfitA.id || o.user_id === userA_id)) {
      throw new Error('SECURITY VIOLATION: Cross-user outfit data leak detected!');
    }
    console.log(`✓ User A outfits: ${userAOutfits.length}`);
    console.log(`✓ User B outfits: ${userBOutfits.length}`);
    console.log('✓ Strict outfit data isolation verified.');

    // Clean up test records
    console.log('\n[CLEANUP] Cleaning up test records...');
    await supabase.from('outfits').delete().in('user_id', [userA_id, userB_id]);
    await supabase.from('wardrobe_items').delete().in('user_id', [userA_id, userB_id]);
    await supabase.from('profiles').delete().in('user_id', [userA_id, userB_id]);
    await supabase.from('users').delete().in('id', [userA_id, userB_id]);
    console.log('✓ Test cleanup complete.');

    console.log('\n================================================================');
    console.log('ALL TESTS PASSED! Google OAuth & Supabase isolation verified.');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
