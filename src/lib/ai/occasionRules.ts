export type FormalityOption = 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';

export interface OccasionRule {
  key: string;
  name: string;
  aliases: string[];
  formalityLevels: FormalityOption[];
  preferredTopSubcategories?: string[];
  allowedTopSubcategories: string[];
  forbiddenTopSubcategories: string[];
  preferredBottomSubcategories?: string[];
  allowedBottomSubcategories: string[];
  forbiddenBottomSubcategories: string[];
  preferredFootwearSubcategories?: string[];
  allowedFootwearSubcategories: string[];
  forbiddenFootwearSubcategories: string[];
  allowedLayerSubcategories: string[];
  forbiddenLayerSubcategories: string[];
  allowedAccessorySubcategories: string[];
  forbiddenAccessorySubcategories: string[];
  allowedPatterns?: string[];
  forbiddenPatterns?: string[];
  forbiddenMaterials?: string[];
  strictness: 'STRICT_HARD' | 'HIGH' | 'MODERATE' | 'FLEXIBLE';
  maxAccessories: number;
  description: string;
  stylingTips: string[];
}

export const OCCASION_RULES: Record<string, OccasionRule> = {
  interview: {
    key: 'interview',
    name: 'Interview',
    aliases: ['job interview', 'interview', 'job fair', 'placement', 'campus placement', 'internship interview'],
    formalityLevels: ['Formal', 'Semi-Formal'],
    preferredTopSubcategories: ['Shirt', 'Button-Down Shirt', 'Formal Shirt', 'Oxford Shirt', 'Blouse'],
    allowedTopSubcategories: ['Shirt', 'Button-Down Shirt', 'Formal Shirt', 'Oxford Shirt', 'Blouse'],
    forbiddenTopSubcategories: [
      'T-Shirt',
      'Polo',
      'Tank Top',
      'Crop Top',
      'Sweatshirt',
      'Hoodie',
      'Henley',
      'Kurta',
      'Overshirt',
      'Other',
    ],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants', 'Wide-Leg Pants'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Wide-Leg Pants', 'Skirt'],
    forbiddenBottomSubcategories: [
      'Track Pants',
      'Joggers',
      'Shorts',
      'Jeans',
      'Dhoti',
      'Pajama',
      'Cargo Pants',
    ],
    preferredFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Flats', 'Heels'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Flats', 'Heels'],
    forbiddenFootwearSubcategories: [
      'Sneakers',
      'Running Shoes',
      'Sports Shoes',
      'Sandals',
      'Slippers',
      'Flip-Flops',
      'Kolhapuris',
      'Boots',
    ],
    allowedLayerSubcategories: ['Blazer', 'Suit Jacket'],
    forbiddenLayerSubcategories: [
      'Hoodie',
      'Sweatshirt',
      'Bomber Jacket',
      'Denim Jacket',
      'Windbreaker',
      'Track Jacket',
      'Sweater',
      'Cardigan',
      'Nehru Jacket',
      'Shrug',
    ],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Tie', 'Pocket Square', 'Handbag', 'Bag'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat', 'Sunglasses', 'Casual Bracelet', 'Backpack'],
    forbiddenPatterns: ['Graphic', 'Printed / Floral', 'Colorblock'],
    forbiddenMaterials: ['Terry / French Terry', 'Fleece', 'Jersey / Knit', 'Velvet', 'Corduroy'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Crisp, conservative, and polished. Signals competence and executive presence.',
    stylingTips: [
      'Choose solid crisp shirts or tailored blouses in white, sky blue, or subtle pinstripes.',
      'Pair with dark tailored trousers or structured skirts (charcoal, navy, black, or grey).',
      'Match your leather belt and footwear for a clean, cohesive look.',
      'Never wear casual track pants, hoodies, t-shirts, or sneakers.',
    ],
  },

  party: {
    key: 'party',
    name: 'Party / Night Out',
    aliases: ['party', 'night out', 'club', 'pub', 'house party', 'birthday party', 'celebration', 'lounge', 'dinner party', 'cocktail party'],
    formalityLevels: ['Smart Casual', 'Casual'],
    preferredTopSubcategories: ['Shirt', 'Overshirt', 'Crop Top', 'Blouse'],
    allowedTopSubcategories: ['Shirt', 'Overshirt', 'T-Shirt', 'Polo', 'Crop Top', 'Blouse', 'Sweater', 'Hoodie'],
    forbiddenTopSubcategories: [
      'Kurta',
      'Sherwani',
      'Tank Top',
      'Formal Tuxedo Shirt',
      'Gym Wear',
    ],
    preferredBottomSubcategories: ['Jeans', 'Chinos', 'Wide-Leg Pants', 'Skirt'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Trousers', 'Wide-Leg Pants', 'Palazzo', 'Skirt'],
    forbiddenBottomSubcategories: [
      'Dhoti',
      'Pajama',
      'Track Pants',
      'Gym Shorts',
      'Sweatpants',
    ],
    preferredFootwearSubcategories: ['Sneakers', 'Boots', 'Heels', 'Flats'],
    allowedFootwearSubcategories: ['Sneakers', 'Boots', 'Loafers', 'Heels', 'Flats', 'Wedges', 'Slides'],
    forbiddenFootwearSubcategories: [
      'Sandals',
      'Kolhapuris',
      'Slippers',
      'Flip-Flops',
      'Formal Shoes',
      'Running Shoes',
    ],
    allowedLayerSubcategories: ['Jacket', 'Bomber Jacket', 'Denim Jacket', 'Blazer', 'Overshirt', 'Shrug'],
    forbiddenLayerSubcategories: ['Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet', 'Ring', 'Cap', 'Handbag', 'Sling Bag', 'Jewellery', 'Earrings', 'Necklace'],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Modern, classy, confident, social entertainment and night-out styling.',
    stylingTips: [
      'Pair a clean party shirt, stylish crop top, or dark overshirt with relaxed/baggy jeans or wide-leg pants.',
      'Keep footwear fashionable: clean minimal sneakers, Chelsea boots, heels, or modern loafers.',
      'Never wear traditional ethnic wear (kurtas) or sandals to a modern party.',
    ],
  },

  office: {
    key: 'office',
    name: 'Office / Workday',
    aliases: ['office', 'work', 'workplace', 'corporate', 'business', 'business casual'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'Blouse', 'Kurti'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'Kurta', 'Kurti', 'Blouse', 'Tunic', 'Peplum Top', 'Sweater'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic T-Shirt', 'Distressed Hoodie'],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Wide-Leg Pants'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Jeans', 'Wide-Leg Pants', 'Palazzo', 'Skirt', 'Culottes'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Pajama', 'Gym Shorts'],
    preferredFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Flats', 'Heels'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers', 'Boots', 'Flats', 'Heels', 'Wedges'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Running Shoes', 'Sandals'],
    allowedLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Sweater', 'Cardigan', 'Jacket', 'Shrug'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Graphic Hoodie'],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Bag', 'Handbag', 'Tote', 'Tie', 'Pocket Square', 'Jewellery', 'Earrings'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    forbiddenMaterials: ['Terry / French Terry', 'Fleece'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Smart, sharp corporate dressing with practical comfort for long desk hours.',
    stylingTips: [
      'Button-down shirts, tailored blouses, or smart kurtis with chinos or trousers are timeless anchors.',
      'Leather loafers, elegant flats, or clean minimalist sneakers for smart-casual offices.',
    ],
  },

  presentation: {
    key: 'presentation',
    name: 'Presentation / Pitch',
    aliases: ['presentation', 'college presentation', 'formal presentation', 'pitch', 'client pitch', 'seminar', 'keynote'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Shirt', 'Formal Shirt', 'Oxford Shirt', 'Blouse'],
    allowedTopSubcategories: ['Shirt', 'Formal Shirt', 'Oxford Shirt', 'Blouse', 'Polo'],
    forbiddenTopSubcategories: ['T-Shirt', 'Sweatshirt', 'Hoodie', 'Tank Top', 'Kurta'],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Wide-Leg Pants'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Wide-Leg Pants', 'Skirt'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama', 'Ripped Jeans', 'Cargo Pants'],
    preferredFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Flats', 'Heels'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers', 'Flats', 'Heels'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Cardigan', 'Sweater'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Distressed Denim Jacket'],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Tie', 'Handbag'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat', 'Sunglasses'],
    forbiddenPatterns: ['Graphic'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Authoritative, sharp, and confident. Focuses the audience on your ideas.',
    stylingTips: [
      'Structure is key: a tailored shirt or blouse and dark trousers command attention.',
      'Keep accessories minimal so there are zero distractions on stage.',
    ],
  },

  wedding: {
    key: 'wedding',
    name: 'Wedding / Festive Function',
    aliases: ['wedding', 'reception', 'sangeet', 'mehendi', 'baraat', 'engagement', 'haldi', 'marriage'],
    formalityLevels: ['Festive', 'Formal', 'Semi-Formal'],
    preferredTopSubcategories: ['Kurta', 'Saree', 'Kurti', 'Blouse'],
    allowedTopSubcategories: ['Kurta', 'Sherwani', 'Saree', 'Kurti', 'Blouse', 'Shirt', 'Formal Shirt'],
    forbiddenTopSubcategories: ['T-Shirt', 'Polo', 'Tank Top', 'Hoodie', 'Sweatshirt', 'Overshirt'],
    preferredBottomSubcategories: ['Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Palazzo', 'Salwar', 'Churidar', 'Sharara'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Formal Pants', 'Palazzo', 'Salwar', 'Churidar', 'Sharara'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Ripped Jeans', 'Cargo Pants'],
    preferredFootwearSubcategories: ['Kolhapuris', 'Juttis', 'Mojaris', 'Loafers', 'Formal Shoes', 'Heels', 'Flats'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Juttis', 'Mojaris', 'Loafers', 'Formal Shoes', 'Sandals', 'Heels', 'Flats', 'Wedges'],
    forbiddenFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Sports Shoes', 'Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Blazer', 'Overcoat', 'Shrug'],
    forbiddenLayerSubcategories: ['Hoodie', 'Bomber Jacket', 'Windbreaker', 'Denim Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Pocket Square', 'Bracelet', 'Ring', 'Scarf', 'Dupatta', 'Jewellery', 'Earrings', 'Necklace', 'Handbag', 'Sling Bag'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Elevated contemporary Indian celebration wear. Rich textures, heritage palettes, celebratory elegance.',
    stylingTips: [
      'A structured Kurta, Saree, or rich Silk/Linen piece shines at Indian celebrations.',
      'Pair with Kolhapuris, Juttis, heels, or premium Leather Loafers.',
    ],
  },

  festival: {
    key: 'festival',
    name: 'Festival / Traditional Puja',
    aliases: ['festival', 'traditional', 'puja', 'diwali', 'eid', 'navratri', 'onam', 'pongal', 'family function'],
    formalityLevels: ['Festive', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Kurta', 'Kurti', 'Saree', 'Blouse'],
    allowedTopSubcategories: ['Kurta', 'Kurti', 'Saree', 'Shirt', 'Blouse', 'Polo', 'Tunic'],
    forbiddenTopSubcategories: ['Graphic T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'],
    preferredBottomSubcategories: ['Chinos', 'Trousers', 'Pajama', 'Dhoti', 'Palazzo', 'Salwar', 'Churidar'],
    allowedBottomSubcategories: ['Chinos', 'Trousers', 'Pajama', 'Dhoti', 'Jeans', 'Palazzo', 'Salwar', 'Churidar', 'Sharara', 'Wide-Leg Pants'],
    forbiddenBottomSubcategories: ['Track Pants', 'Gym Shorts', 'Joggers'],
    preferredFootwearSubcategories: ['Kolhapuris', 'Juttis', 'Mojaris', 'Sandals', 'Loafers', 'Flats', 'Heels'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Juttis', 'Mojaris', 'Sandals', 'Loafers', 'Formal Shoes', 'Flats', 'Heels', 'Wedges', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Cardigan', 'Shrug'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Distressed Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Bracelet', 'Scarf', 'Dupatta', 'Jewellery', 'Earrings', 'Necklace', 'Handbag', 'Sling Bag'],
    forbiddenAccessorySubcategories: ['Cap'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Modern Indian traditional style celebrating cultural warmth and family moments.',
    stylingTips: [
      'Opt for vibrant or earthy palettes like mustard, olive, off-white, maroon, or navy.',
    ],
  },

  date: {
    key: 'date',
    name: 'Date / Evening Drinks',
    aliases: ['date', 'date night', 'first date', 'romantic dinner', 'cocktails', 'drinks'],
    formalityLevels: ['Smart Casual', 'Semi-Formal'],
    preferredTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'Blouse', 'Crop Top'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'T-Shirt', 'Blouse', 'Crop Top', 'Kurti', 'Tunic', 'Sweater', 'Dress'],
    forbiddenTopSubcategories: ['Kurta', 'Tank Top', 'Graphic Sweatshirt', 'Gym Wear'],
    preferredBottomSubcategories: ['Chinos', 'Jeans', 'Trousers', 'Wide-Leg Pants', 'Skirt'],
    allowedBottomSubcategories: ['Chinos', 'Jeans', 'Trousers', 'Wide-Leg Pants', 'Palazzo', 'Skirt'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Loafers', 'Sneakers', 'Boots', 'Heels', 'Flats'],
    allowedFootwearSubcategories: ['Loafers', 'Sneakers', 'Boots', 'Formal Shoes', 'Heels', 'Flats', 'Wedges'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Bomber Jacket', 'Denim Jacket', 'Sweater', 'Cardigan', 'Shrug'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Track Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet', 'Handbag', 'Sling Bag', 'Jewellery', 'Earrings'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Effortless, flattering, and alluring. Subtle sophistication without over-trying.',
    stylingTips: [
      'A fitted shirt, silk blouse, or knit polo with clean trousers/denim creates an irresistible silhouette.',
    ],
  },

  dinner: {
    key: 'dinner',
    name: 'Fine Dining / Evening Dinner',
    aliases: ['dinner', 'family dinner', 'restaurant', 'fine dining', 'formal dinner'],
    formalityLevels: ['Semi-Formal', 'Smart Casual', 'Formal'],
    preferredTopSubcategories: ['Shirt', 'Polo', 'Blouse', 'Kurti', 'Sweater'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Sweater', 'Overshirt', 'Blouse', 'Kurti', 'Kurta', 'Tunic', 'Dress'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic T-Shirt', 'Hoodie'],
    preferredBottomSubcategories: ['Trousers', 'Chinos', 'Wide-Leg Pants', 'Palazzo'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Jeans', 'Wide-Leg Pants', 'Palazzo', 'Skirt'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers', 'Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Loafers', 'Formal Shoes', 'Boots', 'Heels', 'Flats'],
    allowedFootwearSubcategories: ['Loafers', 'Formal Shoes', 'Boots', 'Sneakers', 'Heels', 'Flats', 'Wedges'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Cardigan', 'Sweater', 'Shrug'],
    forbiddenLayerSubcategories: ['Windbreaker'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Pocket Square', 'Handbag', 'Sling Bag', 'Jewellery', 'Earrings'],
    forbiddenAccessorySubcategories: ['Cap'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Refined evening palette. Elegant lighting and ambient composure.',
    stylingTips: [
      'Deep tones like navy, charcoal, burgundy, and olive pair gracefully in ambient evening lights.',
    ],
  },

  college: {
    key: 'college',
    name: 'College / Campus Day',
    aliases: ['college', 'campus', 'university', 'classes', 'lectures'],
    formalityLevels: ['Casual', 'Smart Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Crop Top', 'Kurti', 'Hoodie'],
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Crop Top', 'Kurti', 'Hoodie', 'Sweatshirt', 'Tank Top'],
    forbiddenTopSubcategories: ['Sherwani', 'Formal Tuxedo Shirt'],
    preferredBottomSubcategories: ['Jeans', 'Cargo Pants', 'Chinos', 'Wide-Leg Pants'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Wide-Leg Pants', 'Palazzo', 'Joggers', 'Skirt', 'Track Pants', 'Trousers'],
    forbiddenBottomSubcategories: ['Pajama', 'Dhoti', 'Formal Suit Pants'],
    preferredFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Flats'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Sandals', 'Flats', 'Slides', 'Boots'],
    forbiddenFootwearSubcategories: ['Flip-Flops', 'Formal Shoes'],
    allowedLayerSubcategories: ['Denim Jacket', 'Hoodie', 'Sweatshirt', 'Bomber Jacket', 'Windbreaker', 'Shrug'],
    forbiddenLayerSubcategories: ['Tuxedo Blazer', 'Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Bag', 'Tote', 'Sling Bag', 'Sunglasses', 'Minimal Jewellery'],
    forbiddenAccessorySubcategories: ['Tie'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Youthful, comfortable, stylish daily campus rotation.',
    stylingTips: [
      'Combine breathable cotton tees, crop tops, or casual shirts with straight-fit/baggy jeans and fresh sneakers.',
    ],
  },

  casual: {
    key: 'casual',
    name: 'Casual Outing / Weekend',
    aliases: ['casual outing', 'casual', 'weekend', 'brunch', 'coffee', 'hanging out', 'mall', 'shopping'],
    formalityLevels: ['Casual', 'Smart Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Crop Top', 'Kurti', 'Blouse'],
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Crop Top', 'Kurti', 'Blouse', 'Tank Top', 'Hoodie', 'Sweater'],
    forbiddenTopSubcategories: ['Sherwani'],
    preferredBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Wide-Leg Pants', 'Palazzo'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Wide-Leg Pants', 'Palazzo', 'Skirt', 'Joggers'],
    forbiddenBottomSubcategories: ['Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Sneakers', 'Loafers', 'Flats', 'Sandals'],
    allowedFootwearSubcategories: ['Sneakers', 'Loafers', 'Sandals', 'Flats', 'Slides', 'Boots', 'Running Shoes', 'Heels'],
    forbiddenFootwearSubcategories: ['Flip-Flops'],
    allowedLayerSubcategories: ['Denim Jacket', 'Bomber Jacket', 'Overshirt', 'Windbreaker', 'Cardigan', 'Shrug'],
    forbiddenLayerSubcategories: ['Tuxedo Blazer'],
    allowedAccessorySubcategories: ['Watch', 'Sunglasses', 'Cap', 'Belt', 'Bag', 'Handbag', 'Sling Bag', 'Tote', 'Jewellery', 'Earrings'],
    forbiddenAccessorySubcategories: ['Tie'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Relaxed, effortlessly put-together weekend aesthetics.',
    stylingTips: [
      'Elevate a basic top by adding a lightweight overshirt, jacket, or minimal jewellery with wide-leg pants or denim.',
    ],
  },

  travel: {
    key: 'travel',
    name: 'Travel / Airport / Road Trip',
    aliases: ['travel', 'airport', 'flight', 'road trip', 'vacation', 'commute'],
    formalityLevels: ['Casual', 'Smart Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Overshirt', 'Hoodie', 'Kurti', 'Crop Top'],
    allowedTopSubcategories: ['T-Shirt', 'Overshirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Shirt', 'Kurti', 'Crop Top', 'Tank Top'],
    forbiddenTopSubcategories: ['Formal Dress Shirt', 'Sherwani'],
    preferredBottomSubcategories: ['Joggers', 'Cargo Pants', 'Chinos', 'Jeans', 'Wide-Leg Pants', 'Palazzo', 'Leggings'],
    allowedBottomSubcategories: ['Joggers', 'Cargo Pants', 'Chinos', 'Jeans', 'Track Pants', 'Shorts', 'Wide-Leg Pants', 'Palazzo', 'Leggings'],
    forbiddenBottomSubcategories: ['Formal Wool Trousers', 'Dhoti'],
    preferredFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Flats', 'Slides'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Boots', 'Flats', 'Slides'],
    forbiddenFootwearSubcategories: ['Stiff Formal Shoes', 'Kolhapuris', 'Flip-Flops', 'High Heels'],
    allowedLayerSubcategories: ['Jacket', 'Hoodie', 'Windbreaker', 'Bomber Jacket', 'Cardigan', 'Shrug'],
    forbiddenLayerSubcategories: ['Formal Blazer', 'Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Sunglasses', 'Bag', 'Tote', 'Sling Bag'],
    forbiddenAccessorySubcategories: [],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'High mobility, comfort, functional layers for cabin air conditioning and transit.',
    stylingTips: [
      'Layer a soft zip hoodie or overshirt over a moisture-wicking tee with stretch chinos, joggers, or wide-leg pants.',
    ],
  },

  gym: {
    key: 'gym',
    name: 'Gym / Workout / Sports',
    aliases: ['gym', 'workout', 'sports', 'running', 'fitness', 'training', 'football', 'badminton'],
    formalityLevels: ['Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Tank Top', 'Crop Top'],
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Sweatshirt', 'Hoodie', 'Crop Top'],
    forbiddenTopSubcategories: ['Shirt', 'Kurta', 'Polo', 'Blazer', 'Overshirt', 'Blouse'],
    preferredBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers', 'Leggings'],
    allowedBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers', 'Leggings'],
    forbiddenBottomSubcategories: ['Jeans', 'Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Cargo Pants', 'Skirt'],
    preferredFootwearSubcategories: ['Running Shoes', 'Sports Shoes'],
    allowedFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Kolhapuris', 'Sandals', 'Boots', 'Slippers', 'Heels'],
    allowedLayerSubcategories: ['Windbreaker', 'Hoodie', 'Sweatshirt'],
    forbiddenLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Denim Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap'],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square', 'Leather Belt'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'High-performance athletic gear prioritizing sweat resistance and range of motion.',
    stylingTips: [
      'Breathable athletic tee or tank with flexible shorts/leggings/track pants and responsive running shoes.',
    ],
  },

  home: {
    key: 'home',
    name: 'Home / Lounging',
    aliases: ['home', 'lounging', 'chill', 'remote work', 'wfh'],
    formalityLevels: ['Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie', 'Crop Top', 'Kurti'],
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt', 'Crop Top', 'Kurti'],
    forbiddenTopSubcategories: ['Formal Shirt', 'Blazer'],
    preferredBottomSubcategories: ['Shorts', 'Track Pants', 'Pajama', 'Leggings', 'Palazzo'],
    allowedBottomSubcategories: ['Shorts', 'Track Pants', 'Pajama', 'Joggers', 'Leggings', 'Palazzo'],
    forbiddenBottomSubcategories: ['Formal Trousers', 'Formal Pants'],
    preferredFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Slides'],
    allowedFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Slides'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Boots', 'Loafers', 'Heels'],
    allowedLayerSubcategories: ['Hoodie', 'Cardigan', 'Shrug'],
    forbiddenLayerSubcategories: ['Blazer'],
    allowedAccessorySubcategories: [],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square'],
    strictness: 'STRICT_HARD',
    maxAccessories: 1,
    description: 'Ultimate relaxed comfort.',
    stylingTips: [
      'Ultra-soft cotton t-shirt or kurti with breathable shorts, leggings, or relaxed track pants.',
    ],
  },
};

/**
 * Match any raw occasion string to the canonical OccasionRule
 */
export function getOccasionRule(rawOccasion: string): OccasionRule {
  if (!rawOccasion) return OCCASION_RULES.casual;

  const query = rawOccasion.trim().toLowerCase();

  for (const [key, rule] of Object.entries(OCCASION_RULES)) {
    if (key === query || rule.name.toLowerCase() === query) {
      return rule;
    }
    for (const alias of rule.aliases) {
      if (query === alias || query.includes(alias)) {
        return rule;
      }
    }
  }

  // Fallback heuristic based on keywords
  if (query.includes('interview') || query.includes('job') || query.includes('placement')) return OCCASION_RULES.interview;
  if (query.includes('party') || query.includes('club') || query.includes('pub') || query.includes('night out')) return OCCASION_RULES.party;
  if (query.includes('office') || query.includes('work') || query.includes('meeting')) return OCCASION_RULES.office;
  if (query.includes('wedding') || query.includes('reception') || query.includes('sangeet') || query.includes('marriage')) return OCCASION_RULES.wedding;
  if (query.includes('festival') || query.includes('puja') || query.includes('diwali') || query.includes('traditional')) return OCCASION_RULES.festival;
  if (query.includes('date') || query.includes('romance')) return OCCASION_RULES.date;
  if (query.includes('dinner') || query.includes('dining')) return OCCASION_RULES.dinner;
  if (query.includes('college') || query.includes('class') || query.includes('campus')) return OCCASION_RULES.college;
  if (query.includes('travel') || query.includes('airport') || query.includes('trip') || query.includes('flight')) return OCCASION_RULES.travel;
  if (query.includes('gym') || query.includes('workout') || query.includes('sport')) return OCCASION_RULES.gym;
  if (query.includes('home') || query.includes('lounge')) return OCCASION_RULES.home;

  return OCCASION_RULES.casual;
}

/**
 * Canonical Subcategory Normalizer with Gender-Neutral and Indian Fashion Taxonomies
 */
export function normalizeSubcategory(sub?: string): string {
  if (!sub) return 'Other';
  const s = sub.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Tops & One-Pieces
  if (s.includes('crop top') || s.includes('croptop') || s.includes('crop tee')) return 'Crop Top';
  if (s.includes('blouse') || s.includes('formal blouse')) return 'Blouse';
  if (s.includes('peplum')) return 'Peplum Top';
  if (s.includes('tunic')) return 'Tunic';
  if (s.includes('kurti')) return 'Kurti';
  if (s.includes('kurta') || s.includes('sherwani') || s.includes('anarkali')) return 'Kurta';
  if (s.includes('saree') || s.includes('sari')) return 'Saree';
  if (s.includes('dress') || s.includes('maxi') || s.includes('midi') || s.includes('jumpsuit')) return 'Dress';
  if (s.includes('tank') || s.includes('sleeveless') || s.includes('camisole') || s.includes('cami')) return 'Tank Top';
  if (s.includes('t shirt') || s.includes('tshirt') || s.includes('tee')) return 'T-Shirt';
  if (s.includes('polo')) return 'Polo';
  if (s.includes('overshirt')) return 'Overshirt';
  if (s.includes('henley')) return 'Henley';
  if (s.includes('sweatshirt')) return 'Sweatshirt';
  if (s.includes('hoodie')) return 'Hoodie';
  if (s.includes('shirt')) return 'Shirt';

  // Bottoms
  if (s.includes('wide leg') || s.includes('wideleg') || s.includes('flared')) return 'Wide-Leg Pants';
  if (s.includes('palazzo') || s.includes('sharara') || s.includes('culotte')) return 'Palazzo';
  if (s.includes('skirt')) return 'Skirt';
  if (s.includes('salwar') || s.includes('patiala')) return 'Salwar';
  if (s.includes('churidar') || s.includes('legging')) return 'Churidar';
  if (s.includes('track') || s.includes('sweatpant')) return 'Track Pants';
  if (s.includes('jogger')) return 'Joggers';
  if (s.includes('cargo')) return 'Cargo Pants';
  if (s.includes('jean') || s.includes('denim')) return 'Jeans';
  if (s.includes('chino') || s.includes('khaki')) return 'Chinos';
  if (s.includes('trouser') || s.includes('formal pant') || s.includes('dress pant') || s.includes('slacks')) return 'Trousers';
  if (s.includes('short')) return 'Shorts';
  if (s.includes('dhoti')) return 'Dhoti';
  if (s.includes('pajama') || s.includes('pyjama')) return 'Pajama';

  // Footwear
  if (s.includes('heel') || s.includes('stiletto') || s.includes('pump') || s.includes('block heel')) return 'Heels';
  if (s.includes('flat') || s.includes('ballerina') || s.includes('mule')) return 'Flats';
  if (s.includes('jutti') || s.includes('mojari') || s.includes('mojri')) return 'Juttis';
  if (s.includes('wedge')) return 'Wedges';
  if (s.includes('formal shoe') || s.includes('oxford') || s.includes('derby') || s.includes('brogue') || s.includes('monk')) return 'Formal Shoes';
  if (s.includes('loafer') || s.includes('moccasin')) return 'Loafers';
  if (s.includes('sneaker') || s.includes('trainer')) return 'Sneakers';
  if (s.includes('running') || s.includes('sports shoe') || s.includes('athletic')) return 'Running Shoes';
  if (s.includes('boot')) return 'Boots';
  if (s.includes('kolhapuri')) return 'Kolhapuris';
  if (s.includes('sandal')) return 'Sandals';
  if (s.includes('slipper') || s.includes('flip flop') || s.includes('slide')) return 'Slippers';

  // Layers
  if (s.includes('shrug')) return 'Shrug';
  if (s.includes('blazer') || s.includes('suit jacket')) return 'Blazer';
  if (s.includes('nehru') || s.includes('waistcoat') || s.includes('bandi')) return 'Nehru Jacket';
  if (s.includes('cardigan')) return 'Cardigan';
  if (s.includes('sweater') || s.includes('pullover')) return 'Sweater';
  if (s.includes('bomber')) return 'Bomber Jacket';
  if (s.includes('windbreaker')) return 'Windbreaker';
  if (s.includes('jacket')) return 'Jacket';
  if (s.includes('coat') || s.includes('overcoat') || s.includes('trench')) return 'Overcoat';

  // Accessories
  if (s.includes('handbag') || s.includes('tote') || s.includes('purse')) return 'Handbag';
  if (s.includes('sling') || s.includes('crossbody')) return 'Sling Bag';
  if (s.includes('earring') || s.includes('jhumka') || s.includes('stud')) return 'Earrings';
  if (s.includes('necklace') || s.includes('chain') || s.includes('choker') || s.includes('pendant')) return 'Necklace';
  if (s.includes('jewel') || s.includes('bangle') || s.includes('kangan')) return 'Jewellery';
  if (s.includes('dupatta') || s.includes('chunni') || s.includes('stole')) return 'Dupatta';
  if (s.includes('scarf')) return 'Scarf';
  if (s.includes('watch')) return 'Watch';
  if (s.includes('belt')) return 'Belt';
  if (s.includes('sunglass') || s.includes('glass')) return 'Sunglasses';
  if (s.includes('cap') || s.includes('hat')) return 'Cap';
  if (s.includes('tie')) return 'Tie';
  if (s.includes('pocket square')) return 'Pocket Square';
  if (s.includes('bag') || s.includes('backpack') || s.includes('briefcase')) return 'Bag';
  if (s.includes('wallet')) return 'Wallet';
  if (s.includes('bracelet') || s.includes('band') || s.includes('kada')) return 'Bracelet';
  if (s.includes('ring')) return 'Ring';

  return 'Other';
}

