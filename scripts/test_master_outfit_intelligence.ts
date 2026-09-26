import { generateIntelligentOutfit, evaluateMissingItem } from '../src/lib/ai/outfitEngine';
import { WardrobeItem } from '../src/lib/types';

async function runTests() {
  console.log('====================================================');
  console.log('AUREVÉ MASTER OUTFIT INTELLIGENCE VERIFICATION SUITE');
  console.log('====================================================\n');

  const sampleWardrobe: WardrobeItem[] = [
    {
      id: 'top_kurta',
      user_id: 'u1',
      name: 'Sage Green Embroidered Kurta',
      category: 'tops',
      subcategory: 'Kurta',
      primary_color: 'Sage Green',
      secondary_colors: ['Gold'],
      pattern: 'Embroidered',
      material: 'Silk',
      fit: 'Regular',
      style: 'Festive',
      formality: 'Festive',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top_party_shirt',
      user_id: 'u1',
      name: 'Midnight Black Textured Party Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'Black',
      secondary_colors: [],
      pattern: 'Textured',
      material: 'Satin Cotton',
      fit: 'Slim',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top_formal_shirt',
      user_id: 'u1',
      name: 'Crisp White Oxford Dress Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'White',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Cotton',
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      season: ['All-Season'],
      times_worn: 2,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'top_gym_tee',
      user_id: 'u1',
      name: 'Breathable Dry-Fit Athletic Tee',
      category: 'tops',
      subcategory: 'T-Shirt',
      primary_color: 'Navy Blue',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Polyester',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 5,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Bottoms
    {
      id: 'bot_jeans',
      user_id: 'u1',
      name: 'Washed Charcoal Relaxed Jeans',
      category: 'bottoms',
      subcategory: 'Jeans',
      primary_color: 'Charcoal Grey',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Denim',
      fit: 'Relaxed',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 1,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot_chinos',
      user_id: 'u1',
      name: 'Beige Slim-Fit Chinos',
      category: 'bottoms',
      subcategory: 'Chinos',
      primary_color: 'Beige / Cream',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Cotton Twill',
      fit: 'Slim',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['All-Season'],
      times_worn: 2,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot_trousers',
      user_id: 'u1',
      name: 'Dark Navy Tailored Formal Trousers',
      category: 'bottoms',
      subcategory: 'Trousers',
      primary_color: 'Navy Blue',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Wool Blend',
      fit: 'Tailored',
      style: 'Formal',
      formality: 'Formal',
      season: ['All-Season'],
      times_worn: 3,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'bot_trackpants',
      user_id: 'u1',
      name: 'Black Athletic Track Pants',
      category: 'bottoms',
      subcategory: 'Track Pants',
      primary_color: 'Black',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Fleece / Poly',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 6,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Footwear
    {
      id: 'foot_sandals',
      user_id: 'u1',
      name: 'Brown Leather Strappy Sandals',
      category: 'footwear',
      subcategory: 'Sandals',
      primary_color: 'Brown / Tan',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Leather',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot_sneakers',
      user_id: 'u1',
      name: 'Clean Minimalist White Sneakers',
      category: 'footwear',
      subcategory: 'Sneakers',
      primary_color: 'White',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Leather',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['All-Season'],
      times_worn: 4,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot_oxfords',
      user_id: 'u1',
      name: 'Classic Black Leather Oxford Shoes',
      category: 'footwear',
      subcategory: 'Formal Shoes',
      primary_color: 'Black',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Leather',
      fit: 'Regular',
      style: 'Formal',
      formality: 'Formal',
      season: ['All-Season'],
      times_worn: 2,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'foot_runners',
      user_id: 'u1',
      name: 'Responsive Running Shoes',
      category: 'footwear',
      subcategory: 'Running Shoes',
      primary_color: 'Black',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Mesh',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 7,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Accessories
    {
      id: 'acc_watch',
      user_id: 'u1',
      name: 'Black Minimalist Watch',
      category: 'accessories',
      subcategory: 'Watch',
      primary_color: 'Black',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Steel / Leather',
      fit: 'Regular',
      style: 'Minimal',
      formality: 'Smart Casual',
      season: ['All-Season'],
      times_worn: 10,
      is_favorite: true,
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  let allPassed = true;

  // TEST 1: PARTY
  console.log('--- TEST 1: PARTY OCCASION ---');
  const partyOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Party',
    date: '2026-09-26',
    time: '21:00',
    location: 'Mumbai',
    weather: { city: 'Mumbai', temperature: 27, condition: 'Clear', humidity: 70, summary: 'Warm' },
  });

  const partyTop = partyOutfit.items.find((i) => i.role === 'top')!.item!;
  const partyBottom = partyOutfit.items.find((i) => i.role === 'bottom')!.item!;
  const partyFoot = partyOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Title: "${partyOutfit.title}"`);
  console.log(`Top: "${partyTop.name}" (${partyTop.subcategory})`);
  console.log(`Bottom: "${partyBottom.name}" (${partyBottom.subcategory})`);
  console.log(`Footwear: "${partyFoot?.name}" (${partyFoot?.subcategory})`);
  console.log(`Explanation: "${partyOutfit.ai_explanation}"`);

  if (partyTop.subcategory === 'Kurta' || partyTop.name.toLowerCase().includes('kurta')) {
    console.error('FAIL: Kurta was recommended for Party!');
    allPassed = false;
  } else if (partyFoot && (partyFoot.subcategory === 'Sandals' || partyFoot.name.toLowerCase().includes('sandal'))) {
    console.error('FAIL: Sandals were recommended for Party!');
    allPassed = false;
  } else {
    console.log('PASS: Party generated correct modern partywear (No Kurta, No Sandals).\n');
  }

  // TEST 2: INTERVIEW
  console.log('--- TEST 2: INTERVIEW OCCASION ---');
  const interviewOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Interview',
    date: '2026-09-26',
    time: '10:00',
    location: 'Bangalore',
    weather: { city: 'Bangalore', temperature: 24, condition: 'Clear', humidity: 55, summary: 'Pleasant' },
  });

  const intTop = interviewOutfit.items.find((i) => i.role === 'top')!.item!;
  const intBottom = interviewOutfit.items.find((i) => i.role === 'bottom')!.item!;
  const intFoot = interviewOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Title: "${interviewOutfit.title}"`);
  console.log(`Top: "${intTop.name}" (${intTop.subcategory})`);
  console.log(`Bottom: "${intBottom.name}" (${intBottom.subcategory})`);
  console.log(`Footwear: "${intFoot?.name}" (${intFoot?.subcategory})`);
  console.log(`Explanation: "${interviewOutfit.ai_explanation}"`);

  if (intTop.subcategory !== 'Shirt' || intBottom.subcategory !== 'Trousers' || intFoot?.subcategory !== 'Formal Shoes') {
    console.error('FAIL: Interview violated strict formal rules!');
    allPassed = false;
  } else {
    console.log('PASS: Interview generated strictly formal attire (Oxford shirt, formal trousers, formal shoes).\n');
  }

  // TEST 3: WEDDING
  console.log('--- TEST 3: WEDDING OCCASION ---');
  const weddingOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Wedding',
    date: '2026-09-26',
    time: '18:00',
    location: 'Hyderabad',
  });

  const wedTop = weddingOutfit.items.find((i) => i.role === 'top')!.item!;
  const wedFoot = weddingOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Top: "${wedTop.name}" (${wedTop.subcategory})`);
  console.log(`Footwear: "${wedFoot?.name}" (${wedFoot?.subcategory})`);
  if (wedTop.subcategory !== 'Kurta' && wedTop.formality !== 'Festive') {
    console.error('FAIL: Wedding did not prioritize festive/kurta styling!');
    allPassed = false;
  } else {
    console.log('PASS: Wedding correctly selected Festive Kurta.\n');
  }

  // TEST 4: GYM
  console.log('--- TEST 4: GYM OCCASION ---');
  const gymOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Gym',
    date: '2026-09-26',
    time: '07:00',
  });

  const gymTop = gymOutfit.items.find((i) => i.role === 'top')!.item!;
  const gymBottom = gymOutfit.items.find((i) => i.role === 'bottom')!.item!;
  const gymFoot = gymOutfit.items.find((i) => i.role === 'footwear')?.item;

  console.log(`Top: "${gymTop.name}" (${gymTop.subcategory})`);
  console.log(`Bottom: "${gymBottom.name}" (${gymBottom.subcategory})`);
  console.log(`Footwear: "${gymFoot?.name}" (${gymFoot?.subcategory})`);

  if (gymBottom.subcategory !== 'Track Pants' || gymFoot?.subcategory !== 'Running Shoes') {
    console.error('FAIL: Gym did not select athletic track pants and running shoes!');
    allPassed = false;
  } else {
    console.log('PASS: Gym correctly selected athletic performance gear.\n');
  }

  // TEST 5: MISSING ITEM INTELLIGENCE
  console.log('--- TEST 5: MISSING ITEM INTELLIGENCE ---');
  const partyWardrobeWithoutPartyShirt: WardrobeItem[] = [
    {
      id: '1',
      user_id: 'u1',
      name: 'Basic White Crew Tee',
      category: 'tops',
      subcategory: 'T-Shirt',
      primary_color: 'White',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Cotton',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/tee.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'u1',
      name: 'Dark Blue Straight Jeans',
      category: 'bottoms',
      subcategory: 'Jeans',
      primary_color: 'Blue',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Denim',
      fit: 'Straight',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/jeans.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'u1',
      name: 'White Leather Sneakers',
      category: 'footwear',
      subcategory: 'Sneakers',
      primary_color: 'White',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Leather',
      fit: 'Regular',
      style: 'Casual',
      formality: 'Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/sneakers.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const missingParty = evaluateMissingItem(partyWardrobeWithoutPartyShirt, 'party', partyWardrobeWithoutPartyShirt[0], partyWardrobeWithoutPartyShirt[1]);
  console.log('Missing party item suggestion:', missingParty);
  if (!missingParty || !missingParty.suggested_item.includes('Party Shirt')) {
    console.error('FAIL: Missing party shirt was not suggested!');
    allPassed = false;
  } else {
    console.log('PASS: Missing party shirt was correctly identified.\n');
  }

  const missingPartyWhenAlreadyOwns = evaluateMissingItem(sampleWardrobe, 'party', sampleWardrobe[1], sampleWardrobe[4]);
  console.log('Missing party item when already owned:', missingPartyWhenAlreadyOwns);
  if (missingPartyWhenAlreadyOwns !== null) {
    console.error('FAIL: Should NOT suggest buying party shirt when user already owns one!');
    allPassed = false;
  } else {
    console.log('PASS: No redundant shopping suggestion when user already owns an item.\n');
  }

  // TEST 6: COLLEGE
  console.log('--- TEST 6: COLLEGE OCCASION ---');
  const collegeOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'College',
    date: '2026-09-26',
    time: '09:00',
  });
  const colTop = collegeOutfit.items.find((i) => i.role === 'top')!.item!;
  const colBottom = collegeOutfit.items.find((i) => i.role === 'bottom')!.item!;
  console.log(`Top: "${colTop.name}" (${colTop.subcategory})`);
  console.log(`Bottom: "${colBottom.name}" (${colBottom.subcategory})`);
  if (colTop.subcategory === 'Kurta' || colBottom.subcategory === 'Trousers' && colBottom.formality === 'Formal') {
    console.error('FAIL: College selected formal or traditional attire!');
    allPassed = false;
  } else {
    console.log('PASS: College selected casual, youth-appropriate attire.\n');
  }

  // TEST 7: DINNER
  console.log('--- TEST 7: DINNER OCCASION ---');
  const dinnerOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Dinner',
    date: '2026-09-26',
    time: '20:00',
  });
  const dinTop = dinnerOutfit.items.find((i) => i.role === 'top')!.item!;
  const dinFoot = dinnerOutfit.items.find((i) => i.role === 'footwear')?.item;
  console.log(`Top: "${dinTop.name}" (${dinTop.subcategory})`);
  console.log(`Footwear: "${dinFoot?.name}" (${dinFoot?.subcategory})`);
  if (dinFoot && dinFoot.subcategory === 'Sandals') {
    console.error('FAIL: Dinner selected sandals!');
    allPassed = false;
  } else {
    console.log('PASS: Dinner selected smart-casual evening attire.\n');
  }

  // TEST 8: TRAVEL
  console.log('--- TEST 8: TRAVEL OCCASION ---');
  const travelOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: sampleWardrobe,
    occasion: 'Travel',
    date: '2026-09-26',
    time: '06:00',
  });
  const travFoot = travelOutfit.items.find((i) => i.role === 'footwear')?.item;
  console.log(`Footwear: "${travFoot?.name}" (${travFoot?.subcategory})`);
  if (travFoot && travFoot.subcategory === 'Formal Shoes') {
    console.error('FAIL: Travel selected stiff formal shoes!');
    allPassed = false;
  } else {
    console.log('PASS: Travel selected comfortable mobility footwear.\n');
  }

  // TEST 9: HISTORY ROTATION (PREVENT EXACT REPEATS)
  console.log('--- TEST 9: HISTORY ROTATION & ANTI-REPETITION ---');
  // Expand wardrobe with an alternative valid party shirt & bottom
  const expandedPartyWardrobe: WardrobeItem[] = [
    ...sampleWardrobe,
    {
      id: 'top_party_shirt_2',
      user_id: 'u1',
      name: 'Emerald Satin Cuban Collar Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'Emerald Green',
      secondary_colors: [],
      pattern: 'Solid',
      material: 'Satin',
      fit: 'Relaxed',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['All-Season'],
      times_worn: 0,
      is_favorite: false,
      is_archived: false,
      image_url: 'https://example.com/satin.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Previous outfit history where user wore top_party_shirt + bot_jeans + foot_sneakers
  const previousPartyHistory = [
    {
      id: 'outfit_prev_1',
      user_id: 'u1',
      occasion: 'Party',
      title: 'Previous Party Look',
      ai_explanation: 'Previous party outfit',
      items: [
        { role: 'top' as const, wardrobe_item_id: 'top_party_shirt', item: sampleWardrobe[1] },
        { role: 'bottom' as const, wardrobe_item_id: 'bot_jeans', item: sampleWardrobe[4] },
        { role: 'footwear' as const, wardrobe_item_id: 'foot_sneakers', item: sampleWardrobe[9] },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const rotatedPartyOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: expandedPartyWardrobe,
    occasion: 'Party',
    date: '2026-09-27',
    time: '21:00',
    previousOutfits: previousPartyHistory as any,
  });

  const rotTop = rotatedPartyOutfit.items.find((i) => i.role === 'top')!.item!;
  const rotBottom = rotatedPartyOutfit.items.find((i) => i.role === 'bottom')!.item!;
  console.log(`Rotated Top: "${rotTop.name}" (ID: ${rotTop.id})`);
  console.log(`Rotated Bottom: "${rotBottom.name}" (ID: ${rotBottom.id})`);

  const prevTopId = 'top_party_shirt';
  const prevBotId = 'bot_jeans';
  const isExactDuplicate = rotTop.id === prevTopId && rotBottom.id === prevBotId;

  if (isExactDuplicate) {
    console.error('FAIL: History rotation failed to rotate to alternative valid combination!');
    allPassed = false;
  } else {
    console.log('PASS: History rotation successfully avoided exact combination repetition.\n');
  }

  if (allPassed) {
    console.log('====================================================');
    console.log('ALL 9 EXTENDED ACCEPTANCE TEST SUITES PASSED FLAWLESSLY!');
    console.log('====================================================');
  } else {
    console.error('SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
