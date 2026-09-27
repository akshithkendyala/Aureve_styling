const { generateIntelligentOutfit, isItemPermittedForOccasion, evaluateMissingItem } = require('../src/lib/ai/outfitEngine');
const { getOccasionRule } = require('../src/lib/ai/occasionRules');

async function runTests() {
  console.log('====================================================');
  console.log('AUREVÉ MASTER OUTFIT INTELLIGENCE VERIFICATION SUITE');
  console.log('====================================================\n');

  const sampleWardrobe = [
    {
      id: 'top_kurta',
      name: 'Sage Green Embroidered Kurta',
      category: 'tops',
      subcategory: 'Kurta',
      primary_color: 'Sage Green',
      material: 'Silk',
      formality: 'Festive',
      is_archived: false,
    },
    {
      id: 'top_party_shirt',
      name: 'Midnight Black Textured Party Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'Black',
      material: 'Satin Cotton',
      formality: 'Smart Casual',
      is_archived: false,
    },
    {
      id: 'top_formal_shirt',
      name: 'Crisp White Oxford Dress Shirt',
      category: 'tops',
      subcategory: 'Shirt',
      primary_color: 'White',
      material: 'Cotton',
      formality: 'Formal',
      is_archived: false,
    },
    {
      id: 'top_graphic_tee',
      name: 'Oversized Streetwear Graphic Tee',
      category: 'tops',
      subcategory: 'T-Shirt',
      primary_color: 'Grey',
      material: 'Cotton',
      formality: 'Casual',
      is_archived: false,
    },
    {
      id: 'top_gym_tee',
      name: 'Breathable Dry-Fit Athletic Tee',
      category: 'tops',
      subcategory: 'T-Shirt',
      primary_color: 'Navy Blue',
      material: 'Polyester',
      formality: 'Casual',
      is_archived: false,
    },
    // Bottoms
    {
      id: 'bot_jeans',
      name: 'Washed Charcoal Relaxed Jeans',
      category: 'bottoms',
      subcategory: 'Jeans',
      primary_color: 'Charcoal Grey',
      fit: 'Relaxed',
      formality: 'Casual',
      is_archived: false,
    },
    {
      id: 'bot_chinos',
      name: 'Beige Slim-Fit Chinos',
      category: 'bottoms',
      subcategory: 'Chinos',
      primary_color: 'Beige / Cream',
      fit: 'Slim',
      formality: 'Smart Casual',
      is_archived: false,
    },
    {
      id: 'bot_trousers',
      name: 'Dark Navy Tailored Formal Trousers',
      category: 'bottoms',
      subcategory: 'Trousers',
      primary_color: 'Navy Blue',
      fit: 'Tailored',
      formality: 'Formal',
      is_archived: false,
    },
    {
      id: 'bot_trackpants',
      name: 'Black Athletic Track Pants',
      category: 'bottoms',
      subcategory: 'Track Pants',
      primary_color: 'Black',
      fit: 'Regular',
      formality: 'Casual',
      is_archived: false,
    },
    // Footwear
    {
      id: 'foot_sandals',
      name: 'Brown Leather Strappy Sandals',
      category: 'footwear',
      subcategory: 'Sandals',
      primary_color: 'Brown',
      formality: 'Casual',
      is_archived: false,
    },
    {
      id: 'foot_sneakers',
      name: 'Clean Minimalist White Sneakers',
      category: 'footwear',
      subcategory: 'Sneakers',
      primary_color: 'White',
      formality: 'Smart Casual',
      is_archived: false,
    },
    {
      id: 'foot_oxfords',
      name: 'Classic Black Leather Oxford Shoes',
      category: 'footwear',
      subcategory: 'Formal Shoes',
      primary_color: 'Black',
      formality: 'Formal',
      is_archived: false,
    },
    {
      id: 'foot_runners',
      name: 'Responsive Running Shoes',
      category: 'footwear',
      subcategory: 'Running Shoes',
      primary_color: 'Black',
      formality: 'Casual',
      is_archived: false,
    },
    // Accessories
    {
      id: 'acc_watch',
      name: 'Black Minimalist Watch',
      category: 'accessories',
      subcategory: 'Watch',
      primary_color: 'Black',
      is_archived: false,
    },
    {
      id: 'acc_belt',
      name: 'Dark Brown Leather Dress Belt',
      category: 'accessories',
      subcategory: 'Belt',
      primary_color: 'Brown',
      is_archived: false,
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

  const partyTop = partyOutfit.items.find(i => i.role === 'top').item;
  const partyBottom = partyOutfit.items.find(i => i.role === 'bottom').item;
  const partyFoot = partyOutfit.items.find(i => i.role === 'footwear')?.item;

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

  const intTop = interviewOutfit.items.find(i => i.role === 'top').item;
  const intBottom = interviewOutfit.items.find(i => i.role === 'bottom').item;
  const intFoot = interviewOutfit.items.find(i => i.role === 'footwear')?.item;

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

  const wedTop = weddingOutfit.items.find(i => i.role === 'top').item;
  const wedFoot = weddingOutfit.items.find(i => i.role === 'footwear')?.item;

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

  const gymTop = gymOutfit.items.find(i => i.role === 'top').item;
  const gymBottom = gymOutfit.items.find(i => i.role === 'bottom').item;
  const gymFoot = gymOutfit.items.find(i => i.role === 'footwear')?.item;

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
  // Sub-case A: Wardrobe with only basic tee and jeans (no party shirt)
  const partyWardrobeWithoutPartyShirt = [
    { id: '1', name: 'Basic White Crew Tee', category: 'tops', subcategory: 'T-Shirt', primary_color: 'White', is_archived: false },
    { id: '2', name: 'Dark Blue Straight Jeans', category: 'bottoms', subcategory: 'Jeans', primary_color: 'Blue', is_archived: false },
    { id: '3', name: 'White Leather Sneakers', category: 'footwear', subcategory: 'Sneakers', primary_color: 'White', is_archived: false },
  ];
  const missingParty = evaluateMissingItem(partyWardrobeWithoutPartyShirt, 'party', partyWardrobeWithoutPartyShirt[0], partyWardrobeWithoutPartyShirt[1]);
  console.log('Missing party item suggestion:', missingParty);
  if (!missingParty || !missingParty.suggested_item.includes('Party Shirt')) {
    console.error('FAIL: Missing party shirt was not suggested!');
    allPassed = false;
  } else {
    console.log('PASS: Missing party shirt was correctly identified.\n');
  }

  // Sub-case B: Wardrobe ALREADY has a party shirt -> MUST return null
  const missingPartyWhenAlreadyOwns = evaluateMissingItem(sampleWardrobe, 'party', sampleWardrobe[1], sampleWardrobe[5]);
  console.log('Missing party item when already owned:', missingPartyWhenAlreadyOwns);
  if (missingPartyWhenAlreadyOwns !== null) {
    console.error('FAIL: Should NOT suggest buying party shirt when user already owns one!');
    allPassed = false;
  } else {
    console.log('PASS: No redundant shopping suggestion when user already owns an item.\n');
  }

  if (allPassed) {
    console.log('====================================================');
    console.log('ALL 5 ACCEPTANCE TEST SUITES PASSED FLAWLESSLY!');
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
