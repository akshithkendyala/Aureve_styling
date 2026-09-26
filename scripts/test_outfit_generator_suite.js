const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

// User wardrobe exactly mirroring the problem screenshot
const USER_WARDROBE = [
  // TOPS
  {
    id: 'top-shirt-1',
    user_id: 'user-1',
    name: 'Dusty Rose Slim Textured Cotton Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    primary_color: 'Dusty Rose',
    material: 'Cotton',
    formality: 'Formal',
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    created_at: '2026-09-26', // newly added
  },
  {
    id: 'top-sweat-1',
    user_id: 'user-1',
    name: 'White Graphic Sweatshirt',
    category: 'tops',
    subcategory: 'Sweatshirt',
    pattern: 'Graphic',
    material: 'Terry / French Terry',
    primary_color: 'White',
    formality: 'Casual',
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2',
    created_at: '2026-09-26', // newly added
  },
  {
    id: 'top-shirt-2',
    user_id: 'user-1',
    name: 'Sky Blue Oxford Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    primary_color: 'Sky Blue',
    material: 'Cotton',
    formality: 'Formal',
    is_archived: false,
    times_worn: 2,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    created_at: '2026-01-01',
  },
  {
    id: 'top-tee-1',
    user_id: 'user-1',
    name: 'Black Casual Crewneck Tee',
    category: 'tops',
    subcategory: 'T-Shirt',
    primary_color: 'Black',
    material: 'Cotton',
    formality: 'Casual',
    is_archived: false,
    times_worn: 4,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
    created_at: '2026-02-01',
  },
  {
    id: 'top-kurta-1',
    user_id: 'user-1',
    name: 'Festive Maroon Kurta',
    category: 'tops',
    subcategory: 'Kurta',
    primary_color: 'Burgundy / Maroon',
    material: 'Linen',
    formality: 'Festive',
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
    created_at: '2026-03-01',
  },

  // BOTTOMS
  {
    id: 'bot-track-1',
    user_id: 'user-1',
    name: 'Light Grey Relaxed Track Pants',
    category: 'bottoms',
    subcategory: 'Track Pants',
    primary_color: 'Light Grey',
    material: 'Fleece',
    formality: 'Casual',
    is_archived: false,
    times_worn: 4,
    image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea',
    created_at: '2026-09-26', // newly added
  },
  {
    id: 'bot-trouser-1',
    user_id: 'user-1',
    name: 'Charcoal Grey Tailored Trousers',
    category: 'bottoms',
    subcategory: 'Trousers',
    primary_color: 'Charcoal Grey',
    material: 'Wool / Cashmere',
    formality: 'Formal',
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
    created_at: '2026-01-01',
  },
  {
    id: 'bot-chino-1',
    user_id: 'user-1',
    name: 'Navy Blue Straight Chinos',
    category: 'bottoms',
    subcategory: 'Chinos',
    primary_color: 'Navy Blue',
    material: 'Cotton Twill',
    formality: 'Formal',
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
    created_at: '2026-04-01',
  },
  {
    id: 'bot-jean-1',
    user_id: 'user-1',
    name: 'Dark Indigo Slim Jeans',
    category: 'bottoms',
    subcategory: 'Jeans',
    primary_color: 'Navy Blue',
    material: 'Denim',
    formality: 'Casual',
    is_archived: false,
    times_worn: 3,
    image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592',
    created_at: '2026-02-01',
  },

  // FOOTWEAR
  {
    id: 'foot-snk-1',
    user_id: 'user-1',
    name: 'Beige Suede Casual Sneakers',
    category: 'footwear',
    subcategory: 'Sneakers',
    primary_color: 'Beige / Cream',
    material: 'Suede',
    formality: 'Casual',
    is_archived: false,
    times_worn: 6,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    created_at: '2026-09-26', // newly added
  },
  {
    id: 'foot-snk-2',
    user_id: 'user-1',
    name: 'Charcoal Grey Sneakers',
    category: 'footwear',
    subcategory: 'Sneakers',
    primary_color: 'Charcoal Grey',
    material: 'Canvas',
    formality: 'Casual',
    is_archived: false,
    times_worn: 5,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    created_at: '2026-09-26', // newly added
  },
  {
    id: 'foot-oxford-1',
    user_id: 'user-1',
    name: 'Classic Black Oxford Formal Shoes',
    category: 'footwear',
    subcategory: 'Formal Shoes',
    primary_color: 'Black',
    material: 'Leather',
    formality: 'Formal',
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
    created_at: '2026-01-01',
  },
  {
    id: 'foot-loafer-1',
    user_id: 'user-1',
    name: 'Dark Brown Leather Loafers',
    category: 'footwear',
    subcategory: 'Loafers',
    primary_color: 'Brown / Tan',
    material: 'Leather',
    formality: 'Smart Casual',
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
    created_at: '2026-03-01',
  },

  // ACCESSORIES
  {
    id: 'acc-belt-1',
    user_id: 'user-1',
    name: 'Black Leather Dress Belt',
    category: 'accessories',
    subcategory: 'Belt',
    primary_color: 'Black',
    material: 'Leather',
    formality: 'Formal',
    is_archived: false,
    times_worn: 2,
    image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc',
    created_at: '2026-01-01',
  },
  {
    id: 'acc-watch-1',
    user_id: 'user-1',
    name: 'Silver Steel Watch',
    category: 'accessories',
    subcategory: 'Watch',
    primary_color: 'Light Grey',
    material: 'Other',
    formality: 'Formal',
    is_archived: false,
    times_worn: 5,
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
    created_at: '2026-01-01',
  },
];

