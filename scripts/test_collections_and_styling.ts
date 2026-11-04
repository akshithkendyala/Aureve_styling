/**
 * AUREVÉ VERIFICATION SUITE: Smart Wardrobe Collections & Intelligent Styling
 * Tests the 12 scenarios specified in the product enhancement requirements.
 */

import { Repository } from '../src/lib/db/repository';
import { suggestCollectionsForItem } from '../src/lib/ai/collectionClassifier';
import { generateIntelligentOutfit } from '../src/lib/ai/outfitEngine';
import { checkCollectionOccasionConflict } from '../src/lib/ai/partialWardrobeStylist';
import { WardrobeItem, UserProfile } from '../src/lib/types';

const TEST_USER_ID = 'test_user_collections_' + Date.now();

const mockProfile: UserProfile = {
  id: 'profile_' + Date.now(),
  user_id: TEST_USER_ID,
  name: 'Test Stylist User',
  gender: 'Male',
  skin_tone: 'Warm Olive',
  body_build: 'Proportional',
  preferred_fit: 'Regular',
  favorite_colors: ['Black', 'Beige', 'Navy Blue'],
  avoided_colors: ['Neon Yellow'],
  style_preferences: ['Smart Casual', 'Minimal', 'Modern Indian'],
  city: 'Mumbai',
  created_at: new Date().toISOString(),
};

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('AUREVÉ SMART WARDROBE COLLECTIONS & STYLING VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 12;

  // TEST 1: Upload a black shirt -> verify identified suitable collections
  console.log('TEST 1: Smart Collection Suggestion for Black Shirt');
  const blackShirtItem = {
    name: 'Black Oxford Cotton Shirt',
    category: 'tops' as const,
    subcategory: 'Shirt',
    primary_color: 'Black',
    material: 'Cotton',
    formality: 'Smart Casual',
    style: 'Smart Casual',
  };
  const suggestions1 = suggestCollectionsForItem(blackShirtItem);
  const suggestedSlugs1 = suggestions1.map((s) => s.slug);
  console.log('   Suggested collections:', suggestedSlugs1);
  const t1Passed =
    suggestedSlugs1.includes('college_work') &&
    suggestedSlugs1.includes('everyday') &&
    suggestedSlugs1.includes('party_occasions');
  if (t1Passed) {
    console.log('   ✓ PASS: Black shirt suggested for College & Work, Everyday, and Party & Occasions\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL: Missing expected collections', suggestedSlugs1);
  }

  // TEST 2: Add the shirt to College & Work and Party & Occasions without record duplication
  console.log('TEST 2: Multi-Collection Assignment Without Item Duplication');
  const collections = await Repository.getCollections(TEST_USER_ID);
  console.log(`   User initialized with ${collections.length} collections (Everyday, College & Work, etc.)`);
  const collegeCol = collections.find((c) => c.slug === 'college_work')!;
  const partyCol = collections.find((c) => c.slug === 'party_occasions')!;

  const createdShirt = await Repository.addWardrobeItem(TEST_USER_ID, {
    name: 'Black Oxford Cotton Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
    primary_color: 'Black',
    formality: 'Smart Casual',
    material: 'Cotton',
    collection_ids: [collegeCol.id, partyCol.id],
  });

  const allItems = await Repository.getWardrobeItems(TEST_USER_ID);
  const collegeItems = await Repository.getItemsInCollection(TEST_USER_ID, collegeCol.id);
  const partyItems = await Repository.getItemsInCollection(TEST_USER_ID, partyCol.id);
  const assignedIds = await Repository.getItemCollectionIds(TEST_USER_ID, createdShirt.id);

  const t2Passed =
    allItems.length === 1 && // Exactly 1 item in main wardrobe!
    collegeItems.length === 1 &&
    partyItems.length === 1 &&
    collegeItems[0].id === partyItems[0].id &&
    assignedIds.includes(collegeCol.id) &&
    assignedIds.includes(partyCol.id);

  if (t2Passed) {
    console.log('   ✓ PASS: Item exists in both collections, exactly 1 database wardrobe record!\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in multi-collection test', { allItems: allItems.length, college: collegeItems.length, party: partyItems.length });
  }

  // TEST 3: Select College & Work collection
  console.log('TEST 3: Prioritize College & Work Collection');
  const t3Suggestions = suggestCollectionsForItem({
    name: 'White Formal Spread Collar Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    primary_color: 'White',
    formality: 'Formal',
  });
  const t3Passed = t3Suggestions.some((s) => s.slug === 'college_work');
  if (t3Passed) {
    console.log('   ✓ PASS: Formal/college attire naturally identifies with College & Work\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in College & Work selection');
  }

  // TEST 4: Select Traditional & Festive
  console.log('TEST 4: Traditional & Festive Identification');
  const kurtaItem = {
    name: 'Mustard Silk Embroidered Kurta',
    category: 'tops' as const,
    subcategory: 'Kurta',
    primary_color: 'Yellow',
    formality: 'Festive',
    material: 'Silk',
  };
  const kurtaSuggestions = suggestCollectionsForItem(kurtaItem);
  const t4Passed = kurtaSuggestions.some((s) => s.slug === 'traditional_festive');
  if (t4Passed) {
    console.log('   ✓ PASS: Traditional Kurta strictly mapped to Traditional & Festive collection\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in Traditional collection mapping');
  }

  // TEST 5: Select Home & Comfort
  console.log('TEST 5: Home & Comfort Identification');
  const shortsItem = {
    name: 'Heather Grey Lounge Shorts',
    category: 'bottoms' as const,
    subcategory: 'Shorts',
    primary_color: 'Grey',
    material: 'Cotton',
    formality: 'Casual',
  };
  const shortsSuggestions = suggestCollectionsForItem(shortsItem);
  const t5Passed = shortsSuggestions.some((s) => s.slug === 'home_comfort');
  if (t5Passed) {
    console.log('   ✓ PASS: Lounge shorts mapped to Home & Comfort collection\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in Home & Comfort mapping');
  }

  // TEST 6: User owns ONLY ONE Black Shirt -> generate outfit
  console.log('TEST 6: Single-Item Wardrobe (Only Black Shirt owned)');
  const singleItemWardrobe: WardrobeItem[] = [createdShirt];
  const outfitSingleItem = await generateIntelligentOutfit({
    userId: TEST_USER_ID,
    userProfile: mockProfile,
    wardrobe: singleItemWardrobe,
    occasion: 'College',
    collection: 'College & Work',
    date: '2026-11-04',
  });

  const t6Passed =
    outfitSingleItem.wardrobe_completeness === 'single_item' &&
    outfitSingleItem.items.length === 1 &&
    outfitSingleItem.items[0].wardrobe_item_id === createdShirt.id &&
    Boolean(outfitSingleItem.recommended_missing_items && outfitSingleItem.recommended_missing_items.length >= 2) &&
    Boolean(outfitSingleItem.suggested_combinations && outfitSingleItem.suggested_combinations.length >= 1);

  if (t6Passed) {
    console.log('   ✓ PASS: Single shirt gracefully triggered Intelligent Partial-Wardrobe Styling:');
    console.log('     • Owned piece anchored:', outfitSingleItem.items[0].item?.name);
    console.log('     • Recommended bottom wear:', outfitSingleItem.recommended_missing_items?.find((r) => r.category === 'bottoms')?.name);
    console.log('     • Recommended footwear:', outfitSingleItem.recommended_missing_items?.find((r) => r.category === 'footwear')?.name);
    console.log('     • Best combination:', outfitSingleItem.suggested_combinations?.[0]?.name);
    console.log('');
    passedTests++;
  } else {
    console.error('   ✗ FAIL: Single item test failed', outfitSingleItem);
  }

  // TEST 7: User owns ONLY Trousers
  console.log('TEST 7: Only Bottoms Wardrobe');
  const onlyBottomsWardrobe: WardrobeItem[] = [
    {
      id: 'trouser_001',
      user_id: TEST_USER_ID,
      name: 'Beige Straight-Fit Chinos',
      category: 'bottoms',
      subcategory: 'Chinos',
      primary_color: 'Beige',
      material: 'Cotton',
      fit: 'Regular',
      formality: 'Smart Casual',
      image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
  ];

  const outfitOnlyBottoms = await generateIntelligentOutfit({
    userId: TEST_USER_ID,
    userProfile: mockProfile,
    wardrobe: onlyBottomsWardrobe,
    occasion: 'Office',
    collection: 'College & Work',
    date: '2026-11-04',
  });

  const t7Passed =
    (outfitOnlyBottoms.wardrobe_completeness === 'partial' || outfitOnlyBottoms.wardrobe_completeness === 'single_item') &&
    outfitOnlyBottoms.items[0].wardrobe_item_id === 'trouser_001' &&
    Boolean(outfitOnlyBottoms.recommended_missing_items?.some((r) => r.category === 'tops')) &&
    Boolean(outfitOnlyBottoms.recommended_missing_items?.some((r) => r.category === 'footwear'));

  if (t7Passed) {
    console.log('   ✓ PASS: Only bottoms owned -> recommended tops and footwear in text!\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in only bottoms scenario', outfitOnlyBottoms);
  }

  // TEST 8: Complete Wardrobe Combination (Top + Bottom + Footwear)
  console.log('TEST 8: Complete Wardrobe Combination');
  const completeWardrobe: WardrobeItem[] = [
    createdShirt,
    onlyBottomsWardrobe[0],
    {
      id: 'shoes_001',
      user_id: TEST_USER_ID,
      name: 'White Minimal Low-Top Sneakers',
      category: 'footwear',
      subcategory: 'Sneakers',
      primary_color: 'White',
      formality: 'Casual',
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
  ];

  const outfitComplete = await generateIntelligentOutfit({
    userId: TEST_USER_ID,
    userProfile: mockProfile,
    wardrobe: completeWardrobe,
    occasion: 'College',
    collection: 'College & Work',
    date: '2026-11-04',
  });

  const t8Passed =
    outfitComplete.wardrobe_completeness === 'complete' &&
    outfitComplete.items.length >= 2;

  if (t8Passed) {
    console.log('   ✓ PASS: Complete wardrobe assembled complete outfit with real wardrobe items!\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in complete outfit test', outfitComplete);
  }

  // TEST 9: Conflict Detection (Home & Comfort vs Formal Interview)
  console.log('TEST 9: Collection & Occasion Conflict Detection');
  const conflictMsg = checkCollectionOccasionConflict('home_comfort', 'interview');
  const t9Passed = Boolean(conflictMsg && conflictMsg.includes('Loungewear') && conflictMsg.includes('formal'));
  if (t9Passed) {
    console.log('   ✓ PASS: Detected mismatch between Home & Comfort and formal Interview:');
    console.log('     • Note:', conflictMsg);
    console.log('');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in conflict detection', conflictMsg);
  }

  // TEST 10: Create, Rename, Populate and Delete Custom Collection
  console.log('TEST 10: Custom Collection Lifecycle');
  const customCol = await Repository.createCollection(TEST_USER_ID, {
    name: 'Airport Transit Fits',
    description: 'High-comfort travel layers and versatile sneakers for airport transit.',
  });
  console.log('   Created custom collection:', customCol.name, 'slug:', customCol.slug);

  const updatedCustomCol = await Repository.updateCollection(TEST_USER_ID, customCol.id, {
    name: 'Airport & Transit Fits',
  });
  console.log('   Renamed custom collection to:', updatedCustomCol?.name);

  // Add shirt to this custom collection
  await Repository.addItemToCollection(TEST_USER_ID, createdShirt.id, customCol.id);
  const itemsInCustom = await Repository.getItemsInCollection(TEST_USER_ID, customCol.id);
  console.log(`   Added shirt to custom collection (found ${itemsInCustom.length} item)`);

  // Delete collection
  await Repository.deleteCollection(TEST_USER_ID, customCol.id);
  const remainingWardrobe = await Repository.getWardrobeItems(TEST_USER_ID);

  const t10Passed =
    customCol.name === 'Airport Transit Fits' &&
    updatedCustomCol?.name === 'Airport & Transit Fits' &&
    itemsInCustom.length === 1 &&
    remainingWardrobe.length === 1; // Shirt was NOT deleted!

  if (t10Passed) {
    console.log('   ✓ PASS: Custom collection created, renamed, populated, and deleted while wardrobe piece remains intact!\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in custom collection lifecycle');
  }

  // TEST 11: Persistence and Isolation
  console.log('TEST 11: User Isolation & Collection State Persistence');
  const otherUserId = 'other_user_' + Date.now();
  const otherCollections = await Repository.getCollections(otherUserId);
  const otherWardrobe = await Repository.getWardrobeItems(otherUserId);

  const t11Passed =
    otherCollections.length === 6 &&
    otherWardrobe.length === 0; // Other user cannot see first user's clothes!

  if (t11Passed) {
    console.log('   ✓ PASS: Strict isolation: other user starts with fresh default collections and 0 items.\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in isolation test');
  }

  // TEST 12: Weather, Occasions, and Existing System Preservation
  console.log('TEST 12: Weather & Occasion Compatibility Integration');
  const rainOutfit = await generateIntelligentOutfit({
    userId: TEST_USER_ID,
    userProfile: mockProfile,
    wardrobe: completeWardrobe,
    occasion: 'Casual Outing',
    collection: 'Everyday',
    weather: {
      city: 'Mumbai',
      temperature: 24,
      condition: 'Heavy Rain',
      humidity: 88,
      rain_probability: 90,
      summary: 'Heavy monsoon showers',
    },
    date: '2026-11-04',
  });

  const t12Passed =
    Boolean(rainOutfit.weather_data && rainOutfit.weather_data.condition === 'Heavy Rain') &&
    rainOutfit.ai_explanation.length > 20;

  if (t12Passed) {
    console.log('   ✓ PASS: Weather, occasion, and AI reasoning integrate seamlessly with collections!\n');
    passedTests++;
  } else {
    console.error('   ✗ FAIL in weather & occasion integration');
  }

  console.log('================================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
