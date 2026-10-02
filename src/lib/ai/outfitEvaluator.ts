import {
  WardrobeItem,
  UserProfile,
  LearnedStyleProfile,
  WeatherData,
  SelfStyledAnalysis,
  OutfitScoreBreakdown,
  OutfitSuggestionAlternative,
  OccasionType,
} from '@/lib/types';
import { getOccasionRule, normalizeSubcategory, OccasionRule } from '@/lib/ai/occasionRules';

export interface EvaluateLookParams {
  selectedItems: WardrobeItem[];
  wardrobe: WardrobeItem[];
  occasion?: string;
  userProfile?: UserProfile | null;
  learnedProfile?: LearnedStyleProfile | null;
  weather?: WeatherData | null;
}

/**
 * Color temperature and neutrality matrix
 */
const NEUTRAL_COLORS = new Set([
  'black',
  'white',
  'off-white',
  'charcoal grey',
  'dark grey',
  'light grey',
  'grey',
  'beige / cream',
  'beige',
  'cream',
  'camel / khaki',
  'khaki',
  'brown / tan',
  'brown',
  'tan',
  'navy blue',
  'navy',
]);

const WARM_COLORS = new Set([
  'burgundy / maroon',
  'burgundy',
  'maroon',
  'red',
  'terracotta / rust',
  'rust',
  'yellow / mustard',
  'mustard',
  'orange',
  'pink / rose',
]);

const COOL_COLORS = new Set([
  'royal blue',
  'sky blue',
  'olive green',
  'dark green',
  'sage green',
  'teal',
  'mint',
  'purple / lavender',
  'lavender',
]);

/**
 * 1. Calculate Color Harmony Score (0 to 10)
 */
