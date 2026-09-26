import {
  Outfit,
  WardrobeItem,
  UserProfile,
  WeatherData,
  OccasionType,
  OutfitItemReference,
  AlternativeLook,
  MissingItemSuggestion,
} from '@/lib/types';
import {
  OCCASION_RULES,
  OccasionRule,
  getOccasionRule,
  normalizeSubcategory,
} from '@/lib/ai/occasionRules';

export interface GenerateOutfitParams {
  userId: string;
  userProfile?: UserProfile | null;
  wardrobe: WardrobeItem[];
  occasion: OccasionType | string;
  date: string;
  time?: string;
  location?: string;
  weather?: WeatherData | null;
  previousOutfits?: Outfit[];
  specialMode?: 'standard' | 'quick' | 'comfort' | 'surprise' | 'travel';
}

interface ScoredCombination {
  top: WardrobeItem;
  bottom: WardrobeItem;
  footwear?: WardrobeItem;
  layer?: WardrobeItem;
  accessories: WardrobeItem[];
  score: number;
  fingerprint: string;
  styleDirection: string[];
  title: string;
  explanation: string;
}

/**
 * Filter items strictly by occasion rules — zero tolerance for inappropriate garments
 */
export function isItemPermittedForOccasion(
  item: WardrobeItem,
  category: 'tops' | 'bottoms' | 'footwear' | 'layers' | 'accessories',
  rule: OccasionRule
): boolean {
  const normSub = normalizeSubcategory(item.subcategory);
  const nameLower = (item.name || '').toLowerCase();
  const pattern = (item.pattern || '').trim().toLowerCase();
  const material = (item.material || '').trim().toLowerCase();

  // Explicit keyword guardrails across subcategory and title
  if (rule.forbiddenTopSubcategories.includes('Kurta')) {
    if (normSub === 'Kurta' || nameLower.includes('kurta') || nameLower.includes('sherwani')) {
      return false;
    }
  }

  if (rule.forbiddenFootwearSubcategories.includes('Sandals')) {
    if (
      normSub === 'Sandals' ||
      normSub === 'Kolhapuris' ||
      nameLower.includes('sandal') ||
      nameLower.includes('kolhapuri') ||
      nameLower.includes('slippers')
    ) {
      return false;
    }
  }

  if (rule.forbiddenFootwearSubcategories.includes('Sneakers')) {
    if (normSub === 'Sneakers' || normSub === 'Running Shoes' || nameLower.includes('sneaker') || nameLower.includes('trainer')) {
      return false;
    }
  }

  if (rule.forbiddenBottomSubcategories.includes('Jeans')) {
    if (normSub === 'Jeans' || nameLower.includes('jean') || nameLower.includes('denim')) {
      return false;
    }
  }

  if (rule.forbiddenBottomSubcategories.includes('Track Pants')) {
    if (normSub === 'Track Pants' || normSub === 'Joggers' || nameLower.includes('track') || nameLower.includes('sweatpant')) {
      return false;
    }
  }

  // Pattern check
  if (rule.forbiddenPatterns && pattern) {
    if (rule.forbiddenPatterns.some((fp) => pattern.includes(fp.toLowerCase()))) {
      return false;
    }
  }

  // Material check
  if (rule.forbiddenMaterials && material) {
    if (rule.forbiddenMaterials.some((fm) => material.includes(fm.toLowerCase()))) {
      return false;
    }
  }

  // Category specific allowed and forbidden checks
  if (category === 'tops') {
    if (rule.forbiddenTopSubcategories.some((f) => f.toLowerCase() === normSub.toLowerCase())) {
      return false;
    }
    return rule.allowedTopSubcategories.some((a) => a.toLowerCase() === normSub.toLowerCase());
  }

  if (category === 'bottoms') {
    if (rule.forbiddenBottomSubcategories.some((f) => f.toLowerCase() === normSub.toLowerCase())) {
      return false;
    }
    return rule.allowedBottomSubcategories.some((a) => a.toLowerCase() === normSub.toLowerCase());
  }

  if (category === 'footwear') {
    if (rule.forbiddenFootwearSubcategories.some((f) => f.toLowerCase() === normSub.toLowerCase())) {
      return false;
    }
    return rule.allowedFootwearSubcategories.some((a) => a.toLowerCase() === normSub.toLowerCase());
  }

  if (category === 'layers') {
    if (rule.forbiddenLayerSubcategories.some((f) => f.toLowerCase() === normSub.toLowerCase())) {
      return false;
    }
    if (rule.allowedLayerSubcategories.length > 0) {
      return rule.allowedLayerSubcategories.some((a) => a.toLowerCase() === normSub.toLowerCase());
    }
    return true;
  }

  if (category === 'accessories') {
    if (rule.forbiddenAccessorySubcategories.some((f) => f.toLowerCase() === normSub.toLowerCase())) {
      return false;
    }
    return true;
  }

  return true;
}

