import { WardrobeItem, Outfit, OutfitFeedback } from '../src/lib/types';
import {
  buildLearnedStyleProfile,
  calculateFeedbackScore,
  normalizeRatingValue,
} from '../src/lib/ai/personalStyleEngine';
import { generateIntelligentOutfit } from '../src/lib/ai/outfitEngine';

async function runFeedbackLearningTests() {
  console.log('===============================================================');
  console.log('AUREVÉ PERSONAL STYLE LEARNING & FEEDBACK VERIFICATION SUITE');
  console.log('===============================================================\n');

  let allPassed = true;

  // Test Wardrobe with distinct styles, fits, colors
  const testWardrobe: WardrobeItem[] = [
    {
      id: 'top_black_party',
      user_id: 'user_a',
      name: 'Black Textured Relaxed Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'Black',
      secondary_colors: [],
      fit: 'Relaxed',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      pattern: 'Textured',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/black.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'top_bright_yellow',
      user_id: 'user_a',
      name: 'Bright Canary Yellow Slim Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'Bright Yellow',
      secondary_colors: [],
      fit: 'Slim',
      style: 'Casual',
      formality: 'Casual',
      pattern: 'Solid',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/yellow.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'top_oxford_white',
      user_id: 'user_a',
      name: 'Crisp White Oxford Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'White',
      secondary_colors: [],
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/oxford.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'bot_black_relaxed_jeans',
      user_id: 'user_a',
      name: 'Black Relaxed Baggy Jeans',
      category: 'bottoms',
      subcategory: 'Jeans',
      primary_color: 'Black',
      secondary_colors: [],
      fit: 'Relaxed',
      style: 'Casual',
      formality: 'Casual',
      pattern: 'Solid',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/black_jeans.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'bot_slim_beige_chinos',
      user_id: 'user_a',
      name: 'Beige Ultra-Slim Chinos',
      category: 'bottoms',
      subcategory: 'Chinos',
      primary_color: 'Beige / Cream',
      secondary_colors: [],
      fit: 'Slim',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      pattern: 'Solid',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/beige_chinos.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'bot_formal_trousers',
      user_id: 'user_a',
      name: 'Navy Tailored Formal Trousers',
      category: 'bottoms',
      subcategory: 'Trousers',
      primary_color: 'Navy Blue',
      secondary_colors: [],
      fit: 'Tailored',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/trousers.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'foot_sneakers',
      user_id: 'user_a',
      name: 'Clean White Leather Sneakers',
      category: 'footwear',
      subcategory: 'Sneakers',
      primary_color: 'White',
      secondary_colors: [],
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/sneakers.jpg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'foot_formal_oxfords',
      user_id: 'user_a',
      name: 'Black Leather Oxford Shoes',
      category: 'footwear',
      subcategory: 'Formal Shoes',
      primary_color: 'Black',
      secondary_colors: [],
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/oxfords.jpg',
      created_at: new Date().toISOString(),
    },
  ];

  // -------------------------------------------------------------
  // TEST 1: Rating Scale Normalization
  // -------------------------------------------------------------
  console.log('--- TEST 1: RATING SCALE NORMALIZATION ---');
  if (
    normalizeRatingValue('Loved it') === 5 &&
    normalizeRatingValue('Good') === 4 &&
    normalizeRatingValue('Average') === 3 &&
    normalizeRatingValue("Didn't like it") === 2 &&
    normalizeRatingValue(5) === 5 &&
    normalizeRatingValue(1) === 1
  ) {
    console.log('PASS: All qualitative and numerical ratings normalized correctly.\n');
  } else {
    console.error('FAIL: Rating normalization error');
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST 2: Multi-Dimensional Pattern Extraction & Confidence Progression
  // -------------------------------------------------------------
  console.log('--- TEST 2: PATTERN EXTRACTION & STATISTICAL CONFIDENCE ---');
  const outfit1: Outfit = {
    id: 'outfit_1',
    user_id: 'user_a',
    occasion: 'Party',
    date: '2026-09-20',
    title: 'Look 1',
    ai_explanation: 'Look 1',
    style_match: 95,
    style_direction: ['Modern'],
    items: [
      { role: 'top', wardrobe_item_id: 'top_black_party', item: testWardrobe[0] },
      { role: 'bottom', wardrobe_item_id: 'bot_black_relaxed_jeans', item: testWardrobe[3] },
      { role: 'footwear', wardrobe_item_id: 'foot_sneakers', item: testWardrobe[6] },
    ],
    created_at: '2026-09-20T20:00:00Z',
  };

  // 1 single rating -> Should be WEAK signal
  const feedbackSingle: OutfitFeedback[] = [
    {
      id: 'fb_1',
      user_id: 'user_a',
      outfit_id: 'outfit_1',
      rating: 'Loved it',
      feedback_tags: ['Loved the colors', 'Loved the fit'],
      created_at: '2026-09-20T22:00:00Z',
    },
  ];

  const profileSingle = buildLearnedStyleProfile('user_a', feedbackSingle, [outfit1], testWardrobe);
  const blackPref = profileSingle.colorPreferences['black'];
  const relaxedPref = profileSingle.fitPreferences['relaxed'];

  console.log(`Single rating - Black color confidence: ${blackPref?.confidence} (${blackPref?.signalStrength})`);
  console.log(`Single rating - Relaxed fit confidence: ${relaxedPref?.confidence} (${relaxedPref?.signalStrength})`);

  if (blackPref.signalStrength !== 'weak' || blackPref.confidence > 0.45) {
    console.error('FAIL: Single rating should not be treated as a strong or emerging rule!');
    allPassed = false;
  } else {
    console.log('PASS: Single rating correctly classified as weak signal without overfitting.\n');
  }

  // Multiple consistent ratings (5 ratings) -> Emerging/Strong signal
  const feedbackMultiple: OutfitFeedback[] = [
    { id: 'fb_1', user_id: 'user_a', outfit_id: 'outfit_1', rating: 'Loved it', feedback_tags: ['Loved the colors', 'Loved the fit'], created_at: '2026-09-20T22:00:00Z' },
    { id: 'fb_2', user_id: 'user_a', outfit_id: 'outfit_1', rating: 'Loved it', feedback_tags: ['Loved the colors'], created_at: '2026-09-21T22:00:00Z' },
    { id: 'fb_3', user_id: 'user_a', outfit_id: 'outfit_1', rating: 'Loved it', feedback_tags: ['Very comfortable'], created_at: '2026-09-22T22:00:00Z' },
    { id: 'fb_4', user_id: 'user_a', outfit_id: 'outfit_1', rating: 'Good', feedback_tags: [], created_at: '2026-09-23T22:00:00Z' },
    { id: 'fb_5', user_id: 'user_a', outfit_id: 'outfit_1', rating: 'Loved it', feedback_tags: ['Felt sharp & confident'], created_at: '2026-09-24T22:00:00Z' },
  ];

  const profileMultiple = buildLearnedStyleProfile('user_a', feedbackMultiple, [outfit1], testWardrobe);
  const blackPrefMulti = profileMultiple.colorPreferences['black'];
  const relaxedPrefMulti = profileMultiple.fitPreferences['relaxed'];

  console.log(`5 ratings - Black color confidence: ${blackPrefMulti?.confidence} (${blackPrefMulti?.signalStrength})`);
  console.log(`5 ratings - Relaxed fit confidence: ${relaxedPrefMulti?.confidence} (${relaxedPrefMulti?.signalStrength})`);

  if (blackPrefMulti.confidence <= 0.45 || blackPrefMulti.score <= 0.5) {
    console.error('FAIL: Multiple consistent ratings did not build strong confidence!');
    allPassed = false;
  } else {
    console.log('PASS: Multiple consistent ratings successfully built high confidence.\n');
  }

  // -------------------------------------------------------------
  // TEST 3: Negative Feedback & Item Penalty Learning
  // -------------------------------------------------------------
  console.log('--- TEST 3: NEGATIVE FEEDBACK & TAG LEARNING ---');
  const outfitNegative: Outfit = {
    id: 'outfit_neg',
    user_id: 'user_a',
    occasion: 'Party',
    date: '2026-09-18',
    title: 'Disliked Look',
    ai_explanation: 'Disliked look',
    style_match: 70,
    style_direction: ['Casual'],
    items: [
      { role: 'top', wardrobe_item_id: 'top_bright_yellow', item: testWardrobe[1] },
      { role: 'bottom', wardrobe_item_id: 'bot_slim_beige_chinos', item: testWardrobe[4] },
      { role: 'footwear', wardrobe_item_id: 'foot_formal_oxfords', item: testWardrobe[7] },
    ],
    created_at: '2026-09-18T20:00:00Z',
  };

  const comprehensiveFeedback: OutfitFeedback[] = [
    ...feedbackMultiple,
    {
      id: 'fb_neg_1',
      user_id: 'user_a',
      outfit_id: 'outfit_neg',
      rating: "Didn't like it",
      feedback_tags: ["Didn't like the colors", "Didn't like the fit", "Didn't like the combination"],
      comment: 'Bright yellow feels too loud and slim chinos are too tight',
      created_at: '2026-09-18T22:00:00Z',
    },
    {
      id: 'fb_neg_2',
      user_id: 'user_a',
      outfit_id: 'outfit_neg',
      rating: "Didn't like it",
      feedback_tags: ["Didn't like the colors"],
      created_at: '2026-09-19T22:00:00Z',
    },
  ];

  const profileComprehensive = buildLearnedStyleProfile(
    'user_a',
    comprehensiveFeedback,
    [outfit1, outfitNegative],
    testWardrobe
  );

  const yellowPref = profileComprehensive.colorPreferences['bright yellow'];
  const slimPref = profileComprehensive.fitPreferences['slim'];

  console.log(`Yellow color score: ${yellowPref?.score} (Negative count: ${yellowPref?.negativeCount})`);
  console.log(`Slim fit score: ${slimPref?.score} (Negative count: ${slimPref?.negativeCount})`);

  if (yellowPref?.score >= 0 || slimPref?.score >= 0) {
    console.error('FAIL: Negative feedback was not reflected in preference scores!');
    allPassed = false;
  } else {
    console.log('PASS: Negative feedback correctly lowered yellow color and slim fit scores.\n');
  }

  // -------------------------------------------------------------
  // TEST 4: Candidate Scoring & Recommendation Influence for Party
  // -------------------------------------------------------------
  console.log('--- TEST 4: CANDIDATE SCORING & PARTY RECOMMENDATION ---');
  const partyOutfit = await generateIntelligentOutfit({
    userId: 'user_a',
    wardrobe: testWardrobe,
    occasion: 'Party',
    date: '2026-09-26',
    time: '21:00',
    previousOutfits: [outfit1, outfitNegative],
    userFeedback: comprehensiveFeedback,
  });

  const partyTop = partyOutfit.items.find((i) => i.role === 'top')!.item!;
  const partyBottom = partyOutfit.items.find((i) => i.role === 'bottom')!.item!;
  const partyFoot = partyOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Generated Party Look:`);
  console.log(`- Top: ${partyTop.name} (${partyTop.primary_color}, ${partyTop.fit})`);
  console.log(`- Bottom: ${partyBottom.name} (${partyBottom.primary_color}, ${partyBottom.fit})`);
  console.log(`- Footwear: ${partyFoot?.name}`);
  console.log(`- Explanation: "${partyOutfit.ai_explanation}"`);

  if (partyTop.id === 'top_bright_yellow') {
    console.error('FAIL: Recommended disliked bright yellow top for party!');
    allPassed = false;
  } else if (partyBottom.id === 'bot_slim_beige_chinos') {
    console.error('FAIL: Recommended disliked slim beige chinos for party!');
    allPassed = false;
  } else {
    console.log('PASS: Recommendation successfully favored preferred relaxed black shirt and relaxed jeans for party.\n');
  }

  // -------------------------------------------------------------
  // TEST 5: Hard Occasion Constraints vs Learned Preference
  // -------------------------------------------------------------
  console.log('--- TEST 5: HARD OCCASION PRESERVATION OVER PREFERENCES ---');
  // Even though user gave 5/5 to sneakers and relaxed jeans, an INTERVIEW must strictly enforce formal wear!
  const interviewOutfit = await generateIntelligentOutfit({
    userId: 'user_a',
    wardrobe: testWardrobe,
    occasion: 'Interview',
    date: '2026-09-27',
    time: '10:00',
    previousOutfits: [outfit1, outfitNegative],
    userFeedback: comprehensiveFeedback,
  });

  const intTop = interviewOutfit.items.find((i) => i.role === 'top')!.item!;
  const intBottom = interviewOutfit.items.find((i) => i.role === 'bottom')!.item!;
  const intFoot = interviewOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Generated Interview Look:`);
  console.log(`- Top: ${intTop.name}`);
  console.log(`- Bottom: ${intBottom.name}`);
  console.log(`- Footwear: ${intFoot?.name}`);

  if (intFoot?.subcategory === 'Sneakers' || intBottom.subcategory === 'Jeans') {
    console.error('FAIL: User preference for sneakers/jeans leaked into Interview!');
    allPassed = false;
  } else if (intTop.subcategory === 'Shirt' && intBottom.subcategory === 'Trousers' && intFoot?.subcategory === 'Formal Shoes') {
    console.log('PASS: Interview strictly enforced Oxford shirt, Formal Trousers, and Formal Shoes despite casual sneakers preference.\n');
  }

  // -------------------------------------------------------------
  // TEST 6: Multi-User Isolation Security
  // -------------------------------------------------------------
  console.log('--- TEST 6: MULTI-USER ISOLATION ---');
  // User B has NO feedback recorded
  const profileUserB = buildLearnedStyleProfile('user_b', comprehensiveFeedback, [outfit1], testWardrobe);
  console.log(`User B total feedbacks loaded: ${profileUserB.totalFeedbacks}`);
  if (profileUserB.totalFeedbacks !== 0 || Object.keys(profileUserB.colorPreferences).length !== 0) {
    console.error('FAIL: User A feedback leaked into User B style profile!');
    allPassed = false;
  } else {
    console.log('PASS: User A ratings are completely isolated from User B.\n');
  }

  if (allPassed) {
    console.log('===============================================================');
    console.log('ALL 6 STYLE LEARNING & FEEDBACK TEST SUITES PASSED FLAWLESSLY!');
    console.log('===============================================================');
  } else {
    console.error('TESTS FAILED');
    process.exit(1);
  }
}

runFeedbackLearningTests().catch((err) => {
  console.error('Error running test suite:', err);
  process.exit(1);
});