export function evaluateColorHarmony(
  items: WardrobeItem[],
  skinTone?: string
): { score: number; notes: string[] } {
  const colors = items.map((i) => (i.primary_color || '').toLowerCase().trim()).filter(Boolean);
  const notes: string[] = [];

  if (colors.length <= 1) {
    return { score: 8.5, notes: ['Monochromatic tonal foundation.'] };
  }

  const neutralCount = colors.filter((c) => NEUTRAL_COLORS.has(c) || Array.from(NEUTRAL_COLORS).some((n) => c.includes(n))).length;
  const nonNeutralColors = colors.filter((c) => !NEUTRAL_COLORS.has(c) && !Array.from(NEUTRAL_COLORS).some((n) => c.includes(n)));

  let score = 8.0;

  // Good base: at least one strong neutral grounding the look
  if (neutralCount >= 1) {
    score += 1.0;
    notes.push('Grounding neutral anchor provides tonal balance.');
  }

  // Check for competing loud colors (more than 2 distinct non-neutrals)
  const uniqueNonNeutrals = new Set(nonNeutralColors);
  if (uniqueNonNeutrals.size > 2) {
    score -= 1.8;
    notes.push('Multiple saturated accent tones competing for attention.');
  } else if (uniqueNonNeutrals.size === 1 && neutralCount >= 1) {
    score += 0.8;
    notes.push('Intentional pop of color against a clean neutral palette.');
  } else if (uniqueNonNeutrals.size === 0) {
    score += 0.6;
    notes.push('Clean, understated neutral color coordination.');
  }

  // Black + Navy / Brown check
  const hasBlack = colors.some((c) => c.includes('black') || c.includes('charcoal'));
  const hasBrown = colors.some((c) => c.includes('brown') || c.includes('tan'));
  if (hasBlack && hasBrown) {
    // Brown + black is modern when deliberate, but slight nuance
    notes.push('Earthy brown with dark charcoal provides subtle organic contrast.');
  }

  // Skin Undertone Harmony Commentary
  if (skinTone) {
    const top = items.find((i) => i.category === 'tops');
    const topColor = (top?.primary_color || '').toLowerCase();
    const normSkin = skinTone.toLowerCase();

    if (normSkin.includes('warm olive') && (topColor.includes('olive') || topColor.includes('rust') || topColor.includes('navy') || topColor.includes('beige'))) {
      score += 0.4;
      notes.push(`Top color complements your Warm Olive undertone effortlessly.`);
    } else if (normSkin.includes('medium wheatish') && (topColor.includes('navy') || topColor.includes('blue') || topColor.includes('white') || topColor.includes('burgundy'))) {
      score += 0.4;
      notes.push(`Rich contrast flatters your Medium Wheatish undertone.`);
    } else if (normSkin.includes('dusky') && (topColor.includes('white') || topColor.includes('blue') || topColor.includes('terracotta') || topColor.includes('mustard'))) {
      score += 0.4;
      notes.push(`Crisp tone creates vibrant, sophisticated contrast against your Dusky undertone.`);
    } else if (normSkin.includes('deep tan') && (topColor.includes('caramel') || topColor.includes('olive') || topColor.includes('burgundy') || topColor.includes('navy'))) {
      score += 0.4;
      notes.push(`Warm tonal depth harmonizes beautifully with your Deep Tan skin tone.`);
    } else if (normSkin.includes('fair') && (topColor.includes('navy') || topColor.includes('charcoal') || topColor.includes('forest') || topColor.includes('grey'))) {
      score += 0.4;
      notes.push(`Deep structured tone provides flattering definition for your Fair undertone.`);
    }
  }

  return {
    score: Math.min(10, Math.max(4.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 2. Calculate Style & Formality Cohesion (0 to 10)
 */
export function evaluateStyleCohesion(items: WardrobeItem[]): { score: number; notes: string[] } {
  const formalities = items.map((i) => i.formality || 'Smart Casual');
  const styles = items.map((i) => (i.style || '').toLowerCase()).filter(Boolean);
  const notes: string[] = [];

  let score = 8.5;

  const hasFormal = formalities.includes('Formal');
  const hasCasual = formalities.includes('Casual');
  const hasFestive = formalities.includes('Festive');

  if (hasFormal && hasCasual) {
    // High contrast: can be intentional smart casual (e.g. blazer + sneakers) or a clash
    const hasSneakers = items.some((i) => i.category === 'footwear' && normalizeSubcategory(i.subcategory) === 'Sneakers');
    const hasSuitPants = items.some((i) => i.category === 'bottoms' && normalizeSubcategory(i.subcategory) === 'Trousers');

    if (hasSneakers && hasSuitPants) {
      score += 0.2;
      notes.push('Contemporary high-low contrast: tailored trousers paired with clean sneakers.');
    } else {
      score -= 1.2;
      notes.push('Noticeable formality clash between formal and ultra-casual pieces.');
    }
  } else if (hasFestive && !hasFormal && !hasCasual) {
    score += 0.8;
    notes.push('Harmonious celebratory ethnic styling across pieces.');
  } else {
    score += 0.6;
    notes.push('Consistent formality level across all garments.');
  }

  return {
    score: Math.min(10, Math.max(4.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 3. Calculate Fit & Proportion (0 to 10)
 */
export function evaluateFitAndProportion(
  items: WardrobeItem[],
  bodyBuild?: string,
  preferredFit?: string
): { score: number; notes: string[] } {
  const top = items.find((i) => i.category === 'tops');
  const bottom = items.find((i) => i.category === 'bottoms');
  const layer = items.find((i) => i.category === 'layers');
  const notes: string[] = [];

  let score = 8.2;

  const topFit = (top?.fit || 'Regular').toLowerCase();
  const bottomFit = (bottom?.fit || 'Regular').toLowerCase();

  if (topFit.includes('relaxed') || topFit.includes('oversized')) {
    if (bottomFit.includes('slim') || bottomFit.includes('tailored')) {
      score += 1.0;
      notes.push('Classic inverted-triangle silhouette: relaxed top balanced by slim tailoring below.');
    } else if (bottomFit.includes('relaxed') || bottomFit.includes('wide')) {
      score += 0.8;
      notes.push('Modern urban drape: relaxed proportions throughout for an effortless Gen-Z streetwear aesthetic.');
    }
  } else if (topFit.includes('slim') || topFit.includes('tailored')) {
    if (bottomFit.includes('wide') || bottomFit.includes('relaxed')) {
      score += 1.0;
      notes.push('Flattering contemporary proportion: structured fitted top paired with wide-leg fluidity.');
    } else {
      score += 0.6;
      notes.push('Clean, streamlined tailored silhouette.');
    }
  }

  if (bodyBuild) {
    const normBuild = bodyBuild.toLowerCase();
    if (normBuild === 'athletic') {
      notes.push('Silhouette balances athletic proportions naturally.');
    } else if (normBuild === 'broad') {
      notes.push('Proportions create clean vertical alignment across the torso and legs.');
    } else if (normBuild === 'slim') {
      notes.push('Structured cut adds subtle presence and intentional drape.');
    }
  }

  if (layer) {
    score += 0.4;
    notes.push(`Outer layer adds architectural depth and structure.`);
  }

  return {
    score: Math.min(10, Math.max(4.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 4. Calculate Occasion Fit (0 to 10)
 */
export function evaluateOccasionFit(
  items: WardrobeItem[],
  occasionRaw?: string
): { score: number; notes: string[] } {
  const notes: string[] = [];

  if (!occasionRaw || occasionRaw.toLowerCase() === 'custom' || occasionRaw.toLowerCase() === 'casual') {
    return {
      score: 8.8,
      notes: ['Versatile combination suitable for general social or everyday outings.'],
    };
  }

  const rule = getOccasionRule(occasionRaw);
  let score = 9.0;

  // Check each item against occasion rule forbidden categories
  for (const item of items) {
    const sub = normalizeSubcategory(item.subcategory);

    if (item.category === 'tops' && rule.forbiddenTopSubcategories.includes(sub)) {
      score -= 3.5;
      notes.push(`${item.name} (${sub}) is too informal/inappropriate for ${rule.name}.`);
    }
    if (item.category === 'bottoms' && rule.forbiddenBottomSubcategories.includes(sub)) {
      score -= 3.5;
      notes.push(`${item.name} (${sub}) conflicts with dress code expectations for ${rule.name}.`);
    }
    if (item.category === 'footwear' && rule.forbiddenFootwearSubcategories.includes(sub)) {
      score -= 3.0;
      notes.push(`${item.name} (${sub}) is unsuitable for ${rule.name}.`);
    }
    if (item.category === 'layers' && rule.forbiddenLayerSubcategories.includes(sub)) {
      score -= 2.0;
      notes.push(`${item.name} (${sub}) layer does not fit the ${rule.name} aesthetic.`);
    }
  }

  if (notes.length === 0) {
    notes.push(`100% occasion-compliant for ${rule.name}.`);
  }

  return {
    score: Math.min(10, Math.max(2.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 5. Calculate Footwear Compatibility (0 to 10)
 */
export function evaluateFootwearCompatibility(items: WardrobeItem[]): { score: number; notes: string[] } {
  const footwear = items.find((i) => i.category === 'footwear');
  const bottom = items.find((i) => i.category === 'bottoms');
  const notes: string[] = [];

  if (!footwear) {
    return { score: 6.0, notes: ['Footwear not selected yet.'] };
  }

  const shoeSub = normalizeSubcategory(footwear.subcategory);
  const bottomSub = bottom ? normalizeSubcategory(bottom.subcategory) : '';

  let score = 8.5;

  if (shoeSub === 'Sneakers') {
    if (bottomSub === 'Jeans' || bottomSub === 'Cargo Pants' || bottomSub === 'Shorts' || bottomSub === 'Wide-Leg Pants') {
      score += 1.0;
      notes.push('Sneakers anchor the casual bottoms naturally.');
    } else if (bottomSub === 'Trousers' || bottomSub === 'Formal Pants') {
      score += 0.5;
      notes.push('Sneakers add a smart-casual relaxed twist to formal trousers.');
    }
  } else if (shoeSub === 'Loafers' || shoeSub === 'Formal Shoes' || shoeSub === 'Flats' || shoeSub === 'Heels') {
    if (bottomSub === 'Trousers' || bottomSub === 'Chinos' || bottomSub === 'Wide-Leg Pants' || bottomSub === 'Skirt' || bottomSub === 'Palazzo') {
      score += 1.0;
      notes.push('Elevated footwear sharpens the bottom silhouette gracefully.');
    }
  } else if (shoeSub === 'Juttis' || shoeSub === 'Kolhapuris' || shoeSub === 'Mojaris') {
    const top = items.find((i) => i.category === 'tops');
    const topSub = top ? normalizeSubcategory(top.subcategory) : '';
    if (
      bottomSub === 'Palazzo' ||
      bottomSub === 'Salwar' ||
      bottomSub === 'Churidar' ||
      bottomSub === 'Dhoti' ||
      topSub === 'Kurti' ||
      topSub === 'Kurta' ||
      topSub === 'Saree' ||
      topSub === 'Lehenga'
    ) {
      score += 1.0;
      notes.push('Ethnic footwear grounds traditional Indian silhouettes with authentic cultural charm.');
    } else {
      score += 0.5;
      notes.push('Ethnic footwear adds unique Indo-Western personality.');
    }
  }

  return {
    score: Math.min(10, Math.max(4.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 6. Calculate Accessory Balance (0 to 10)
 */
export function evaluateAccessoryBalance(items: WardrobeItem[]): { score: number; notes: string[] } {
  const accessories = items.filter((i) => i.category === 'accessories');
  const count = accessories.length;
  const notes: string[] = [];

  let score = 8.0;

  if (count === 0) {
    score = 7.5;
    notes.push('Minimalist aesthetic. Adding a watch, sunglasses, or subtle jewellery could elevate the look.');
  } else if (count >= 1 && count <= 3) {
    score = 9.2;
    const names = accessories.map((a) => a.name).join(', ');
    notes.push(`Well-curated accessories (${names}) provide intentional accents without visual clutter.`);
  } else {
    score = 6.8;
    notes.push('High accessory volume may feel visually busy; consider keeping 2-3 key accents.');
  }

  return {
    score: Math.min(10, Math.max(4.0, Number(score.toFixed(1)))),
    notes,
  };
}

/**
 * 7. Generate Wardrobe-First Improvement Alternatives
 */
export function generateWardrobeAlternatives(
  selectedItems: WardrobeItem[],
  wardrobe: WardrobeItem[],
  occasionRaw?: string,
  overallScore: number = 8.0
): OutfitSuggestionAlternative[] {
  const alternatives: OutfitSuggestionAlternative[] = [];
  const selectedIds = new Set(selectedItems.map((i) => i.id));
  const availableWardrobe = wardrobe.filter((i) => !selectedIds.has(i.id) && !i.is_archived);

  const top = selectedItems.find((i) => i.category === 'tops');
  const bottom = selectedItems.find((i) => i.category === 'bottoms');
  const footwear = selectedItems.find((i) => i.category === 'footwear');
  const layer = selectedItems.find((i) => i.category === 'layers');
  const accessories = selectedItems.filter((i) => i.category === 'accessories');

  // Option 1: KEEP IT (if look is already strong)
  if (overallScore >= 8.4) {
    alternatives.push({
      type: 'KEEP',
      title: 'Keep As Styled',
      description: 'Your outfit is already well-coordinated with great color harmony and silhouette proportion.',
      swapped_item: null,
    });
  }

  // Option 2: IMPROVE IT — Check alternative bottom or top from wardrobe
  if (bottom) {
    const betterBottom = availableWardrobe.find(
      (w) =>
        w.category === 'bottoms' &&
        w.id !== bottom.id &&
        w.primary_color !== bottom.primary_color &&
        (w.formality === 'Smart Casual' || w.formality === 'Formal')
    );

    if (betterBottom) {
      alternatives.push({
        type: 'IMPROVE',
        title: `Swap Bottom for ${betterBottom.name}`,
        description: `Switching to your ${betterBottom.primary_color} ${betterBottom.name} from your wardrobe creates a crisper tonal contrast.`,
        swapped_item: betterBottom,
        target_role: 'bottom',
      });
    }
  }

  // Option 3: ELEVATE IT — Add an outer layer or accessory from wardrobe
  if (!layer) {
    const availableLayer = availableWardrobe.find((w) => w.category === 'layers');
    if (availableLayer) {
      alternatives.push({
        type: 'ELEVATE',
        title: `Layer With ${availableLayer.name}`,
        description: `Adding your ${availableLayer.name} introduces third-piece structure and instant polish.`,
        swapped_item: availableLayer,
        target_role: 'layer',
      });
    }
  } else if (accessories.length === 0) {
    const availableAcc = availableWardrobe.find((w) => w.category === 'accessories');
    if (availableAcc) {
      alternatives.push({
        type: 'ELEVATE',
        title: `Add ${availableAcc.name}`,
        description: `Completing the look with your ${availableAcc.name} adds refined attention to detail.`,
        swapped_item: availableAcc,
        target_role: 'accessory',
      });
    }
  }

  // Option 4: MAKE IT MORE CASUAL or FORMAL based on footwear
  if (footwear) {
    const isSneaker = normalizeSubcategory(footwear.subcategory) === 'Sneakers';
    if (isSneaker) {
      const formalShoe = availableWardrobe.find(
        (w) =>
          w.category === 'footwear' &&
          (normalizeSubcategory(w.subcategory) === 'Loafers' ||
            normalizeSubcategory(w.subcategory) === 'Formal Shoes' ||
            normalizeSubcategory(w.subcategory) === 'Flats' ||
            normalizeSubcategory(w.subcategory) === 'Heels')
      );
      if (formalShoe) {
        alternatives.push({
          type: 'FORMAL',
          title: `Make It More Formal with ${formalShoe.name}`,
          description: `Replacing sneakers with your ${formalShoe.name} instantly adapts this combination for evening dining or meetings.`,
          swapped_item: formalShoe,
          target_role: 'footwear',
        });
      }
    } else {
      const sneaker = availableWardrobe.find((w) => w.category === 'footwear' && normalizeSubcategory(w.subcategory) === 'Sneakers');
      if (sneaker) {
        alternatives.push({
          type: 'CASUAL',
          title: `Make It More Casual with ${sneaker.name}`,
          description: `Switching to your ${sneaker.name} relaxes the outfit for weekend outings and coffee runs.`,
          swapped_item: sneaker,
          target_role: 'footwear',
        });
      }
    }
  }

  return alternatives.slice(0, 3);
}

/**
 * Master Look Evaluation Pipeline
 */
export async function evaluateSelfStyledLook(params: EvaluateLookParams): Promise<SelfStyledAnalysis> {
  const { selectedItems, wardrobe, occasion, userProfile, learnedProfile, weather } = params;

  if (!selectedItems || selectedItems.length === 0) {
    throw new Error('Please select at least a top and bottom to analyze your look.');
  }

  // Calculate categorical scores
  const colorRes = evaluateColorHarmony(selectedItems, userProfile?.skin_tone);
  const styleRes = evaluateStyleCohesion(selectedItems);
  const fitRes = evaluateFitAndProportion(selectedItems, userProfile?.body_build, userProfile?.preferred_fit);
  const occasionRes = evaluateOccasionFit(selectedItems, occasion);
  const footRes = evaluateFootwearCompatibility(selectedItems);
  const accRes = evaluateAccessoryBalance(selectedItems);

  const breakdown: OutfitScoreBreakdown = {
    color_harmony: colorRes.score,
    style_cohesion: styleRes.score,
    fit_and_proportion: fitRes.score,
    occasion_fit: occasionRes.score,
    footwear_compatibility: footRes.score,
    accessory_balance: accRes.score,
  };

  // Weighted overall calculation
  let weighted =
    breakdown.color_harmony * 0.2 +
    breakdown.style_cohesion * 0.2 +
    breakdown.fit_and_proportion * 0.15 +
    breakdown.occasion_fit * 0.25 +
    breakdown.footwear_compatibility * 0.12 +
    breakdown.accessory_balance * 0.08;

  // Occasion safety cap: if occasion fit failed heavily, cap overall score
  if (breakdown.occasion_fit <= 4.0) {
    weighted = Math.min(6.2, weighted);
  }

  const overall_score = Number(Math.min(9.8, Math.max(3.5, weighted)).toFixed(1));

  // Determine Verdict
  let verdict = 'Polished & Contemporary';
  if (overall_score >= 9.0) verdict = 'Flawlessly Curated';
  else if (overall_score >= 8.2) verdict = 'Sharp & Well-Proportioned';
  else if (overall_score >= 7.4) verdict = 'Solid Foundation with Quick Wins';
  else if (overall_score >= 6.0) verdict = 'Interesting High-Low Contrast';
  else verdict = 'Requires Styling Refinement';

  // Generate Wardrobe Alternatives
  const wardrobeAlternatives = generateWardrobeAlternatives(selectedItems, wardrobe, occasion, overall_score);

  // Generate Editorial Feedback (Deterministic base with optional AI refinement)
  const top = selectedItems.find((i) => i.category === 'tops');
  const bottom = selectedItems.find((i) => i.category === 'bottoms');
  const footwear = selectedItems.find((i) => i.category === 'footwear');
  const layer = selectedItems.find((i) => i.category === 'layers');

  let whatWorks = `Your ${top?.name || 'top'} and ${bottom?.name || 'bottom'} form a clean visual base. ${colorRes.notes.join(' ')} ${fitRes.notes.join(' ')}`;
  let howToImprove =
    wardrobeAlternatives.length > 0 && wardrobeAlternatives[0].type !== 'KEEP'
      ? wardrobeAlternatives[0].description
      : 'The outfit is balanced. Keeping your silhouettes unencumbered maintains this sharp, modern presence.';

  // Optional Gemini API enhancement for high-touch editorial prose
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && selectedItems.length >= 2) {
    try {
      const itemsDescription = selectedItems
        .map((i) => `${i.name} (${i.primary_color}, ${i.material || 'Fabric'}, ${i.fit || 'Fit'}, ${i.category})`)
        .join(' + ');

      const promptText = `
You are AUREVÉ's master Indian luxury personal fashion critic.
Analyze this user-styled outfit combination:
Pieces: ${itemsDescription}
Target Occasion: ${occasion || 'Casual / Social'}
User Profile: Skin Undertone: ${userProfile?.skin_tone || 'Warm Neutral'}, Body Build: ${userProfile?.body_build || 'Proportional'}, Preferred Fit: ${userProfile?.preferred_fit || 'Regular'}
Overall Score: ${overall_score}/10
Verdict: "${verdict}"

Provide two short editorial paragraphs:
1. "what_works": 2-3 sentences explaining why this visual combination, colors, and proportions work well (mentioning flattering harmony with their undertone or frame if relevant).
2. "how_to_improve": 1-2 actionable sentences offering a constructive stylist tip (referencing clean contrast, layering, or footwear).

Return strict JSON:
{
  "verdict": "${verdict}",
  "what_works": "...",
  "how_to_improve": "..."
}
`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
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
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed.what_works && parsed.how_to_improve) {
            whatWorks = parsed.what_works;
            howToImprove = parsed.how_to_improve;
            if (parsed.verdict) verdict = parsed.verdict;
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return {
    overall_score,
    breakdown,
    verdict,
    what_works: whatWorks,
    how_to_improve: howToImprove,
    wardrobe_alternatives: wardrobeAlternatives,
    occasion,
  };
}