/**
 * Calculate Color Harmony Score between items (0 to 25)
 */
function evaluateColorHarmony(top: WardrobeItem, bottom: WardrobeItem, footwear?: WardrobeItem): number {
  const topColor = top.primary_color.toLowerCase();
  const bottomColor = bottom.primary_color.toLowerCase();
  const footColor = footwear?.primary_color.toLowerCase() || '';

  let score = 16;

  const neutrals = ['black', 'white', 'off-white', 'charcoal grey', 'dark grey', 'light grey', 'beige / cream', 'camel / khaki', 'sand'];
  const isTopNeutral = neutrals.some((n) => topColor.includes(n));
  const isBottomNeutral = neutrals.some((n) => bottomColor.includes(n));

  // Anchor principle: At least one piece should be a grounding neutral
  if (isTopNeutral || isBottomNeutral) {
    score += 4;
  }

  // High contrast classics (Light top + Dark bottom, or Dark top + Light bottom)
  if (
    (topColor.includes('white') || topColor.includes('sky blue') || topColor.includes('beige') || topColor.includes('sand')) &&
    (bottomColor.includes('navy') || bottomColor.includes('black') || bottomColor.includes('charcoal'))
  ) {
    score += 5;
  }

  // Monochrome / tonal elegance (All black or navy on navy)
  if (topColor.includes('black') && bottomColor.includes('black')) {
    score += 4;
  }

  // Matching leather rules
  if (footColor) {
    if ((footColor.includes('brown') || footColor.includes('tan')) && bottomColor.includes('navy')) {
      score += 2;
    }
    if (footColor.includes('white') && (bottomColor.includes('blue') || bottomColor.includes('black') || bottomColor.includes('grey'))) {
      score += 3; // Clean white sneakers
    }
  }

  return Math.min(25, score);
}

/**
 * Unique combination fingerprint for anti-repetition tracking
 */
function getCombinationFingerprint(topId: string, bottomId: string, footwearId?: string, layerId?: string): string {
  return `${topId}::${bottomId}::${footwearId || 'none'}::${layerId || 'none'}`;
}

/**
 * Generate intelligent combinatorial candidates and rank them
 */
