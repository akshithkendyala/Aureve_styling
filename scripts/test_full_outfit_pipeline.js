const fs = require('fs');
const path = require('path');

// Read .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
let apiKey = '';
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k.trim() === 'GEMINI_API_KEY') apiKey = v.join('=').trim();
});
process.env.GEMINI_API_KEY = apiKey;

const { OCCASION_RULES, getOccasionRule, normalizeSubcategory } = require('../src/lib/ai/occasionRules.ts');
// Let's create an executable script to test the complete logic

const SAMPLE_WARDROBE = [
  { id: 'top-shirt-1', name: 'Dusty Rose Slim Textured Cotton Shirt', category: 'tops', subcategory: 'Shirt', primary_color: 'Dusty Rose', material: 'Cotton', formality: 'Formal', is_archived: false, times_worn: 0 },
  { id: 'top-sweat-1', name: 'White Graphic Sweatshirt', category: 'tops', subcategory: 'Sweatshirt', pattern: 'Graphic', material: 'Terry / French Terry', primary_color: 'White', formality: 'Casual', is_archived: false, times_worn: 0 },
  { id: 'top-shirt-2', name: 'Sky Blue Oxford Shirt', category: 'tops', subcategory: 'Shirt', primary_color: 'Sky Blue', material: 'Cotton', formality: 'Formal', is_archived: false, times_worn: 2 },
  { id: 'top-tee-1', name: 'Black Casual Crewneck Tee', category: 'tops', subcategory: 'T-Shirt', primary_color: 'Black', material: 'Cotton', formality: 'Casual', is_archived: false, times_worn: 4 },
  { id: 'top-kurta-1', name: 'Festive Maroon Kurta', category: 'tops', subcategory: 'Kurta', primary_color: 'Burgundy / Maroon', material: 'Linen', formality: 'Festive', is_archived: false, times_worn: 1 },

  { id: 'bot-track-1', name: 'Light Grey Relaxed Track Pants', category: 'bottoms', subcategory: 'Track Pants', primary_color: 'Light Grey', material: 'Fleece', formality: 'Casual', is_archived: false, times_worn: 4 },
  { id: 'bot-trouser-1', name: 'Charcoal Grey Tailored Trousers', category: 'bottoms', subcategory: 'Trousers', primary_color: 'Charcoal Grey', material: 'Wool / Cashmere', formality: 'Formal', is_archived: false, times_worn: 1 },
  { id: 'bot-chino-1', name: 'Navy Blue Straight Chinos', category: 'bottoms', subcategory: 'Chinos', primary_color: 'Navy Blue', material: 'Cotton Twill', formality: 'Formal', is_archived: false, times_worn: 0 },
  { id: 'bot-jean-1', name: 'Dark Indigo Slim Jeans', category: 'bottoms', subcategory: 'Jeans', primary_color: 'Navy Blue', material: 'Denim', formality: 'Casual', is_archived: false, times_worn: 3 },

  { id: 'foot-snk-1', name: 'Beige Suede Casual Sneakers', category: 'footwear', subcategory: 'Sneakers', primary_color: 'Beige / Cream', material: 'Suede', formality: 'Casual', is_archived: false, times_worn: 6 },
  { id: 'foot-snk-2', name: 'Charcoal Grey Sneakers', category: 'footwear', subcategory: 'Sneakers', primary_color: 'Charcoal Grey', material: 'Canvas', formality: 'Casual', is_archived: false, times_worn: 5 },
  { id: 'foot-oxford-1', name: 'Classic Black Oxford Formal Shoes', category: 'footwear', subcategory: 'Formal Shoes', primary_color: 'Black', material: 'Leather', formality: 'Formal', is_archived: false, times_worn: 1 },
  { id: 'foot-loafer-1', name: 'Dark Brown Leather Loafers', category: 'footwear', subcategory: 'Loafers', primary_color: 'Brown / Tan', material: 'Leather', formality: 'Smart Casual', is_archived: false, times_worn: 0 },
  { id: 'foot-kolha-1', name: 'Handcrafted Tan Kolhapuri Sandals', category: 'footwear', subcategory: 'Kolhapuris', primary_color: 'Brown / Tan', material: 'Leather', formality: 'Festive', is_archived: false, times_worn: 1 },

  { id: 'acc-belt-1', name: 'Black Leather Dress Belt', category: 'accessories', subcategory: 'Belt', primary_color: 'Black', material: 'Leather', formality: 'Formal', is_archived: false, times_worn: 2 },
  { id: 'acc-watch-1', name: 'Silver Steel Watch', category: 'accessories', subcategory: 'Watch', primary_color: 'Light Grey', material: 'Other', formality: 'Formal', is_archived: false, times_worn: 5 },
];

console.log('Wardrobe items prepared: ', SAMPLE_WARDROBE.length);
