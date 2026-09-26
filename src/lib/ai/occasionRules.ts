export type FormalityOption = 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';

export interface OccasionRule {
  key: string;
  name: string;
  aliases: string[];
  formalityLevels: FormalityOption[];
  allowedTopSubcategories: string[];
  forbiddenTopSubcategories: string[];
  allowedBottomSubcategories: string[];
  forbiddenBottomSubcategories: string[];
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
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos'],
    forbiddenBottomSubcategories: [
      'Track Pants',
      'Joggers',
      'Shorts',
      'Jeans',
      'Dhoti',
      'Pajama',
    ],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Boots'],
    forbiddenFootwearSubcategories: [
      'Sneakers',
      'Running Shoes',
      'Sports Shoes',
      'Sandals',
      'Slippers',
      'Flip-Flops',
      'Kolhapuris',
    ],
    allowedLayerSubcategories: ['Blazer', 'Suit Jacket', 'Nehru Jacket'],
    forbiddenLayerSubcategories: [
      'Hoodie',
      'Sweatshirt',
      'Bomber Jacket',
      'Denim Jacket',
      'Windbreaker',
      'Sweater',
      'Cardigan',
    ],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Tie', 'Pocket Square'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat', 'Sunglasses', 'Casual Bracelet'],
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

  office: {
    key: 'office',
    name: 'Office / Workday',
    aliases: ['office', 'work', 'workplace', 'corporate', 'business', 'business casual'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'Kurta'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic T-Shirt', 'Distressed Hoodie', 'Sleeveless'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Pajama'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers', 'Boots'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Nehru Jacket', 'Sweater', 'Cardigan', 'Jacket'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Graphic Hoodie'],
    allowedAccessorySubcategories: ['Belt', 'Watch', 'Bag', 'Tie', 'Pocket Square'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    forbiddenMaterials: ['Terry / French Terry', 'Fleece'],
    strictness: 'HIGH',
    maxAccessories: 2,
    description: 'Smart, sharp corporate dressing with practical comfort for long desk hours.',
    stylingTips: [
      'Button-down shirts with chinos or dark trousers are timeless anchors.',
      'Leather loafers or clean minimalist white/brown sneakers for smart-casual offices.',
    ],
  },

  presentation: {
    key: 'presentation',
    name: 'College / Corporate Presentation',
    aliases: ['presentation', 'college presentation', 'formal presentation', 'pitch', 'client pitch', 'seminar', 'keynote'],
    formalityLevels: ['Formal', 'Semi-Formal', 'Smart Casual'],
    allowedTopSubcategories: ['Shirt', 'Formal Shirt', 'Oxford Shirt', 'Polo'],
    forbiddenTopSubcategories: ['T-Shirt', 'Sweatshirt', 'Hoodie', 'Tank Top'],
    allowedBottomSubcategories: ['Trousers', 'Formal Pants', 'Chinos', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama'],
    allowedFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Running Shoes'],
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
    allowedTopSubcategories: ['Kurta', 'Shirt', 'Formal Shirt'],
    forbiddenTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt', 'Track Pants'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Dhoti', 'Pajama', 'Formal Pants'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Ripped Jeans'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Loafers', 'Formal Shoes', 'Sandals'],
    forbiddenFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Sports Shoes', 'Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Blazer', 'Overcoat'],
    forbiddenLayerSubcategories: ['Hoodie', 'Bomber Jacket', 'Windbreaker'],
    allowedAccessorySubcategories: ['Watch', 'Pocket Square', 'Bracelet', 'Ring', 'Scarf'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    strictness: 'HIGH',
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
    allowedTopSubcategories: ['Kurta', 'Shirt', 'Linen Shirt', 'Polo'],
    forbiddenTopSubcategories: ['Graphic T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'],
    allowedBottomSubcategories: ['Chinos', 'Trousers', 'Pajama', 'Dhoti', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Gym Shorts', 'Joggers'],
    allowedFootwearSubcategories: ['Kolhapuris', 'Sandals', 'Loafers', 'Formal Shoes'],
    forbiddenFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Slippers'],
    allowedLayerSubcategories: ['Nehru Jacket', 'Vest', 'Cardigan'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Distressed Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Bracelet', 'Scarf'],
    forbiddenAccessorySubcategories: ['Cap'],
    strictness: 'HIGH',
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
    allowedTopSubcategories: ['Shirt', 'Polo', 'Overshirt', 'T-Shirt', 'Sweater'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic Sweatshirt', 'Gym Wear'],
    allowedBottomSubcategories: ['Chinos', 'Jeans', 'Trousers'],
    forbiddenBottomSubcategories: ['Track Pants', 'Joggers', 'Shorts', 'Pajama'],
    allowedFootwearSubcategories: ['Loafers', 'Sneakers', 'Boots', 'Formal Shoes'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Bomber Jacket', 'Denim Jacket', 'Sweater', 'Cardigan'],
    forbiddenLayerSubcategories: ['Windbreaker', 'Track Jacket'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet'],
    forbiddenAccessorySubcategories: ['Cap', 'Hat'],
    forbiddenPatterns: ['Graphic'],
    strictness: 'HIGH',
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
    allowedTopSubcategories: ['Shirt', 'Polo', 'Kurta', 'Sweater'],
    forbiddenTopSubcategories: ['Tank Top', 'Graphic T-Shirt', 'Hoodie'],
    allowedBottomSubcategories: ['Trousers', 'Chinos', 'Jeans'],
    forbiddenBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers'],
    allowedFootwearSubcategories: ['Loafers', 'Formal Shoes', 'Sneakers', 'Boots'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Running Shoes'],
    allowedLayerSubcategories: ['Blazer', 'Jacket', 'Cardigan', 'Sweater', 'Nehru Jacket'],
    forbiddenLayerSubcategories: ['Windbreaker'],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Pocket Square'],
    forbiddenAccessorySubcategories: ['Cap'],
    strictness: 'HIGH',
    maxAccessories: 2,
    description: 'Refined evening palette. Elegant lighting and ambient composure.',
    stylingTips: [
      'Deep tones like navy, charcoal, burgundy, and olive pair gracefully in ambient evening lights.',
    ],
  },

  party: {
    key: 'party',
    name: 'Casual Party / Night Out',
    aliases: ['party', 'night out', 'club', 'house party', 'birthday party', 'celebration'],
    formalityLevels: ['Smart Casual', 'Casual'],
    allowedTopSubcategories: ['Shirt', 'T-Shirt', 'Polo', 'Overshirt', 'Hoodie'],
    forbiddenTopSubcategories: ['Tank Top', 'Sleeveless'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Trousers'],
    forbiddenBottomSubcategories: ['Pajama', 'Track Pants'],
    allowedFootwearSubcategories: ['Sneakers', 'Boots', 'Loafers'],
    forbiddenFootwearSubcategories: ['Slippers', 'Flip-Flops'],
    allowedLayerSubcategories: ['Jacket', 'Bomber Jacket', 'Denim Jacket', 'Blazer'],
    forbiddenLayerSubcategories: [],
    allowedAccessorySubcategories: ['Watch', 'Belt', 'Sunglasses', 'Bracelet', 'Cap'],
    forbiddenAccessorySubcategories: [],
    strictness: 'MODERATE',
    maxAccessories: 3,
    description: 'Dynamic, contemporary, expressive, and social.',
    stylingTips: [
      'Layer a printed or open Cuban collar shirt over a clean solid tee.',
    ],
  },

  college: {
    key: 'college',
    name: 'College / Campus Day',
    aliases: ['college', 'campus', 'university', 'classes', 'lectures'],
    formalityLevels: ['Casual', 'Smart Casual'],
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Hoodie', 'Sweatshirt'],
    forbiddenTopSubcategories: ['Tank Top'],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Joggers', 'Trousers'],
    forbiddenBottomSubcategories: ['Pajama', 'Formal Dress Suit'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Sandals', 'Boots'],
    forbiddenFootwearSubcategories: ['Flip-Flops'],
    allowedLayerSubcategories: ['Denim Jacket', 'Hoodie', 'Sweatshirt', 'Bomber Jacket', 'Windbreaker'],
    forbiddenLayerSubcategories: ['Tuxedo Blazer'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Bag', 'Sunglasses'],
    forbiddenAccessorySubcategories: ['Tie'],
    strictness: 'FLEXIBLE',
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
    allowedTopSubcategories: ['T-Shirt', 'Polo', 'Shirt', 'Overshirt', 'Hoodie'],
    forbiddenTopSubcategories: [],
    allowedBottomSubcategories: ['Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Joggers'],
    forbiddenBottomSubcategories: ['Pajama'],
    allowedFootwearSubcategories: ['Sneakers', 'Loafers', 'Sandals', 'Running Shoes'],
    forbiddenFootwearSubcategories: [],
    allowedLayerSubcategories: ['Denim Jacket', 'Bomber Jacket', 'Overshirt', 'Windbreaker', 'Cardigan'],
    forbiddenLayerSubcategories: [],
    allowedAccessorySubcategories: ['Watch', 'Sunglasses', 'Cap', 'Belt', 'Bag'],
    forbiddenAccessorySubcategories: [],
    strictness: 'FLEXIBLE',
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
    allowedTopSubcategories: ['T-Shirt', 'Overshirt', 'Polo', 'Hoodie', 'Sweatshirt', 'Shirt'],
    forbiddenTopSubcategories: ['Formal Dress Shirt'],
    allowedBottomSubcategories: ['Joggers', 'Cargo Pants', 'Chinos', 'Jeans', 'Track Pants', 'Shorts'],
    forbiddenBottomSubcategories: ['Formal Wool Trousers'],
    allowedFootwearSubcategories: ['Sneakers', 'Running Shoes', 'Loafers', 'Slip-on'],
    forbiddenFootwearSubcategories: ['Stiff Formal Shoes'],
    allowedLayerSubcategories: ['Jacket', 'Hoodie', 'Windbreaker', 'Bomber Jacket', 'Cardigan'],
    forbiddenLayerSubcategories: ['Formal Blazer'],
    allowedAccessorySubcategories: ['Watch', 'Cap', 'Sunglasses', 'Bag'],
    forbiddenAccessorySubcategories: [],
    strictness: 'MODERATE',
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
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Sweatshirt', 'Hoodie'],
    forbiddenTopSubcategories: ['Shirt', 'Kurta', 'Polo', 'Blazer'],
    allowedBottomSubcategories: ['Track Pants', 'Shorts', 'Joggers'],
    forbiddenBottomSubcategories: ['Jeans', 'Trousers', 'Chinos', 'Dhoti', 'Pajama'],
    allowedFootwearSubcategories: ['Running Shoes', 'Sports Shoes', 'Sneakers'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Loafers', 'Kolhapuris', 'Boots'],
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
    allowedTopSubcategories: ['T-Shirt', 'Tank Top', 'Hoodie', 'Sweatshirt'],
    forbiddenTopSubcategories: ['Formal Shirt', 'Blazer'],
    allowedBottomSubcategories: ['Shorts', 'Track Pants', 'Pajama', 'Joggers'],
    forbiddenBottomSubcategories: ['Formal Trousers'],
    allowedFootwearSubcategories: ['Slippers', 'Flip-Flops', 'Sandals'],
    forbiddenFootwearSubcategories: ['Formal Shoes', 'Boots'],
    allowedLayerSubcategories: ['Hoodie', 'Cardigan'],
    forbiddenLayerSubcategories: ['Blazer'],
    allowedAccessorySubcategories: [],
    forbiddenAccessorySubcategories: ['Tie', 'Pocket Square'],
    strictness: 'FLEXIBLE',
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
      if (query.includes(alias) || alias.includes(query)) {
        return rule;
      }
    }
  }

  // Fallback heuristic based on keywords
  if (query.includes('interview') || query.includes('job') || query.includes('placement')) return OCCASION_RULES.interview;
  if (query.includes('office') || query.includes('work') || query.includes('meeting')) return OCCASION_RULES.office;
  if (query.includes('wedding') || query.includes('reception') || query.includes('sangeet')) return OCCASION_RULES.wedding;
  if (query.includes('festival') || query.includes('puja') || query.includes('traditional')) return OCCASION_RULES.festival;
  if (query.includes('date') || query.includes('romance')) return OCCASION_RULES.date;
  if (query.includes('dinner') || query.includes('dining')) return OCCASION_RULES.dinner;
  if (query.includes('party') || query.includes('club')) return OCCASION_RULES.party;
  if (query.includes('college') || query.includes('class')) return OCCASION_RULES.college;
  if (query.includes('travel') || query.includes('airport') || query.includes('trip')) return OCCASION_RULES.travel;
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
  if (s.includes('kurta')) return 'Kurta';
  if (s.includes('overshirt')) return 'Overshirt';
  if (s.includes('henley')) return 'Henley';
  if (s.includes('tank')) return 'Tank Top';
  if (s.includes('sweatshirt')) return 'Sweatshirt';
  if (s.includes('hoodie')) return 'Hoodie';
  if (s.includes('shirt')) return 'Shirt';

  // Bottoms
  if (s.includes('track') || s.includes('sweatpant')) return 'Track Pants';
  if (s.includes('jogger')) return 'Joggers';
  if (s.includes('jean') || s.includes('denim')) return 'Jeans';
  if (s.includes('chino') || s.includes('khaki')) return 'Chinos';
  if (s.includes('trouser') || s.includes('formal pant') || s.includes('dress pant') || s.includes('slacks')) return 'Trousers';
  if (s.includes('short')) return 'Shorts';
  if (s.includes('dhoti')) return 'Dhoti';
  if (s.includes('pajama') || s.includes('pyjama')) return 'Pajama';

  // Footwear
  if (s.includes('formal shoe') || s.includes('oxford') || s.includes('derby') || s.includes('brogue')) return 'Formal Shoes';
  if (s.includes('loafer') || s.includes('moccasin') || s.includes('slip on')) return 'Loafers';
  if (s.includes('sneaker') || s.includes('trainer')) return 'Sneakers';
  if (s.includes('running') || s.includes('sports shoe') || s.includes('athletic')) return 'Running Shoes';
  if (s.includes('boot')) return 'Boots';
  if (s.includes('kolhapuri')) return 'Kolhapuris';
  if (s.includes('sandal')) return 'Sandals';
  if (s.includes('slipper') || s.includes('flip flop') || s.includes('slide')) return 'Slippers';

  // Layers
  if (s.includes('blazer') || s.includes('suit jacket')) return 'Blazer';
  if (s.includes('nehru') || s.includes('vest') || s.includes('waistcoat')) return 'Nehru Jacket';
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