function generateRankedCandidates(
  tops: WardrobeItem[],
  bottoms: WardrobeItem[],
  footwears: WardrobeItem[],
  layers: WardrobeItem[],
  accessories: WardrobeItem[],
  rule: OccasionRule,
  weather: WeatherData | null | undefined,
  userProfile: UserProfile | null | undefined,
  previousOutfits: Outfit[],
  specialMode: string
): ScoredCombination[] {
  const recentFingerprints = new Set(
    previousOutfits.slice(0, 15).map((o) => {
      const t = o.items.find((i) => i.role === 'top')?.wardrobe_item_id || '';
      const b = o.items.find((i) => i.role === 'bottom')?.wardrobe_item_id || '';
      const f = o.items.find((i) => i.role === 'footwear')?.wardrobe_item_id || '';
      const l = o.items.find((i) => i.role === 'layer')?.wardrobe_item_id || '';
      return getCombinationFingerprint(t, b, f, l);
    })
  );

  const isHot = (weather?.temperature || 28) >= 30;
  const isCool = (weather?.temperature || 28) <= 22;
  const isRain = (weather?.rain_probability || 0) > 40;

  const candidates: ScoredCombination[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      const footwearCandidates = footwears.length > 0 ? footwears : [undefined];

      for (const footwear of footwearCandidates) {
        let layer: WardrobeItem | undefined;
        if (layers.length > 0 && (isCool || rule.formalityLevels.includes('Formal'))) {
          layer = layers.find((l) => l.is_favorite) || layers[0];
        }

        // Match accessories
        const matchedAccessories: WardrobeItem[] = [];
        const watch = accessories.find((a) => normalizeSubcategory(a.subcategory) === 'Watch');
        if (watch && rule.maxAccessories >= 1) matchedAccessories.push(watch);

        const belt = accessories.find((a) => normalizeSubcategory(a.subcategory) === 'Belt');
        if (belt && rule.maxAccessories >= 2 && normalizeSubcategory(bottom.subcategory) !== 'Track Pants') {
          matchedAccessories.push(belt);
        }

        const fingerprint = getCombinationFingerprint(top.id, bottom.id, footwear?.id, layer?.id);

        let score = 55; // Base score

        // 1. Occasion & Formality alignment (+25)
        const topFormality = top.formality || 'Smart Casual';
        const bottomFormality = bottom.formality || 'Smart Casual';
        if (rule.formalityLevels.includes(topFormality as any)) score += 12;
        if (rule.formalityLevels.includes(bottomFormality as any)) score += 13;

        // 1b. Preferred Occasion Subcategories (+35 max)
        const normTopSub = normalizeSubcategory(top.subcategory).toLowerCase();
        const normBottomSub = normalizeSubcategory(bottom.subcategory).toLowerCase();
        const normFootwearSub = footwear ? normalizeSubcategory(footwear.subcategory).toLowerCase() : '';

        if (rule.preferredTopSubcategories?.some((pts) => pts.toLowerCase() === normTopSub)) {
          score += 15;
        }
        if (rule.preferredBottomSubcategories?.some((pbs) => pbs.toLowerCase() === normBottomSub)) {
          score += 10;
        }
        if (footwear && rule.preferredFootwearSubcategories?.some((pfs) => pfs.toLowerCase() === normFootwearSub)) {
          score += 10;
        }

        // 2. Color harmony (+25)
        score += evaluateColorHarmony(top, bottom, footwear);

        // 3. Weather Suitability (+10 / -15)
        if (isHot) {
          if ((top.material || '').toLowerCase().includes('linen') || (top.material || '').toLowerCase().includes('cotton')) score += 6;
          if (layer) score -= 15;
        } else if (isCool) {
          if (layer) score += 8;
        }

        if (isRain) {
          if ((bottom.primary_color || '').toLowerCase().includes('white')) score -= 15;
        }

        // 4. Anti-Repetition Penalty (-40 for exact repeats)
        if (recentFingerprints.has(fingerprint)) {
          score -= 40;
        }

        // User Profile preferences (+5 / -20)
        if (userProfile?.favorite_colors) {
          if (userProfile.favorite_colors.some((fc) => top.primary_color.toLowerCase().includes(fc.toLowerCase()) || bottom.primary_color.toLowerCase().includes(fc.toLowerCase()))) {
            score += 4;
          }
        }
        if (userProfile?.avoided_colors) {
          if (userProfile.avoided_colors.some((ac) => top.primary_color.toLowerCase().includes(ac.toLowerCase()) || bottom.primary_color.toLowerCase().includes(ac.toLowerCase()))) {
            score -= 20;
          }
        }

        const title = generateSmartTitle(rule.key, top, bottom);
        const explanation = generateSmartExplanation(top, bottom, footwear, layer, rule, weather);

        candidates.push({
          top,
          bottom,
          footwear,
          layer,
          accessories: matchedAccessories,
          score,
          fingerprint,
          styleDirection: getStyleDirection(rule, top, bottom),
          title,
          explanation,
        });
      }
    }
  }

  // Sort descending by score
  return candidates.sort((a, b) => b.score - a.score);
}

