import { MainCategory } from '@/lib/types';

export const MAIN_CATEGORIES: { value: MainCategory; label: string }[] = [
  { value: 'tops', label: 'Tops (Shirts / Tees / Kurtas)' },
  { value: 'bottoms', label: 'Bottoms (Pants / Jeans / Chinos)' },
  { value: 'layers', label: 'Layers (Jackets / Sweaters / Blazers)' },
  { value: 'footwear', label: 'Footwear (Shoes / Loafers / Sneakers)' },
  { value: 'accessories', label: 'Accessories (Watches / Belts / Glasses)' },
];

export const SUBCATEGORIES_BY_CATEGORY: Record<MainCategory, string[]> = {
  tops: [
    'T-Shirt',
    'Shirt',
    'Polo',
    'Kurta',
    'Overshirt',
    'Henley',
    'Tank Top',
    'Sweatshirt',
    'Hoodie',
    'Other',
  ],
  bottoms: [
    'Jeans',
    'Chinos',
    'Trousers',
    'Formal Pants',
    'Cargo Pants',
    'Track Pants',
    'Shorts',
    'Joggers',
    'Dhoti',
    'Pajama',
    'Other',
  ],
  layers: [
    'Jacket',
    'Blazer',
    'Bomber Jacket',
    'Denim Jacket',
    'Windbreaker',
    'Sweater',
    'Cardigan',
    'Hoodie',
    'Coat',
    'Overcoat',
    'Other',
  ],
  footwear: [
    'Sneakers',
    'Running Shoes',
    'Formal Shoes',
    'Loafers',
    'Boots',
    'Sandals',
    'Kolhapuris',
    'Slippers',
    'Flip-Flops',
    'Sports Shoes',
    'Other',
  ],
  accessories: [
    'Watch',
    'Belt',
    'Sunglasses',
    'Cap',
    'Hat',
    'Wallet',
    'Bag',
    'Bracelet',
    'Ring',
    'Tie',
    'Pocket Square',
    'Scarf',
    'Other',
  ],
};

export const FABRIC_OPTIONS: string[] = [
  'Cotton',
  'Linen',
  'Denim',
  'Cotton Twill',
  'Wool / Cashmere',
  'Silk',
  'Satin',
  'Polyester / Synthetic',
  'Nylon',
  'Rayon / Viscose',
  'Modal',
  'Velvet',
  'Corduroy',
  'Fleece',
  'Leather',
  'Suede',
  'Jersey / Knit',
  'Terry / French Terry',
  'Spandex / Elastane',
  'Blended Fabric',
  'Other',
  'Unknown / Not visible',
];

export const PRIMARY_COLOR_OPTIONS: string[] = [
  'Black',
  'Charcoal Grey',
  'Dark Grey',
  'Light Grey',
  'White',
  'Off-White',
  'Beige / Cream',
  'Navy Blue',
  'Royal Blue',
  'Sky Blue',
  'Olive Green',
  'Dark Green',
  'Sage Green',
  'Teal',
  'Mint',
  'Burgundy / Maroon',
  'Red',
  'Brown / Tan',
  'Camel / Khaki',
  'Terracotta / Rust',
  'Yellow / Mustard',
  'Pink / Rose',
  'Purple / Lavender',
  'Orange',
  'Multicolor',
  'Unknown / Unclear',
];

export const FIT_OPTIONS: string[] = [
  'Regular',
  'Slim',
  'Relaxed',
  'Oversized',
  'Tailored',
  'Not Applicable',
  'Unknown',
];

export const PATTERN_OPTIONS: string[] = [
  'Solid',
  'Striped',
  'Checked',
  'Plaid',
  'Textured / Self-Pattern',
  'Printed / Floral',
  'Graphic',
  'Colorblock',
  'Embroidered',
  'Other',
  'Unknown',
];

export const FORMALITY_OPTIONS: ('Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive')[] = [
  'Casual',
  'Smart Casual',
  'Semi-Formal',
  'Formal',
  'Festive',
];

export const STYLE_OPTIONS: string[] = [
  'Smart Casual',
  'Minimal',
  'Modern Indian',
  'Casual',
  'Streetwear',
  'Formal',
  'Sporty',
];

export const SEASON_OPTIONS: string[] = [
  'Summer',
  'Monsoon',
  'Winter',
  'All-Season',
  'Festive',
];

/**
 * Color Palette Centroids with RGB vectors and threshold rules
 * for ground-truth garment pixel color determination.
 */
export const COLOR_PALETTE_CENTROIDS = [
  { name: 'Black', r: 18, g: 18, b: 22 },
  { name: 'Charcoal Grey', r: 52, g: 56, b: 62 },
  { name: 'Dark Grey', r: 90, g: 94, b: 98 },
  { name: 'Light Grey', r: 185, g: 188, b: 192 },
  { name: 'White', r: 248, g: 248, b: 252 },
  { name: 'Off-White', r: 238, g: 236, b: 226 },
  { name: 'Beige / Cream', r: 222, g: 210, b: 182 },
  { name: 'Navy Blue', r: 18, g: 32, b: 68 },
  { name: 'Royal Blue', r: 28, g: 78, b: 185 },
  { name: 'Sky Blue', r: 130, g: 195, b: 238 },
  { name: 'Teal', r: 20, g: 125, b: 135 },
  { name: 'Mint', r: 160, g: 220, b: 195 },
  { name: 'Olive Green', r: 85, g: 98, b: 52 },
  { name: 'Dark Green', r: 24, g: 62, b: 35 },
  { name: 'Sage Green', r: 135, g: 160, b: 130 },
  { name: 'Burgundy / Maroon', r: 105, g: 24, b: 38 },
  { name: 'Red', r: 215, g: 35, b: 38 },
  { name: 'Brown / Tan', r: 135, g: 85, b: 50 },
  { name: 'Camel / Khaki', r: 185, g: 155, b: 110 },
  { name: 'Terracotta / Rust', r: 180, g: 82, b: 50 },
  { name: 'Yellow / Mustard', r: 218, g: 172, b: 40 },
  { name: 'Pink / Rose', r: 228, g: 140, b: 162 },
  { name: 'Purple / Lavender', r: 145, g: 105, b: 185 },
  { name: 'Orange', r: 235, g: 110, b: 30 },
];

/**
 * Weighted Euclidean color distance modeling human perception
 */
export function calculateColorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db + (rMean * (dr * dr - db * db)) / 256);
}

/**
 * Classifies an RGB triplet into one of the controlled PRIMARY_COLOR_OPTIONS
 */
export function classifyRGBToControlledColor(r: number, g: number, b: number): string {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Strict boundary thresholds for critical ambiguous colors
  if (brightness < 36) return 'Black';
  if (brightness < 68 && r < 75 && g < 75 && b < 85 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12) return 'Charcoal Grey';
  if (brightness > 240 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) return 'White';
  if (brightness > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && b < r) return 'Off-White';
  if (b > r + 25 && b > g + 15 && brightness < 80) return 'Navy Blue';
  if (r > 60 && r < 125 && g > 70 && g < 130 && b < 75 && g > b + 15) return 'Olive Green';
  if (r > 80 && r < 140 && g < 45 && b < 60) return 'Burgundy / Maroon';
  if (r > 180 && g > 140 && b < 70) return 'Yellow / Mustard';

  let closestColor = 'Black';
  let minDistance = Infinity;

  for (const c of COLOR_PALETTE_CENTROIDS) {
    const dist = calculateColorDistance(r, g, b, c.r, c.g, c.b);
    if (dist < minDistance) {
      minDistance = dist;
      closestColor = c.name;
    }
  }

  return closestColor;
}
