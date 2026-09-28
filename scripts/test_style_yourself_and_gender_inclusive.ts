import { evaluateSelfStyledLook, evaluateOccasionFit, evaluateColorHarmony, evaluateStyleCohesion, generateWardrobeAlternatives } from '../src/lib/ai/outfitEvaluator';
import { WardrobeItem, LearnedStyleProfile, PreferenceSignal } from '../src/lib/types';
import { Repository } from '../src/lib/db/repository';
import { buildLearnedStyleProfile } from '../src/lib/ai/personalStyleEngine';

async function runTests() {
  console.log('====================================================');
  console.log('AUREVÉ — "STYLE IT YOURSELF" & GENDER-INCLUSIVE SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper signal generator
  const createSignal = (type: any, val: string, score: number): PreferenceSignal => ({
    attributeType: type,
    attributeValue: val,
    score,
    confidence: 0.8,
    evidenceCount: 5,
    positiveCount: 4,
    negativeCount: 1,
    recencyWeightedScore: score * 0.9,
    signalStrength: 'strong',
    lastObservedAt: new Date().toISOString(),
  });

  // MOCK WARDROBE CONTAINING WOMEN'S, MEN'S, TRADITIONAL & MODERN INDIAN GARMENTS
  const mockWardrobe: WardrobeItem[] = [
    // Tops
    {
      id: 'top-1',
      user_id: 'test-user',
      name: 'Black Oversized Graphic T-Shirt',
      category: 'tops',
      subcategory: 't-shirt',
      primary_color: 'Black',
      fit: 'Oversized',
      style: 'Streetwear',
      formality: 'Casual',
      pattern: 'Graphic',
      material: 'Cotton',
      season: ['All-season'],
      times_worn: 2,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top-2',
      user_id: 'test-user',
      name: 'White Silk Formal Blouse',
      category: 'tops',
      subcategory: 'blouse',
      primary_color: 'White',
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Silk',
      season: ['All-season'],
      times_worn: 1,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top-3',
      user_id: 'test-user',
      name: 'Maroon Chanderi Embroidered Kurti',
      category: 'tops',
      subcategory: 'kurti',
      primary_color: 'Burgundy',
      fit: 'Regular',
      style: 'Traditional',
      formality: 'Festive',
      pattern: 'Embroidered',
      material: 'Silk',
      season: ['All-season'],
      times_worn: 0,
      is_favorite: false,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top-4',
      user_id: 'test-user',
      name: 'Black Ribbed Crop Top',
      category: 'tops',
      subcategory: 'crop top',
      primary_color: 'Black',
      fit: 'Slim',
      style: 'Streetwear',
      formality: 'Casual',
      pattern: 'Solid',
      material: 'Cotton',
      season: ['Summer'],
      times_worn: 3,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top-5',
      user_id: 'test-user',
      name: 'Crisp Light Blue Oxford Shirt',
      category: 'tops',
      subcategory: 'shirt',
      primary_color: 'Sky Blue',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Cotton',
      season: ['All-season'],
      times_worn: 4,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Bottoms
    {
      id: 'bot-1',
      user_id: 'test-user',
      name: 'Charcoal High-Waisted Wide Leg Trousers',
      category: 'bottoms',
      subcategory: 'wide-leg pants',
      primary_color: 'Charcoal Grey',
      fit: 'Relaxed',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Wool Blend',
      season: ['All-season'],
      times_worn: 2,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot-2',
      user_id: 'test-user',
      name: 'Golden Zari Chanderi Palazzo Pants',
      category: 'bottoms',
      subcategory: 'palazzo',
      primary_color: 'Beige',
      fit: 'Relaxed',
      style: 'Traditional',
      formality: 'Festive',
      pattern: 'Solid',
      material: 'Silk',
      season: ['All-season'],
      times_worn: 0,
      is_favorite: false,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot-3',
      user_id: 'test-user',
      name: 'Vintage Light Blue Baggy Jeans',
      category: 'bottoms',
      subcategory: 'jeans',
      primary_color: 'Light Blue',
      fit: 'Oversized',
      style: 'Streetwear',
      formality: 'Casual',
      pattern: 'Solid',
      material: 'Denim',
      season: ['All-season'],
      times_worn: 5,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot-4',
      user_id: 'test-user',
      name: 'Neon Gym Running Shorts',
      category: 'bottoms',
      subcategory: 'shorts',
      primary_color: 'Neon Green',
      fit: 'Slim',
      style: 'Sporty',
      formality: 'Casual',
      pattern: 'Solid',
      material: 'Polyester',
      season: ['Summer'],
      times_worn: 1,
      is_favorite: false,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Layers
    {
      id: 'lay-1',
      user_id: 'test-user',
      name: 'Italian Tailored Navy Blazer',
      category: 'layers',
      subcategory: 'blazer',
      primary_color: 'Navy Blue',
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Wool',
      season: ['All-season'],
      times_worn: 3,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Footwear
    {
      id: 'foot-1',
      user_id: 'test-user',
      name: 'Clean Minimalist White Sneakers',
      category: 'footwear',
      subcategory: 'sneakers',
      primary_color: 'White',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      pattern: 'Solid',
      material: 'Leather',
      season: ['All-season'],
      times_worn: 8,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot-2',
      user_id: 'test-user',
      name: 'Pointed Black Leather Loafers',
      category: 'footwear',
      subcategory: 'loafers',
      primary_color: 'Black',
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Leather',
      season: ['All-season'],
      times_worn: 2,
      is_favorite: false,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot-3',
      user_id: 'test-user',
      name: 'Handcrafted Golden Embroidered Juttis',
      category: 'footwear',
      subcategory: 'juttis',
      primary_color: 'Gold',
      fit: 'Regular',
      style: 'Traditional',
      formality: 'Festive',
      pattern: 'Embroidered',
      material: 'Leather',
      season: ['All-season'],
      times_worn: 1,
      is_favorite: false,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot-4',
      user_id: 'test-user',
      name: 'Strappy Black Block Heels',
      category: 'footwear',
      subcategory: 'heels',
      primary_color: 'Black',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Semi-Formal',
      pattern: 'Solid',
      material: 'Leather',
      season: ['All-season'],
      times_worn: 2,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },

    // Accessories
    {
      id: 'acc-1',
      user_id: 'test-user',
      name: 'Gold Jhumka Earrings',
      category: 'accessories',
      subcategory: 'earrings',
      primary_color: 'Gold',
      fit: 'Regular',
      style: 'Traditional',
      formality: 'Festive',
      pattern: 'Solid',
      material: 'Brass',
      season: ['All-season'],
      times_worn: 1,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'acc-2',
      user_id: 'test-user',
      name: 'Classic Chronograph Silver Watch',
      category: 'accessories',
      subcategory: 'watch',
      primary_color: 'Silver',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Formal',
      pattern: 'Solid',
      material: 'Stainless Steel',
      season: ['All-season'],
      times_worn: 6,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'acc-3',
      user_id: 'test-user',
      name: 'Minimal Black Leather Crossbody Bag',
      category: 'accessories',
      subcategory: 'handbag',
      primary_color: 'Black',
      fit: 'Regular',
      style: 'Streetwear',
      formality: 'Casual',
      pattern: 'Solid',
      material: 'Leather',
      season: ['All-season'],
      times_worn: 3,
      is_favorite: true,
      image_url: '/placeholder.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockStyleProfile: LearnedStyleProfile = {
    userId: 'test-user',
    totalFeedbacks: 5,
    averageRating: 4.6,
    itemStats: {},
    colorPreferences: {
      'black': createSignal('color', 'Black', 0.8),
      'white': createSignal('color', 'White', 0.7),
      'charcoal grey': createSignal('color', 'Charcoal Grey', 0.6),
    },
    fitPreferences: {
      'oversized': createSignal('fit', 'Oversized', 0.7),
      'relaxed': createSignal('fit', 'Relaxed', 0.8),
    },
    stylePreferences: {
      'streetwear': createSignal('style', 'Streetwear', 0.8),
      'smart casual': createSignal('style', 'Smart Casual', 0.7),
    },
    footwearPreferences: {
      'sneakers': createSignal('footwear', 'Sneakers', 0.8),
    },
    patternPreferences: {},
    formalityPreferences: {
      'casual': createSignal('formality', 'Casual', 0.7),
      'formal': createSignal('formality', 'Formal', 0.6),
    },
    occasionPreferences: {},
    combinationScores: {},
    stylistObservations: ['You consistently rate relaxed and streetwear fits highly.'],
  };

  // TEST 1: Women's Workwear Look Evaluation
  console.log('TEST 1: Evaluating Women\'s Workwear Look (Blouse + Wide-Leg Pants + Blazer + Loafers + Watch)...');
  const workwearItems = [
    mockWardrobe.find(i => i.id === 'top-2')!,
    mockWardrobe.find(i => i.id === 'bot-1')!,
    mockWardrobe.find(i => i.id === 'lay-1')!,
    mockWardrobe.find(i => i.id === 'foot-2')!,
    mockWardrobe.find(i => i.id === 'acc-2')!,
  ];

  const workwearEval = await evaluateSelfStyledLook({
    selectedItems: workwearItems,
    wardrobe: mockWardrobe,
    occasion: 'Office',
    learnedProfile: mockStyleProfile,
  });

  console.log(`  -> Overall Score: ${workwearEval.overall_score}/10`);
  console.log(`  -> Color Harmony: ${workwearEval.breakdown.color_harmony}/10`);
  console.log(`  -> Occasion Fit: ${workwearEval.breakdown.occasion_fit}/10`);
  console.log(`  -> What Works: "${workwearEval.what_works}"`);

  assert(workwearEval.overall_score >= 8.0, 'Workwear look achieves score >= 8.0/10');
  assert(workwearEval.breakdown.occasion_fit >= 8.5, 'Occasion fit score is high for formal workwear');
  assert(workwearEval.breakdown.color_harmony >= 8.0, 'Color harmony is strong (White + Charcoal + Navy)');

  // TEST 2: Indian Ethnic Festive Look Evaluation (Kurti + Palazzo + Juttis + Gold Earrings)
  console.log('\nTEST 2: Evaluating Indian Ethnic Look (Kurti + Palazzo + Juttis + Jhumkas)...');
  const ethnicItems = [
    mockWardrobe.find(i => i.id === 'top-3')!,
    mockWardrobe.find(i => i.id === 'bot-2')!,
    mockWardrobe.find(i => i.id === 'foot-3')!,
    mockWardrobe.find(i => i.id === 'acc-1')!,
  ];

  const ethnicEval = await evaluateSelfStyledLook({
    selectedItems: ethnicItems,
    wardrobe: mockWardrobe,
    occasion: 'Festival',
    learnedProfile: mockStyleProfile,
  });

  console.log(`  -> Overall Score: ${ethnicEval.overall_score}/10`);
  console.log(`  -> Style Cohesion: ${ethnicEval.breakdown.style_cohesion}/10`);
  console.log(`  -> Footwear Score: ${ethnicEval.breakdown.footwear_compatibility}/10`);
  console.log(`  -> Accessories Score: ${ethnicEval.breakdown.accessory_balance}/10`);

  assert(ethnicEval.overall_score >= 8.5, 'Indian Festive look receives high rating >= 8.5/10');
  assert(ethnicEval.breakdown.style_cohesion >= 8.5, 'Traditional style cohesion recognized correctly');
  assert(ethnicEval.breakdown.footwear_compatibility >= 9.0, 'Juttis recognized as ideal traditional footwear');

  // TEST 3: Modern Gen-Z / Streetwear Party Look (Crop Top + Baggy Jeans + Chunky Sneakers + Crossbody Bag)
  console.log('\nTEST 3: Evaluating Gen-Z Party Look (Crop Top + Baggy Jeans + Sneakers + Crossbody Bag)...');
  const partyItems = [
    mockWardrobe.find(i => i.id === 'top-4')!,
    mockWardrobe.find(i => i.id === 'bot-3')!,
    mockWardrobe.find(i => i.id === 'foot-1')!,
    mockWardrobe.find(i => i.id === 'acc-3')!,
  ];

  const partyEval = await evaluateSelfStyledLook({
    selectedItems: partyItems,
    wardrobe: mockWardrobe,
    occasion: 'Party',
    learnedProfile: mockStyleProfile,
  });

  console.log(`  -> Overall Score: ${partyEval.overall_score}/10`);
  console.log(`  -> Style Cohesion: ${partyEval.breakdown.style_cohesion}/10`);
  console.log(`  -> What Works: "${partyEval.what_works}"`);

  assert(partyEval.overall_score >= 7.5, 'Gen-Z streetwear party look scores well >= 7.5/10');
  assert(partyEval.breakdown.style_cohesion >= 8.0, 'Streetwear items maintain strong cohesion');

  // TEST 4: Occasion Mismatch Hard Constraint (Gym Shorts to Interview)
  console.log('\nTEST 4: Evaluating Severe Occasion Mismatch (Gym Shorts + Sneakers for Interview)...');
  const mismatchItems = [
    mockWardrobe.find(i => i.id === 'top-1')!, // Graphic tee
    mockWardrobe.find(i => i.id === 'bot-4')!, // Gym shorts
    mockWardrobe.find(i => i.id === 'foot-1')!, // Sneakers
  ];

  const mismatchEval = await evaluateSelfStyledLook({
    selectedItems: mismatchItems,
    wardrobe: mockWardrobe,
    occasion: 'Interview',
    learnedProfile: mockStyleProfile,
  });

  console.log(`  -> Overall Score: ${mismatchEval.overall_score}/10`);
  console.log(`  -> Occasion Fit Score: ${mismatchEval.breakdown.occasion_fit}/10`);
  console.log(`  -> How to Improve: "${mismatchEval.how_to_improve}"`);

  assert(mismatchEval.breakdown.occasion_fit <= 5.0, 'Gym shorts heavily penalized for Interview (Occasion Fit <= 5.0)');
  assert(mismatchEval.overall_score <= 6.5, 'Overall score appropriately low for occasion mismatch');
  assert(mismatchEval.how_to_improve.length > 0, 'Actionable improvement instructions provided');

  // TEST 5: Wardrobe-First Alternatives Verification
  console.log('\nTEST 5: Checking Wardrobe-First Alternative Recommendations...');
  const alternatives = generateWardrobeAlternatives(
    mismatchItems,
    mockWardrobe,
    'Interview'
  );

  console.log(`  -> Generated ${alternatives.length} alternatives from user's wardrobe:`);
  alternatives.forEach(alt => console.log(`     [${alt.type}] ${alt.title}: "${alt.description}"`));

  assert(alternatives.length > 0, 'Generated at least one wardrobe-first alternative');
  const bottomAlternative = alternatives.find(a => a.target_role === 'bottom');
  assert(Boolean(bottomAlternative), 'Suggested swapping out the gym shorts for a better trouser in wardrobe');
  assert(Boolean(bottomAlternative), 'Suggested swapping out the gym shorts for a better trouser in wardrobe');

  // TEST 6: Feedback & Learning Loop on Self-Styled Outfits
  console.log('\nTEST 6: Testing Feedback & Personal Style Engine on Self-Styled Outfits...');
  const initialProfile = await Repository.getLearnedStyleProfile('test-user');
  const initialCount = initialProfile.totalFeedbacks;

  const testOutfitData = {
    occasion: 'Office' as const,
    title: 'Self-Styled Silk Blouse & Wide Leg Trousers',
    ai_explanation: workwearEval.what_works,
    style_match: 90,
    style_direction: ['Smart Formal'],
    is_self_styled: true,
    self_styled_analysis: workwearEval,
    date: '2026-09-28',
    time: '10:00',
    location: 'Mumbai',
    items: [
      { wardrobe_item_id: 'top-2', role: 'top' as const, item: mockWardrobe.find(i => i.id === 'top-2')! },
      { wardrobe_item_id: 'bot-1', role: 'bottom' as const, item: mockWardrobe.find(i => i.id === 'bot-1')! },
      { wardrobe_item_id: 'foot-2', role: 'footwear' as const, item: mockWardrobe.find(i => i.id === 'foot-2')! },
    ],
  };

  const saved = await Repository.saveOutfit('test-user', testOutfitData);
  assert(Boolean(saved && saved.is_self_styled), 'Self-styled outfit persisted in DB with is_self_styled flag');
  assert(Boolean(saved && saved.self_styled_analysis?.overall_score), 'Self-styled analysis persisted in DB');

  const userOutfits = await Repository.getUserOutfits('test-user');
  assert(userOutfits.some(o => o.id === saved.id), 'Retrieved self-styled outfit from user outfits collection');

  // Submit positive rating on the self-styled outfit
  await Repository.recordFeedback('test-user', {
    outfit_id: saved.id,
    rating: 5,
    feedback_tags: ['perfect_fit', 'great_color', 'comfortable'],
    comment: 'Loved this self-curated look, wide-leg trousers feel fantastic.',
  });

  const updatedProfile = await Repository.getLearnedStyleProfile('test-user');
  assert(updatedProfile.totalFeedbacks === initialCount + 1, 'Feedback count incremented in learned style profile');
  console.log(`  -> Updated profile total feedbacks: ${updatedProfile.totalFeedbacks}`);

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