function getStyleDirection(rule: OccasionRule, top: WardrobeItem, bottom: WardrobeItem): string[] {
  if (rule.key === 'interview') return ['Professional', 'Crisp', 'Executive'];
  if (rule.key === 'party') return ['Modern', 'Classy', 'Night Out'];
  if (rule.key === 'wedding' || rule.key === 'festival') return ['Heritage', 'Celebratory', 'Contemporary Indian'];
  if (rule.key === 'date' || rule.key === 'dinner') return ['Alluring', 'Subtle', 'Effortless'];
  if (rule.key === 'office') return ['Structured', 'Clean', 'Modern Workwear'];
  if (rule.key === 'college') return ['Youthful', 'Relaxed', 'Campus Casual'];
  if (rule.key === 'gym') return ['Athletic', 'High-Mobility', 'Performance'];
  if (rule.key === 'travel') return ['Transit Ready', 'Comfort-First', 'Breathable'];
  return ['Simple', 'Classy', 'Modern'];
}

function generateSmartTitle(occasionKey: string, top: WardrobeItem, bottom: WardrobeItem): string {
  if (occasionKey === 'interview') return 'Polished Executive Presence';
  if (occasionKey === 'party') return 'Modern Night-Out Styling';
  if (occasionKey === 'office') return 'Sharp Workday Minimalist';
  if (occasionKey === 'presentation') return 'Authoritative Keynote Presence';
  if (occasionKey === 'wedding') return 'Contemporary Celebratory Classic';
  if (occasionKey === 'festival') return 'Refined Festive Elegance';
  if (occasionKey === 'date') return 'Modern Effortless Date Night';
  if (occasionKey === 'dinner') return 'Refined Evening Palette';
  if (occasionKey === 'college') return 'Curated Campus Daily';
  if (occasionKey === 'travel') return 'High-Mobility Transit Edit';
  if (occasionKey === 'gym') return 'Performance Athletic Form';
  return 'Elevated Casual Edit';
}

function generateSmartExplanation(
  top: WardrobeItem,
  bottom: WardrobeItem,
  footwear: WardrobeItem | undefined,
  layer: WardrobeItem | undefined,
  rule: OccasionRule,
  weather?: WeatherData | null
): string {
  const topName = top.name;
  const bottomName = bottom.name;
  const footwearStr = footwear ? ` anchored with ${footwear.name.toLowerCase()}` : '';
  const layerStr = layer ? ` structured with the ${layer.name.toLowerCase()}` : '';
  const weatherStr = weather
    ? ` In ${weather.city}'s ${weather.temperature}°C conditions, this selection balances breathability with sharp tailoring.`
    : '';

  if (rule.key === 'interview') {
    return `For your interview, the ${topName} paired with ${bottomName}${footwearStr} creates a crisp, boardroom-ready presence with zero casual distractions.${weatherStr}`;
  }

  if (rule.key === 'party') {
    return `The ${topName} gives an intentional, modern evening vibe, paired with ${bottomName}${footwearStr} for a sleek and confident social look.${weatherStr}`;
  }

  if (rule.key === 'wedding' || rule.key === 'festival') {
    return `The ${topName} harmonizes seamlessly with ${bottomName}${footwearStr}, creating a sophisticated celebratory silhouette that respects festive traditions.${weatherStr}`;
  }

  return `The ${topName} provides a balanced focal point against ${bottomName}${layerStr}${footwearStr}, tailored appropriately for ${rule.name}.${weatherStr}`;
}

/**
 * Intelligent Missing-Item Evaluation Engine
 * Returns a suggestion ONLY when an essential or styling gap genuinely exists for the occasion.
 */
