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

// Sample comprehensive user wardrobe containing mixed formal, casual, athletic, and festive items
const MIXED_USER_WARDROBE = [
  // TOPS
  {
    id: 'top-1',
    user_id: 'user-123',
    name: 'White Slim Formal Oxford Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    primary_color: 'White',
    material: 'Cotton',
    formality: 'Formal',
    is_favorite: true,
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    created_at: '2026-01-01',
  },
  {
    id: 'top-2',
    user_id: 'user-123',
    name: 'Sky Blue Classic Button-Down Shirt',
    category: 'tops',
    subcategory: 'Shirt',
    primary_color: 'Sky Blue',
    material: 'Cotton',
    formality: 'Formal',
    is_favorite: false,
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    created_at: '2026-09-26', // Newly added!
  },
  {
    id: 'top-3',
    user_id: 'user-123',
    name: 'White Graphic Sweatshirt',
    category: 'tops',
    subcategory: 'Sweatshirt',
    primary_color: 'White',
    pattern: 'Graphic',
    material: 'Terry / French Terry',
    formality: 'Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 2,
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2',
    created_at: '2026-09-26', // Newly added!
  },
  {
    id: 'top-4',
    user_id: 'user-123',
    name: 'Black Half-Sleeve Casual T-Shirt',
    category: 'tops',
    subcategory: 'T-Shirt',
    primary_color: 'Black',
    material: 'Cotton',
    formality: 'Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 4,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
    created_at: '2026-02-01',
  },
  {
    id: 'top-5',
    user_id: 'user-123',
    name: 'Festive Maroon Chikankari Kurta',
    category: 'tops',
    subcategory: 'Kurta',
    primary_color: 'Burgundy / Maroon',
    material: 'Cotton',
    formality: 'Festive',
    is_favorite: false,
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
    created_at: '2026-03-01',
  },

  // BOTTOMS
  {
    id: 'bot-1',
    user_id: 'user-123',
    name: 'Charcoal Grey Tailored Formal Trousers',
    category: 'bottoms',
    subcategory: 'Trousers',
    primary_color: 'Charcoal Grey',
    material: 'Wool / Cashmere',
    formality: 'Formal',
    is_favorite: true,
    is_archived: false,
    times_worn: 2,
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
    created_at: '2026-01-01',
  },
  {
    id: 'bot-2',
    user_id: 'user-123',
    name: 'Navy Blue Straight-Fit Chinos',
    category: 'bottoms',
    subcategory: 'Chinos',
    primary_color: 'Navy Blue',
    material: 'Cotton Twill',
    formality: 'Smart Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 0,
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
    created_at: '2026-04-01',
  },
  {
    id: 'bot-3',
    user_id: 'user-123',
    name: 'Light Grey Relaxed Track Pants',
    category: 'bottoms',
    subcategory: 'Track Pants',
    primary_color: 'Light Grey',
    material: 'Fleece',
    formality: 'Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 5,
    image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea',
    created_at: '2026-09-26', // Newly added!
  },
  {
    id: 'bot-4',
    user_id: 'user-123',
    name: 'Dark Indigo Slim Jeans',
    category: 'bottoms',
    subcategory: 'Jeans',
    primary_color: 'Navy Blue',
    material: 'Denim',
    formality: 'Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 6,
    image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592',
    created_at: '2026-02-01',
  },

  // FOOTWEAR
  {
    id: 'foot-1',
    user_id: 'user-123',
    name: 'Classic Black Leather Oxford Shoes',
    category: 'footwear',
    subcategory: 'Formal Shoes',
    primary_color: 'Black',
    material: 'Leather',
    formality: 'Formal',
    is_favorite: true,
    is_archived: false,
    times_worn: 1,
    image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
    created_at: '2026-01-01',
  },
  {
    id: 'foot-2',
    user_id: 'user-123',
    name: 'Dark Brown Leather Penny Loafers',
    category: 'footwear',
    subcategory: 'Loafers',
    primary_color: 'Brown / Tan',
    material: 'Leather',
    formality: 'Smart Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 2,
    image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
    created_at: '2026-03-01',
  },
  {
    id: 'foot-3',
    user_id: 'user-123',
    name: 'Beige Suede Casual Sneakers',
    category: 'footwear',
    subcategory: 'Sneakers',
    primary_color: 'Beige / Cream',
    material: 'Suede',
    formality: 'Casual',
    is_favorite: false,
    is_archived: false,
    times_worn: 8,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    created_at: '2026-09-26', // Newly added!
  },

  // ACCESSORIES
  {
    id: 'acc-1',
    user_id: 'user-123',
    name: 'Black Leather Dress Belt',
    category: 'accessories',
    subcategory: 'Belt',
    primary_color: 'Black',
    material: 'Leather',
    formality: 'Formal',
    is_favorite: true,
    is_archived: false,
    times_worn: 3,
    image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc',
    created_at: '2026-01-01',
  },
  {
    id: 'acc-2',
    user_id: 'user-123',
    name: 'Silver Stainless Steel Minimalist Watch',
    category: 'accessories',
    subcategory: 'Watch',
    primary_color: 'Light Grey',
    material: 'Other',
    formality: 'Formal',
    is_favorite: true,
    is_archived: false,
    times_worn: 10,
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
    created_at: '2026-01-01',
  },
];

async function runTests() {
  console.log('================================================================');
  console.log(' AUREVÉ OUTFIT GENERATION INTELLIGENCE TEST SUITE');
  console.log('================================================================\n');

  // Load compiled JS logic or evaluate directly
  const { OCCASION_RULES, getOccasionRule, normalizeSubcategory } = require('../src/lib/ai/occasionRules.ts');
}

// In node, let's run the full suite using ts-node or transpiled script
