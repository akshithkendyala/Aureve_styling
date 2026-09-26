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
    preferredTopSubcategories: ['Shirt', 'Button-Down Shirt', 'Formal Shirt', 'Oxford Shirt'],
    allowedTopSubcategories: ['Shirt', 'Button-Down Shirt', 'Formal Shirt', 'Oxford Shirt'],
    forbiddenTopSubcategories: [
      'T-Shirt',
      'Polo',
      'Tank Top',
      'Sweatshirt',
      'Hoodie',
      'Henley',
      'Kurta',
      'Overshirt',
      'Other',
    ],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos'],
    forbiddenBottomSubcategories: [
      'Track Pants',
      'Joggers',
      'Shorts',
      'Jeans',
      'Dhoti',
      'Pajama',
      'Cargo Pants',
    ],
    preferredFootwearSubcategories: ['Formal Shoes'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers'],
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
    ],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Tie', 'Pocket Square'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat', 'Sunglasses', 'Casual Bracelet', 'Backpack'],
    forbiddenPatterns: ['Graphic', 'Printed / Floral', 'Colorblock'],
    forbiddenMaterials: ['Terry / French Terry', 'Fleece', 'Jersey / Knit', 'Velvet', 'Corduroy'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Crisp, conservative, and polished. Signals competence and executive presence.',
    stylingTips: [
      'Choose solid crisp shirts in white, sky blue, or subtle pinstripes.',
      'Pair with dark tailored trousers (charcoal, navy, black, or grey).',
      'Match your leather belt with your leather shoes.',
      'Never wear casual track pants, hoodies, t-shirts, or sneakers.',
    ],
  },

  party: {
    key: 'party',
    name: 'Party / Night Out',
    aliases: ['party', 'night out', 'club', 'pub', 'house party', 'birthday party', 'celebration', 'lounge', 'dinner party', 'cocktail party'],
    formalityLevels: ['Smart Casual', 'Casual'],
    preferredTopSubcategories: ['Shirt', 'Overshirt'],
    allowedTopSubcategories: ['Shirt', 'Overshirt', 'T-Shirt', 'Polo', 'Hoodie'],
    forbiddenTopSubcategories: [
      'Kurta',
      'Sherwani',
      'Tank Top',
      'Sleeveless',
      'Formal Tuxedo Shirt',
      'Gym Wear',
    ],
    preferredBottomSubcategories: ['Jeans', 'Chinos'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Trousers'],
    forbiddenBottomSubcategories: [
      'Dhoti',
      'Pajama',
      'Track Pants',
      'Gym Shorts',
      'Sweatpants',
    ],
    preferredFootwearSubcategories: ['Sneakers', 'Boots'],
    allowedFootwearSubcategories: ['Sneakers', 'Boots', 'Loafers'],
    forbiddenFootwearSubcategories: [
      'Sandals',
      'Kolhapuris',
      'Slippers',
      'Flip-Flops',
      'Formal Shoes',
      'Running Shoes',
    ],
    allowedLayerSubcategories: ['Jacket', 'Bomber Jacket', 'Denim Jacket', 'Blazer', 'Overshirt'],
    forbiddenLayerSubcategories: ['Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet', 'Ring', 'Cap'],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Modern, classy, confident, social entertainment and night-out styling.',
    stylingTips: [
      'Pair a clean party shirt or dark overshirt with relaxed/baggy jeans and fresh white sneakers.',
      'Keep footwear fashionable: clean minimal sneakers, Chelsea boots, or modern loafers.',
      'Never wear traditional ethnic wear (kurtas) or sandals to a modern party.',
    ],
  },

  office: {
    key: 'office',
    name: 'Office / Workday',
    aliases: ['office', 'work', 'workplace', 'corporate', 'business', 'business casual'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Shirt', 'Polo', 'Overshirt'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'Kurta'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic T-Shirt', 'Distressed Hoodie', 'Sleeveless'],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Pajama', 'Gym Shorts'],
    preferredFootwearSubcategories: ['Formal Shoes', 'Loafers'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers', 'Boots'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Running Shoes', 'Sandals'],
    allowedLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Sweater', 'Cardigan', 'Jacket'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Graphic Hoodie'],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Bag', 'Tie', 'Pocket Square'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    forbiddenMaterials: ['Terry / French Terry', 'Fleece'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Smart, sharp corporate dressing with practical comfort for long desk hours.',
    stylingTips: [
      'Button-down shirts with chinos or dark trousers are timeless anchors.',
      'Leather loafers or clean minimalist white/brown sneakers for smart-casual offices.',
    ],
  },

  presentation: {
    key: 'presentation',
    name: 'Presentation / Pitch',
    aliases: ['presentation', 'college presentation', 'formal presentation', 'pitch', 'client pitch', 'seminar', 'keynote'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Shirt', 'Formal Shirt', 'Oxford Shirt'],
    allowedTopSubcategories: ['Shirt', 'Formal Shirt', 'Oxford Shirt', 'Polo'],
    forbiddenTopSubcategories: ['T-Shirt', 'Sweatshirt', 'Hoodie', 'Tank Top', 'Kurta'],
    preferredBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama', 'Ripped Jeans', 'Cargo Pants'],
    preferredFootwearSubcategories: ['Formal Shoes', 'Loafers'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Cardigan', 'Sweater'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Distressed Denim Jacket'],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Tie'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat', 'Sunglasses'],
    forbiddenPatterns: ['Graphic'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Authoritative, sharp, and confident. Focuses the audience on your ideas.',
    stylingTips: [
      'Structure is key: a tailored shirt and dark trousers command attention.',
      'Keep accessories minimal so there are zero distractions on stage.',
    ],
  },

  wedding: {
    key: 'wedding',
    name: 'Wedding / Festive Function',
    aliases: ['wedding', 'reception', 'sangeet', 'mehendi', 'baraat', 'engagement', 'haldi', 'marriage'],
    formalityLevels: ['Festive', 'Formal', 'Semi-Formal'],
    preferredTopSubcategories: ['Kurta'],
    allowedTopSubcategories: ['Kurta', 'Shirt', 'Formal Shirt'],
    forbiddenTopSubcategories: ['T-Shirt', 'Polo', 'Tank Top', 'Hoodie', 'Sweatshirt', 'Overshirt'],
    preferredBottomSubcategories: ['Trousers', 'Chinos', 'Dhoti', 'Pajama'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Formal Pants'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Ripped Jeans', 'Cargo Pants'],
    preferredFootwearSubcategories: ['Kolhapuris', 'Loafers', 'Formal Shoes'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Loafers', 'Formal Shoes', 'Sandals'],
    forbiddenFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Sports Shoes', 'Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Blazer', 'Overcoat'],
    forbiddenLayerSubcategories: ['Hoodie', 'Bomber Jacket', 'Windbreaker', 'Denim Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Pocket Square', 'Bracelet', 'Ring', 'Scarf'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Elevated contemporary Indian celebration wear. Rich textures, heritage palettes, celebratory elegance.',
    stylingTips: [
      'A structured Kurta with Nehru Jacket or a rich Linen/Silk shirt shines at Indian weddings.',
      'Pair with Kolhapuris or premium Leather Loafers.',
    ],
  },

  festival: {
    key: 'festival',
    name: 'Festival / Traditional Puja',
    aliases: ['festival', 'traditional', 'puja', 'diwali', 'eid', 'navratri', 'onam', 'pongal', 'family function'],
    formalityLevels: ['Festive', 'Semi-Formal', 'Smart Casual'],
    preferredTopSubcategories: ['Kurta'],
    allowedTopSubcategories: ['Kurta', 'Shirt', 'Polo'],
    forbiddenTopSubcategories: ['Graphic T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'],
    preferredBottomSubcategories: ['Chinos', 'Trousers', 'Pajama', 'Dhoti'],
    allowedBottomSubcategories: ['Chinos', 'Trousers', 'Pajama', 'Dhoti', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Gym Shorts', 'Joggers'],
    preferredFootwearSubcategories: ['Kolhapuris', 'Sandals', 'Loafers'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Sandals', 'Loafers', 'Formal Shoes'],
    forbiddenFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Cardigan'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Distressed Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Bracelet', 'Scarf'],
    forbiddenAccessorySubcategories: ['Cap'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
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
    preferredTopSubcategories: ['Shirt', 'Polo', 'Overshirt'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'T-Shirt', 'Sweater'],
    forbiddenTopSubcategories: ['Kurta', 'Tank Top', 'Graphic Sweatshirt', 'Gym Wear'],
    preferredBottomSubcategories: ['Chinos', 'Jeans', 'Trousers'],
    allowedBottomSubcategories: ['Chinos', 'Jeans', 'Trousers'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Loafers', 'Sneakers', 'Boots'],
    allowedFootwearSubcategories: ['Loafers', 'Sneakers', 'Boots', 'Formal Shoes'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Bomber Jacket', 'Denim Jacket', 'Sweater', 'Cardigan'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Track Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Effortless, flattering, and alluring. Subtle sophistication without over-trying.',
    stylingTips: [
      'A fitted Oxford shirt or knit polo with clean chinos and dark loafers creates an irresistible silhouette.',
    ],
  },

  dinner: {
    key: 'dinner',
    name: 'Fine Dining / Evening Dinner',
    aliases: ['dinner', 'family dinner', 'restaurant', 'fine dining', 'formal dinner'],
    formalityLevels: ['Semi-Formal', 'Smart Casual', 'Formal'],
    preferredTopSubcategories: ['Shirt', 'Polo', 'Sweater'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Sweater', 'Overshirt'],
    forbiddenTopSubcategories: ['Kurta', 'Tank Top', 'Graphic T-Shirt', 'Hoodie'],
    preferredBottomSubcategories: ['Trousers', 'Chinos'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers', 'Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Loafers', 'Formal Shoes', 'Boots'],
    allowedFootwearSubcategories: ['Loafers', 'Formal Shoes', 'Boots', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Kolhapuris', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Cardigan', 'Sweater'],
    forbiddenLayerSubcategories: ['Windbreaker'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Pocket Square'],
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
    preferredTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Hoodie'],
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Hoodie', 'Sweatshirt'],
    forbiddenTopSubcategories: ['Kurta', 'Sherwani', 'Tank Top', 'Formal Dress Shirt'],
    preferredBottomSubcategories: ['Jeans', 'Cargo Pants', 'Chinos'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Joggers', 'Trousers'],
    forbiddenBottomSubcategories: ['Pajama', 'Dhoti', 'Formal Suit Pants'],
    preferredFootwearSubcategories: ['Sneakers', 'Running Shoes'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Sandals', 'Boots'],
    forbiddenFootwearSubcategories: ['Flip-Flops', 'Slippers', 'Formal Shoes'],
    allowedLayerSubcategories: ['Denim Jacket', 'Hoodie', 'Sweatshirt', 'Bomber Jacket', 'Windbreaker'],
    forbiddenLayerSubcategories: ['Tuxedo Blazer', 'Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Bag', 'Sunglasses'],
    forbiddenAccessorySubcategories: ['Tie'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'Youthful, comfortable, stylish daily campus rotation.',
    stylingTips: [
      'Combine breathable cotton tees with straight-fit jeans or cargos and fresh sneakers.',
    ],
  },

  casual: {
    key: 'casual',
    name: 'Casual Outing / Weekend',
    aliases: ['casual outing', 'casual', 'weekend', 'brunch', 'coffee', 'hanging out', 'mall', 'shopping'],
    formalityLevels: ['Casual', 'Smart Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt'],
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Hoodie'],
    forbiddenTopSubcategories: ['Kurta', 'Sherwani'],
    preferredBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers'],
    forbiddenBottomSubcategories: ['Pajama', 'Dhoti'],
    preferredFootwearSubcategories: ['Sneakers', 'Loafers'],
    allowedFootwearSubcategories: ['Sneakers', 'Loafers', 'Sandals', 'Running Shoes', 'Boots'],
    forbiddenFootwearSubcategories: ['Flip-Flops'],
    allowedLayerSubcategories: ['Denim Jacket', 'Bomber Jacket', 'Overshirt', 'Windbreaker', 'Cardigan'],
    forbiddenLayerSubcategories: ['Tuxedo Blazer'],
    allowedAccessorySubcategories: ['Watch', 'Sunglasses', 'Cap', 'Belt', 'Bag'],
    forbiddenAccessorySubcategories: ['Tie'],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'Relaxed, effortlessly put-together weekend aesthetics.',
    stylingTips: [
      'Elevate a basic tee by adding a lightweight overshirt and tailored shorts or chinos.',
    ],
  },

  travel: {
    key: 'travel',
    name: 'Travel / Airport / Road Trip',
    aliases: ['travel', 'airport', 'flight', 'road trip', 'vacation', 'commute'],
    formalityLevels: ['Casual', 'Smart Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Overshirt', 'Hoodie'],
    allowedTopSubcategories: ['T-Shirt', 'Overshirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Shirt'],
    forbiddenTopSubcategories: ['Formal Dress Shirt', 'Kurta'],
    preferredBottomSubcategories: ['Joggers', 'Cargo Pants', 'Chinos', 'Jeans'],
    allowedBottomSubcategories: ['Joggers', 'Cargo Pants', 'Chinos', 'Jeans', 'Track Pants', 'Shorts'],
    forbiddenBottomSubcategories: ['Formal Wool Trousers', 'Dhoti'],
    preferredFootwearSubcategories: ['Sneakers', 'Running Shoes'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Boots'],
    forbiddenFootwearSubcategories: ['Stiff Formal Shoes', 'Kolhapuris', 'Flip-Flops'],
    allowedLayerSubcategories: ['Jacket', 'Hoodie', 'Windbreaker', 'Bomber Jacket', 'Cardigan'],
    forbiddenLayerSubcategories: ['Formal Blazer', 'Nehru Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Sunglasses', 'Bag'],
    forbiddenAccessorySubcategories: [],
    strictness: 'STRICT_HARD',
    maxAccessories: 3,
    description: 'High mobility, comfort, functional layers for cabin air conditioning and transit.',
    stylingTips: [
      'Layer a soft zip hoodie or overshirt over a moisture-wicking tee with stretch chinos or joggers.',
    ],
  },

  gym: {
    key: 'gym',
    name: 'Gym / Workout / Sports',
    aliases: ['gym', 'workout', 'sports', 'running', 'fitness', 'training', 'football', 'badminton'],
    formalityLevels: ['Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Tank Top'],
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Sweatshirt', 'Hoodie'],
    forbiddenTopSubcategories: ['Shirt', 'Kurta', 'Polo', 'Blazer', 'Overshirt'],
    preferredBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers'],
    allowedBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers'],
    forbiddenBottomSubcategories: ['Jeans', 'Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Cargo Pants'],
    preferredFootwearSubcategories: ['Running Shoes', 'Sports Shoes'],
    allowedFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Kolhapuris', 'Sandals', 'Boots', 'Slippers'],
    allowedLayerSubcategories: ['Windbreaker', 'Hoodie', 'Sweatshirt'],
    forbiddenLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Denim Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Cap'],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square', 'Leather Belt'],
    strictness: 'STRICT_HARD',
    maxAccessories: 2,
    description: 'High-performance athletic gear prioritizing sweat resistance and range of motion.',
    stylingTips: [
      'Breathable athletic tee with flexible shorts/track pants and responsive running shoes.',
    ],
  },

  home: {
    key: 'home',
    name: 'Home / Lounging',
    aliases: ['home', 'lounging', 'chill', 'remote work', 'wfh'],
    formalityLevels: ['Casual'],
    preferredTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie'],
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'],
    forbiddenTopSubcategories: ['Formal Shirt', 'Blazer', 'Kurta'],
    preferredBottomSubcategories: ['Shorts', 'Track Pants', 'Pajama'],
    allowedBottomSubcategories: ['Shorts', 'Track Pants', 'Pajama', 'Joggers'],
    forbiddenBottomSubcategories: ['Formal Trousers', 'Formal Pants'],
    preferredFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals'],
    allowedFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Boots', 'Loafers'],
    allowedLayerSubcategories: ['Hoodie', 'Cardigan'],
    forbiddenLayerSubcategories: ['Blazer'],
    allowedAccessorySubcategories: [],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square'],
    strictness: 'STRICT_HARD',
    maxAccessories: 1,
    description: 'Ultimate relaxed comfort.',
    stylingTips: [
      'Ultra-soft cotton t-shirt with breathable shorts or relaxed track pants.',
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
 * Canonical Subcategory Normalizer
 */
export function normalizeSubcategory(sub?: string): string {
  if (!sub) return 'Other';
  const s = sub.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Tops
  if (s.includes('t shirt') || s.includes('tshirt') || s.includes('tee')) return 'T-Shirt';
  if (s.includes('polo')) return 'Polo';
  if (s.includes('kurta') || s.includes('sherwani') || s.includes('kurti')) return 'Kurta';
  if (s.includes('overshirt')) return 'Overshirt';
  if (s.includes('henley')) return 'Henley';
  if (s.includes('tank') || s.includes('sleeveless') || s.includes('vest')) return 'Tank Top';
  if (s.includes('sweatshirt')) return 'Sweatshirt';
  if (s.includes('hoodie')) return 'Hoodie';
  if (s.includes('shirt')) return 'Shirt';

  // Bottoms
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
  if (s.includes('formal shoe') || s.includes('oxford') || s.includes('derby') || s.includes('brogue') || s.includes('monk')) return 'Formal Shoes';
  if (s.includes('loafer') || s.includes('moccasin')) return 'Loafers';
  if (s.includes('sneaker') || s.includes('trainer')) return 'Sneakers';
  if (s.includes('running') || s.includes('sports shoe') || s.includes('athletic')) return 'Running Shoes';
  if (s.includes('boot')) return 'Boots';
  if (s.includes('kolhapuri')) return 'Kolhapuris';
  if (s.includes('sandal')) return 'Sandals';
  if (s.includes('slipper') || s.includes('flip flop') || s.includes('slide')) return 'Slippers';

  // Layers
  if (s.includes('blazer') || s.includes('suit jacket')) return 'Blazer';
  if (s.includes('nehru') || s.includes('waistcoat')) return 'Nehru Jacket';
  if (s.includes('sweater') || s.includes('cardigan') || s.includes('pullover')) return 'Sweater';
  if (s.includes('bomber')) return 'Bomber Jacket';
  if (s.includes('windbreaker')) return 'Windbreaker';
  if (s.includes('jacket')) return 'Jacket';
  if (s.includes('coat') || s.includes('overcoat')) return 'Overcoat';

  // Accessories
  if (s.includes('watch')) return 'Watch';
  if (s.includes('belt')) return 'Belt';
  if (s.includes('sunglass') || s.includes('glass')) return 'Sunglasses';
  if (s.includes('cap') || s.includes('hat')) return 'Cap';
  if (s.includes('tie')) return 'Tie';
  if (s.includes('pocket square')) return 'Pocket Square';
  if (s.includes('bag') || s.includes('backpack') || s.includes('briefcase')) return 'Bag';
  if (s.includes('wallet')) return 'Wallet';
  if (s.includes('bracelet') || s.includes('band')) return 'Bracelet';
  if (s.includes('ring')) return 'Ring';
  if (s.includes('scarf')) return 'Scarf';

  return 'Other';
}