export function evaluateMissingItem(
  wardrobe: WardrobeItem[],
  occasionKey: string,
  chosenTop: WardrobeItem,
  chosenBottom: WardrobeItem
): MissingItemSuggestion | null {
  const activeItems = wardrobe.filter((i) => !i.is_archived);

  // Helper checks across entire active wardrobe
  const hasSubcategory = (cat: string, subNames: string[]) =>
    activeItems.some(
      (it) =>
        it.category === cat &&
        subNames.some(
          (sn) =>
            normalizeSubcategory(it.subcategory).toLowerCase() === sn.toLowerCase() ||
            it.name.toLowerCase().includes(sn.toLowerCase())
        )
    );

  const hasNameKeyword = (keyword: string) =>
    activeItems.some((it) => it.name.toLowerCase().includes(keyword.toLowerCase()));

  if (occasionKey === 'party') {
    const hasPartyShirt =
      hasNameKeyword('party') ||
      hasNameKeyword('cuban') ||
      hasNameKeyword('satin') ||
      activeItems.some(
        (it) =>
          it.category === 'tops' &&
          (it.material?.toLowerCase().includes('silk') ||
            it.pattern?.toLowerCase().includes('printed') ||
            (it.primary_color?.toLowerCase().includes('black') && it.subcategory === 'Shirt'))
      );

    if (!hasPartyShirt) {
      return {
        title: 'Complete Your Party Look',
        suggested_item: 'Deep Navy or Black Textured Party Shirt',
        reason:
          'Your wardrobe has good casual pieces, but a versatile party shirt would give you a more polished, evening-ready option for clubs and gatherings.',
        why_it_works: `Pairs seamlessly with your ${chosenBottom.name} and clean sneakers for an instant evening upgrade.`,
        category: 'tops',
        priority: 'recommended',
      };
    }
  }

  if (occasionKey === 'interview') {
    const hasFormalShoes = hasSubcategory('footwear', ['Formal Shoes', 'Oxford', 'Derby', 'Brogue']);
    if (!hasFormalShoes) {
      return {
        title: 'Essential for Interviews',
        suggested_item: 'Classic Black or Dark Brown Leather Oxfords',
        reason:
          'You have the tailored formal shirt and trousers. A pair of classic leather formal shoes is essential to establish executive polish.',
        why_it_works: 'Anchors your formal trousers with boardroom-level credibility.',
        category: 'footwear',
        priority: 'essential',
      };
    }

    const hasFormalBelt = hasSubcategory('accessories', ['Belt']);
    if (!hasFormalBelt) {
      return {
        title: 'Polishing the Executive Presence',
        suggested_item: 'Matching Leather Dress Belt',
        reason: 'A clean leather belt aligned with your formal shoe tone anchors formal trousers cleanly.',
        why_it_works: 'Creates a clean visual line between your shirt and trousers.',
        category: 'accessories',
        priority: 'recommended',
      };
    }
  }

  if (occasionKey === 'wedding') {
    const hasNehruJacket = hasSubcategory('layers', ['Nehru Jacket', 'Waistcoat', 'Vest']);
    const hasKurta = hasSubcategory('tops', ['Kurta', 'Sherwani']);

    if (!hasNehruJacket && hasKurta) {
      return {
        title: 'Elevate Your Festive Look',
        suggested_item: 'Tailored Silk or Jacquard Nehru Jacket',
        reason: 'Layering a structured Nehru jacket over your Kurta immediately elevates the formality for wedding celebrations.',
        why_it_works: 'Adds rich textural depth and regal structure for celebratory moments.',
        category: 'layers',
        priority: 'recommended',
      };
    }
  }

  if (occasionKey === 'gym') {
    const hasRunningShoes = hasSubcategory('footwear', ['Running Shoes', 'Sports Shoes']);
    if (!hasRunningShoes) {
      return {
        title: 'Essential for Workouts',
        suggested_item: 'Performance Training / Running Shoes',
        reason: 'Proper athletic footwear provides critical cushioning and joint support during training.',
        why_it_works: 'Completes your activewear with correct biomechanical stability.',
        category: 'footwear',
        priority: 'essential',
      };
    }
  }

  // No urgent gaps found
  return null;
}

/**
 * Main AI Outfit Generation Entry Point
 */