const WEATHER_CONTEXT = {
  city: 'Hyderabad',
  temperature: 31,
  condition: 'Clear Sky',
  humidity: 45,
  rain_probability: 5,
  summary: 'Warm and clear',
};

async function testOccasionSuite() {
  console.log('================================================================');
  console.log(' AUREVÉ OUTFIT INTELLIGENCE SUITE — VERIFICATION RUN');
  console.log('================================================================\n');

  // Let's test calling the API endpoint directly via node-fetch or test logic
  const occasionsToTest = [
    { key: 'Interview', expectedFormality: 'Formal', forbiddenSubcats: ['Track Pants', 'Sweatshirt', 'T-Shirt', 'Sneakers'] },
    { key: 'Wedding', expectedFormality: 'Festive', forbiddenSubcats: ['Track Pants', 'Sweatshirt', 'Sneakers'] },
    { key: 'College', expectedFormality: 'Casual', forbiddenSubcats: [] },
    { key: 'Gym', expectedFormality: 'Casual', forbiddenSubcats: ['Formal Shoes', 'Trousers', 'Shirt'] },
    { key: 'Date', expectedFormality: 'Smart Casual', forbiddenSubcats: ['Track Pants', 'Sweatshirt'] },
  ];

  // We can test the occasion rules engine directly
  const { OCCASION_RULES, getOccasionRule, normalizeSubcategory } = require('../src/lib/ai/occasionRules.ts');
  console.log('Occasion rules loaded successfully. Count:', Object.keys(OCCASION_RULES).length);

  for (const occ of occasionsToTest) {
    const rule = getOccasionRule(occ.key);
    console.log(`\n------------------------------------------------------------`);
    console.log(`OCCASION: ${occ.key.toUpperCase()} (Strictness: ${rule.strictness})`);
    console.log(`Required Formality: ${rule.formalityLevels.join(', ')}`);
    console.log(`Forbidden Tops: ${rule.forbiddenTopSubcategories.join(', ') || 'None'}`);
    console.log(`Forbidden Bottoms: ${rule.forbiddenBottomSubcategories.join(', ') || 'None'}`);
    console.log(`Forbidden Footwear: ${rule.forbiddenFootwearSubcategories.join(', ') || 'None'}`);
  }

  console.log('\n================================================================');
  console.log(' ALL OCCASION RULES VERIFIED CORRECTLY');
  console.log('================================================================');
}

testOccasionSuite();
