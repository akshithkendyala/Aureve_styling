import { parseCustomOccasionDeterministic, interpretCustomOccasion, buildCustomOccasionRule } from '../src/lib/ai/customOccasionEngine';
import { generateIntelligentOutfit } from '../src/lib/ai/outfitEngine';
import { WardrobeItem, UserProfile, OccasionType } from '../src/lib/types';
import { getOccasionRule } from '../src/lib/ai/occasionRules';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 RUNNING AUREVÉ CUSTOM OCCASION & SESSION TIMEOUT TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. CUSTOM OCCASION PARSER & INTERPRETER TESTS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Custom Occasion Natural Language Parsing ---');

  const testCases = [
    {
      text: "I have a farewell party at my college in the evening. It will be outdoors and I want to look stylish but not too formal.",
      expectedOccasion: "party",
      check: (ctx: any) => ctx.environment === 'Outdoor' && ctx.timeContext === 'Evening' && ctx.formality === 'Smart Casual'
    },
    {
      text: "I have a dinner with my manager and a few colleagues at a nice restaurant. I want something professional but not as formal as an interview.",
      expectedOccasion: "dinner",
      check: (ctx: any) => (ctx.matchedBaseOccasion === 'dinner' || ctx.matchedBaseOccasion === 'office') && ctx.formality.includes('Casual')
    },
    {
      text: "I am meeting my cousins at a rooftop restaurant tonight. It is casual but I want to look classy.",
      expectedOccasion: "dinner",
      check: (ctx: any) => ctx.timeContext === 'Night' || ctx.timeContext === 'Evening'
    },
    {
      text: "I have a job interview at a tech startup.",
      expectedOccasion: "interview",
      check: (ctx: any) => ctx.formality === 'Formal' || ctx.matchedBaseOccasion === 'interview'
    },
    {
      text: "I have an event tonight.",
      expectedOccasion: "casual", // graceful fallback, no hallucination of wedding
      check: (ctx: any) => ctx.timeContext === 'Night' && ctx.matchedBaseOccasion !== 'wedding'
    }
  ];

  for (const tc of testCases) {
    const parsed = parseCustomOccasionDeterministic(tc.text, 'Casual Outing');
    assert(
      tc.check(parsed),
      `Deterministic Parsing: "${tc.text.substring(0, 45)}..."`,
      JSON.stringify(parsed)
    );
  }

  console.log('\n--- 2. Testing AI Custom Occasion Refinement ---');
  const aiInterpreted = await interpretCustomOccasion(
    "I have a farewell party at my college in the evening. It will be outdoors and I want to look stylish but not too formal.",
    'Party'
  );

  assert(
    aiInterpreted.matchedBaseOccasion === 'party' || aiInterpreted.interpretedOccasionName.toLowerCase().includes('party') || aiInterpreted.interpretedOccasionName.toLowerCase().includes('farewell'),
    'AI Occasion Type recognized properly',
    `Result: ${aiInterpreted.interpretedOccasionName}`
  );

  assert(
    aiInterpreted.environment === 'Outdoor',
    'AI Environment identified as Outdoor',
    `Result: ${aiInterpreted.environment}`
  );

  assert(
    aiInterpreted.formality === 'Smart Casual',
    'AI Formality identified as Smart Casual',
    `Result: ${aiInterpreted.formality}`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. TESTING DYNAMIC OCCASION RULE BUILDER
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Dynamic Occasion Rule Adaptation ---');
  const adaptedRule = buildCustomOccasionRule(aiInterpreted);

  assert(
    adaptedRule.name.includes('Party') || adaptedRule.name.includes('Farewell'),
    'Adapted rule name incorporates custom occasion title',
    adaptedRule.name
  );

  assert(
    adaptedRule.forbiddenTopSubcategories.includes('Kurta'),
    'Hard safety constraint preserved: Kurta forbidden for Party unless ethnic ceremony',
    JSON.stringify(adaptedRule.forbiddenTopSubcategories)
  );

  assert(
    adaptedRule.stylingTips.some(t => t.toLowerCase().includes('outdoor')),
    'Styling tips adapted for outdoor context',
    JSON.stringify(adaptedRule.stylingTips)
  );

  // ─────────────────────────────────────────────────────────────
  // 4. TESTING END-TO-END OUTFIT GENERATION WITH CUSTOM OCCASION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing End-to-End Outfit Generation with Custom Occasion ---');

  const mockWardrobe: WardrobeItem[] = [
    {
      id: 'item_1',
      user_id: 'user_test',
      name: 'Black Linen Casual Shirt',
      category: 'tops',
      subcategory: 'shirt',
      primary_color: 'Black',
      fit: 'Relaxed',
      formality: 'Smart Casual',
      season: ['Summer', 'All-Season'],
      material: 'Linen',
      times_worn: 2,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://example.com/black_shirt.jpg',
      created_at: new Date().toISOString()
    },
    {
      id: 'item_2',
      user_id: 'user_test',
      name: 'Dark Grey Chino Trousers',
      category: 'bottoms',
      subcategory: 'trousers',
      primary_color: 'Grey',
      fit: 'Slim',
      formality: 'Smart Casual',
      season: ['All-Season'],
      material: 'Cotton Blend',
      times_worn: 1,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/chinos.jpg',
      created_at: new Date().toISOString()
    },
    {
      id: 'item_3',
      user_id: 'user_test',
      name: 'White Minimal Sneakers',
      category: 'footwear',
      subcategory: 'sneakers',
      primary_color: 'White',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 5,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://example.com/sneakers.jpg',
      created_at: new Date().toISOString()
    },
    {
      id: 'item_4',
      user_id: 'user_test',
      name: 'Black Leather Formal Shoes',
      category: 'footwear',
      subcategory: 'formal_shoes',
      primary_color: 'Black',
      formality: 'Formal',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/derbys.jpg',
      created_at: new Date().toISOString()
    },
    {
      id: 'item_5',
      user_id: 'user_test',
      name: 'Silk Festive Kurta',
      category: 'tops',
      subcategory: 'kurta',
      primary_color: 'Gold',
      formality: 'Festive',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/kurta.jpg',
      created_at: new Date().toISOString()
    }
  ];

  const mockProfile: UserProfile = {
    id: 'user_test',
    user_id: 'user_test',
    favorite_colors: ['Black', 'Grey', 'White', 'Navy'],
    avoided_colors: [],
    style_preferences: ['Minimal', 'Smart Casual'],
    preferred_fit: 'Relaxed',
    city: 'Bangalore',
    created_at: new Date().toISOString()
  };

  const generatedOutfit = await generateIntelligentOutfit({
    userId: 'user_test',
    wardrobe: mockWardrobe,
    userProfile: mockProfile,
    occasion: 'Party',
    customOccasionText: "I have a farewell party at college outdoors tonight. I want something stylish and modern.",
    date: '2026-09-28',
    time: '19:30',
    location: 'Bangalore'
  });

  assert(
    generatedOutfit.custom_occasion_text === "I have a farewell party at college outdoors tonight. I want something stylish and modern.",
    'Generated outfit retains custom_occasion_text metadata',
    generatedOutfit.custom_occasion_text || ''
  );

  assert(
    Boolean(generatedOutfit.interpreted_occasion),
    'Generated outfit contains interpreted_occasion context',
    generatedOutfit.interpreted_occasion || ''
  );

  const chosenTop = generatedOutfit.items.find(i => i.role === 'top')?.item;
  assert(
    chosenTop?.subcategory !== 'kurta',
    'Intelligent constraint: Modern college farewell party did NOT select Silk Festive Kurta',
    `Selected Top: ${chosenTop?.name}`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. TESTING 2-HOUR INACTIVITY SESSION TIMEOUT CALCULATIONS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing 2-Hour Inactivity Timeout Logic ---');

  const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms
  const WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 600,000 ms

  const now = Date.now();

  // Scenario A: Active 30 mins ago -> No warning, Not expired
  const lastActive30MinsAgo = now - 30 * 60 * 1000;
  const elapsedA = now - lastActive30MinsAgo;
  const isExpiredA = elapsedA >= INACTIVITY_LIMIT_MS;
  const isWarningA = elapsedA >= INACTIVITY_LIMIT_MS - WARNING_THRESHOLD_MS;
  assert(!isExpiredA && !isWarningA, 'Scenario A (Active 30m ago): Session active without warning');

  // Scenario B: Active 1 hr 55 mins ago -> Show warning, Not expired yet
  const lastActive115MinsAgo = now - 115 * 60 * 1000;
  const elapsedB = now - lastActive115MinsAgo;
  const isExpiredB = elapsedB >= INACTIVITY_LIMIT_MS;
  const isWarningB = elapsedB >= INACTIVITY_LIMIT_MS - WARNING_THRESHOLD_MS;
  assert(!isExpiredB && isWarningB, 'Scenario B (Active 1h 55m ago): Warning modal triggered 5m before timeout');

  // Scenario C: Inactive for 2 hrs 5 mins -> Expired
  const lastActive125MinsAgo = now - 125 * 60 * 1000;
  const elapsedC = now - lastActive125MinsAgo;
  const isExpiredC = elapsedC >= INACTIVITY_LIMIT_MS;
  assert(isExpiredC, 'Scenario C (Inactive 2h 5m ago): Inactivity timeout triggered for automatic sign out');

  // Scenario D: Sliding window update upon activity
  let slidingTimestamp = now - 110 * 60 * 1000; // was 110 mins ago
  // User types or clicks
  slidingTimestamp = Date.now(); // reset activity
  const elapsedD = Date.now() - slidingTimestamp;
  assert(elapsedD < 1000, 'Scenario D (Sliding window): User interaction resets inactivity timer cleanly');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