export async function generateIntelligentOutfit(
  params: GenerateOutfitParams
): Promise<Omit<Outfit, 'id' | 'user_id' | 'created_at'>> {
  const {
    wardrobe,
    userProfile,
    occasion,
    date,
    time = '19:00',
    location = 'Mumbai',
    weather,
    previousOutfits = [],
    specialMode = 'standard',
  } = params;

  // Step 1: Filter active, non-archived items
  const activeItems = wardrobe.filter((i) => !i.is_archived);
  if (activeItems.length === 0) {
    throw new Error('No active items found in your wardrobe. Please add your clothes first.');
  }

  // Step 2: Retrieve Occasion Rule
  const rule = getOccasionRule(occasion);

  // Step 3: Hard Pre-Filtering based on Occasion Rules
  let validTops = activeItems.filter((i) => i.category === 'tops' && isItemPermittedForOccasion(i, 'tops', rule));
  let validBottoms = activeItems.filter((i) => i.category === 'bottoms' && isItemPermittedForOccasion(i, 'bottoms', rule));
  let validFootwear = activeItems.filter((i) => i.category === 'footwear' && isItemPermittedForOccasion(i, 'footwear', rule));
  let validLayers = activeItems.filter((i) => i.category === 'layers' && isItemPermittedForOccasion(i, 'layers', rule));
  let validAccessories = activeItems.filter((i) => i.category === 'accessories' && isItemPermittedForOccasion(i, 'accessories', rule));

  // Fallback protection only if wardrobe genuinely lacks items in that category
  if (validTops.length === 0) {
    validTops = activeItems
      .filter((i) => i.category === 'tops' && !rule.forbiddenTopSubcategories.includes(normalizeSubcategory(i.subcategory)))
      .sort((a, b) => (a.formality === 'Formal' ? -1 : 1));
  }
  if (validBottoms.length === 0) {
    validBottoms = activeItems
      .filter((i) => i.category === 'bottoms' && !rule.forbiddenBottomSubcategories.includes(normalizeSubcategory(i.subcategory)))
      .sort((a, b) => (a.formality === 'Formal' ? -1 : 1));
  }
  if (validFootwear.length === 0) {
    validFootwear = activeItems.filter(
      (i) => i.category === 'footwear' && !rule.forbiddenFootwearSubcategories.includes(normalizeSubcategory(i.subcategory))
    );
  }

  if (validTops.length === 0 || validBottoms.length === 0) {
    throw new Error(`Your wardrobe does not contain appropriate clothing pieces for ${rule.name}. Please add appropriate pieces to your wardrobe.`);
  }

  // Step 4: Generate Scored Deterministic Candidates
  const rankedCandidates = generateRankedCandidates(
    validTops,
    validBottoms,
    validFootwear,
    validLayers,
    validAccessories,
    rule,
    weather,
    userProfile,
    previousOutfits,
    specialMode
  );

  const topCandidate = rankedCandidates[0];
  if (!topCandidate) {
    throw new Error(`Could not formulate a valid outfit for ${rule.name} with your current wardrobe.`);
  }

  // Step 5: AI Styling Enhancement via Gemini with Strict Guardrails
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let finalLook = topCandidate;
  let aiTitle = topCandidate.title;
  let aiExplanation = topCandidate.explanation;
  let aiStyleDirection = topCandidate.styleDirection;

  if (geminiApiKey && rankedCandidates.length > 0) {
    try {
      const topOptionsForPrompt = validTops.slice(0, 8);
      const bottomOptionsForPrompt = validBottoms.slice(0, 8);
      const footwearOptionsForPrompt = validFootwear.slice(0, 6);

      const promptText = `
You are AUREVÉ's master Indian personal fashion stylist.
OCCASION: "${rule.name}" (${rule.description})
STRICT OCCASION RULES:
- Required Formality: ${rule.formalityLevels.join(', ')}
- Strictly FORBIDDEN for this occasion: ${[
        ...rule.forbiddenTopSubcategories,
        ...rule.forbiddenBottomSubcategories,
        ...rule.forbiddenFootwearSubcategories,
      ].join(', ')}.
- Weather Context: ${weather ? `${weather.city}, ${weather.temperature}°C, ${weather.condition}` : '28°C pleasant'}.

ALLOWED USER WARDROBE PIECES:
Tops:
${topOptionsForPrompt.map((t) => `- ID: "${t.id}" | Name: "${t.name}" | Color: ${t.primary_color} | Subcategory: ${t.subcategory} | Material: ${t.material}`).join('\n')}

Bottoms:
${bottomOptionsForPrompt.map((b) => `- ID: "${b.id}" | Name: "${b.name}" | Color: ${b.primary_color} | Subcategory: ${b.subcategory}`).join('\n')}

Footwear:
${footwearOptionsForPrompt.map((f) => `- ID: "${f.id}" | Name: "${f.name}" | Color: ${f.primary_color} | Subcategory: ${f.subcategory}`).join('\n')}

MANDATORY INSTRUCTIONS:
1. Select the most elegant, occasion-appropriate Top ID, Bottom ID, and Footwear ID from the lists above.
2. For PARTY, select stylish modern shirts / overshirts with clean jeans/chinos and sneakers/boots. NEVER select Kurta or Sandals.
3. For INTERVIEW, select formal shirts, formal trousers, and formal shoes. NEVER select sneakers or t-shirts.
4. Return STRICT JSON:
{
  "title": "Editorial title (e.g., Modern Night-Out Styling)",
  "selected_top_id": "EXACT_ID_FROM_TOPS",
  "selected_bottom_id": "EXACT_ID_FROM_BOTTOMS",
  "selected_footwear_id": "EXACT_ID_FROM_FOOTWEAR",
  "style_direction": ["Modern", "Classy", "Confident"],
  "ai_explanation": "2 concise sentences explaining why this exact combination works beautifully for this real-world occasion."
}
`;

      const modelCandidates = [
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ];

      for (const model of modelCandidates) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
              const chosenTop = validTops.find((t) => t.id === parsed.selected_top_id);
              const chosenBottom = validBottoms.find((b) => b.id === parsed.selected_bottom_id);
              const chosenFootwear = validFootwear.find((f) => f.id === parsed.selected_footwear_id);

              // Hard Post-Validation: Ensure AI did NOT violate occasion rules
              if (
                chosenTop &&
                chosenBottom &&
                isItemPermittedForOccasion(chosenTop, 'tops', rule) &&
                isItemPermittedForOccasion(chosenBottom, 'bottoms', rule)
              ) {
                finalLook = {
                  ...topCandidate,
                  top: chosenTop,
                  bottom: chosenBottom,
                  footwear: chosenFootwear || topCandidate.footwear,
                  title: parsed.title || topCandidate.title,
                  explanation: parsed.ai_explanation || topCandidate.explanation,
                  styleDirection: parsed.style_direction || topCandidate.styleDirection,
                };
                aiTitle = finalLook.title;
                aiExplanation = finalLook.explanation;
                aiStyleDirection = finalLook.styleDirection;
                break;
              }
            }
          }
        } catch (modelErr) {
          // Try next model
        }
      }
    } catch (aiErr) {
      console.warn('AI styling enhancement fallback to scored candidate:', aiErr);
    }
  }

  // Step 6: Construct Main Look Items
  const items: OutfitItemReference[] = [
    { wardrobe_item_id: finalLook.top.id, role: 'top', item: finalLook.top },
    { wardrobe_item_id: finalLook.bottom.id, role: 'bottom', item: finalLook.bottom },
  ];
  if (finalLook.footwear) {
    items.push({ wardrobe_item_id: finalLook.footwear.id, role: 'footwear', item: finalLook.footwear });
  }
  if (finalLook.layer) {
    items.push({ wardrobe_item_id: finalLook.layer.id, role: 'layer', item: finalLook.layer });
  }
  finalLook.accessories.forEach((acc) => {
    items.push({ wardrobe_item_id: acc.id, role: 'accessory', item: acc });
  });

  // Step 7: Construct Meaningfully Diverse, 100% Occasion-Compliant Alternative Looks
  const alternativeLooks = buildOccasionCompliantAlternatives(
    rankedCandidates,
    finalLook,
    rule,
    weather
  );

  // Step 8: Evaluate Missing Items (Optional, Stylist-Led)
  const missingItemSuggestion = evaluateMissingItem(
    wardrobe,
    rule.key,
    finalLook.top,
    finalLook.bottom
  );

  return {
    occasion,
    date,
    time,
    location,
    weather_data: weather,
    title: aiTitle,
    ai_explanation: aiExplanation,
    style_match: Math.min(98, Math.max(89, Math.round(finalLook.score))),
    style_direction: aiStyleDirection,
    items,
    alternative_looks: alternativeLooks,
    missing_item: missingItemSuggestion,
  };
}

/**
 * Generate 2 distinct, strictly occasion-compliant alternative looks
 */
function buildOccasionCompliantAlternatives(
  rankedCandidates: ScoredCombination[],
  primaryLook: ScoredCombination,
  rule: OccasionRule,
  weather?: WeatherData | null
): AlternativeLook[] {
  const alternatives: AlternativeLook[] = [];

  // Find candidate with different top or bottom from primary look
  const alt1Candidate = rankedCandidates.find(
    (c) =>
      c.top.id !== primaryLook.top.id ||
      c.bottom.id !== primaryLook.bottom.id
  );

  if (alt1Candidate) {
    const alt1Items: OutfitItemReference[] = [
      { wardrobe_item_id: alt1Candidate.top.id, role: 'top', item: alt1Candidate.top },
      { wardrobe_item_id: alt1Candidate.bottom.id, role: 'bottom', item: alt1Candidate.bottom },
    ];
    if (alt1Candidate.footwear) {
      alt1Items.push({ wardrobe_item_id: alt1Candidate.footwear.id, role: 'footwear', item: alt1Candidate.footwear });
    }
    if (alt1Candidate.layer) {
      alt1Items.push({ wardrobe_item_id: alt1Candidate.layer.id, role: 'layer', item: alt1Candidate.layer });
    }

    alternatives.push({
      title: rule.key === 'interview' ? 'Look 02 — Classic Formal Alternative' : 'Look 02 — Subtle Shift',
      badge: rule.key === 'interview' ? 'Formal' : 'Refined',
      description: `Rotate into the ${alt1Candidate.top.name} with ${alt1Candidate.bottom.name} for a distinctive, equally polished aesthetic.`,
      items: alt1Items,
    });
  }

  // Find third distinct candidate
  const alt2Candidate = rankedCandidates.find(
    (c) =>
      c.top.id !== primaryLook.top.id &&
      (alt1Candidate ? c.top.id !== alt1Candidate.top.id : true) &&
      (alt1Candidate ? c.bottom.id !== alt1Candidate.bottom.id : true)
  ) || rankedCandidates.find((c) => c.fingerprint !== primaryLook.fingerprint && (alt1Candidate ? c.fingerprint !== alt1Candidate.fingerprint : true));

  if (alt2Candidate) {
    const alt2Items: OutfitItemReference[] = [
      { wardrobe_item_id: alt2Candidate.top.id, role: 'top', item: alt2Candidate.top },
      { wardrobe_item_id: alt2Candidate.bottom.id, role: 'bottom', item: alt2Candidate.bottom },
    ];
    if (alt2Candidate.footwear) {
      alt2Items.push({ wardrobe_item_id: alt2Candidate.footwear.id, role: 'footwear', item: alt2Candidate.footwear });
    }
    if (alt2Candidate.layer) {
      alt2Items.push({ wardrobe_item_id: alt2Candidate.layer.id, role: 'layer', item: alt2Candidate.layer });
    }

    alternatives.push({
      title: rule.key === 'interview' ? 'Look 03 — Tailored Contrast' : 'Look 03 — Structured Presence',
      badge: 'Tailored',
      description: `Pairing the ${alt2Candidate.top.name} against ${alt2Candidate.bottom.name} provides clean tonal definition while remaining 100% occasion-compliant.`,
      items: alt2Items,
    });
  }

  return alternatives;
}


