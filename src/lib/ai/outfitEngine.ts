import {
  Outfit,
  WardrobeItem,
  UserProfile,
  WeatherData,
  OccasionType,
  OutfitItemReference,
  AlternativeLook,
  MissingItemSuggestion,
  OutfitFeedback,
  LearnedStyleProfile,
  CustomOccasionContext,
} from '@/lib/types';
import {
  OCCASION_RULES,
  OccasionRule,
  getOccasionRule,
  normalizeSubcategory,
} from '@/lib/ai/occasionRules';
import {
  buildLearnedStyleProfile,
  calculateFeedbackScore,
} from '@/lib/ai/personalStyleEngine';
import {
  interpretCustomOccasion,
  buildCustomOccasionRule,
} from '@/lib/ai/customOccasionEngine';

export interface GenerateOutfitParams {
  userId: string;
  userProfile?: UserProfile | null;
  wardrobe: WardrobeItem[];
  occasion: OccasionType | string;
  customOccasionText?: string;
  date: string;
  time?: string;
  location?: string;
  weather?: WeatherData | null;
  previousOutfits?: Outfit[];
  userFeedback?: OutfitFeedback[];
  specialMode?: 'standard' | 'quick' | 'comfort' | 'surprise' | 'travel';
}

interface ScoredCombination {
  top: WardrobeItem;
  bottom?: WardrobeItem;
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
 * Helper to identify one-piece outfits (dresses, jumpsuits, sarees, anarkalis, rompers)
 * which do not require a separate bottom piece.
 */
export function isOnePiece(item?: WardrobeItem): boolean {
  if (!item) return false;
  const sub = normalizeSubcategory(item.subcategory).toLowerCase();
  const name = (item.name || '').toLowerCase();
  const onePieceKeywords = ['dress', 'saree', 'jumpsuit', 'romper', 'anarkali', 'lehenga'];
  return onePieceKeywords.some((op) => sub.includes(op) || name.includes(op));
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
 * Seamlessly incorporates user skin undertones for tailored color contrast.
 */
function evaluateColorHarmony(
  top: WardrobeItem,
  bottom?: WardrobeItem,
  footwear?: WardrobeItem,
  skinTone?: string
): number {
  const topColor = top.primary_color.toLowerCase();
  const bottomColor = bottom ? bottom.primary_color.toLowerCase() : '';
  const footColor = footwear?.primary_color.toLowerCase() || '';

  let score = 16;

  const neutrals = ['black', 'white', 'off-white', 'charcoal grey', 'dark grey', 'light grey', 'beige / cream', 'camel / khaki', 'sand'];
  const isTopNeutral = neutrals.some((n) => topColor.includes(n));
  const isBottomNeutral = bottomColor ? neutrals.some((n) => bottomColor.includes(n)) : true;

  // Anchor principle: At least one piece should be a grounding neutral
  if (isTopNeutral || isBottomNeutral) {
    score += 4;
  }

  if (bottomColor) {
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
  } else {
    // For one-piece garments (Dresses, Sarees, Jumpsuits), award standalone color harmony
    score += 5;
    if (footColor && (neutrals.some((n) => footColor.includes(n)) || footColor.includes('gold') || footColor.includes('silver') || footColor.includes('tan') || footColor.includes('nude'))) {
      score += 3;
    }
  }

  // Skin Undertone Harmony Enhancement (+3 bonus for top colors that frame the face harmoniously)
  if (skinTone) {
    const normSkin = skinTone.toLowerCase();
    if (normSkin.includes('warm olive')) {
      // Flattered by warm earthy tones, deep navy, olive, rust, burgundy, warm beige
      if (
        topColor.includes('olive') ||
        topColor.includes('green') ||
        topColor.includes('terracotta') ||
        topColor.includes('rust') ||
        topColor.includes('navy') ||
        topColor.includes('beige') ||
        topColor.includes('mustard') ||
        topColor.includes('maroon') ||
        topColor.includes('burgundy')
      ) {
        score += 3;
      }
    } else if (normSkin.includes('medium wheatish')) {
      // Flattered by deep rich jewel neutrals, royal blue, navy, emerald, wine, crisp white
      if (
        topColor.includes('navy') ||
        topColor.includes('blue') ||
        topColor.includes('emerald') ||
        topColor.includes('green') ||
        topColor.includes('burgundy') ||
        topColor.includes('white') ||
        topColor.includes('charcoal')
      ) {
        score += 3;
      }
    } else if (normSkin.includes('dusky')) {
      // Flattered by high-contrast vivids, crisp white, cobalt blue, terracotta, mustard, gold, rich purple
      if (
        topColor.includes('white') ||
        topColor.includes('off-white') ||
        topColor.includes('blue') ||
        topColor.includes('terracotta') ||
        topColor.includes('mustard') ||
        topColor.includes('emerald') ||
        topColor.includes('sage')
      ) {
        score += 3;
      }
    } else if (normSkin.includes('deep tan')) {
      // Flattered by warm earth tones, deep jewel hues, caramel, burgundy, rich navy, off-white
      if (
        topColor.includes('caramel') ||
        topColor.includes('brown') ||
        topColor.includes('olive') ||
        topColor.includes('burgundy') ||
        topColor.includes('navy') ||
        topColor.includes('off-white') ||
        topColor.includes('cream')
      ) {
        score += 3;
      }
    } else if (normSkin.includes('fair')) {
      // Flattered by rich deep contrasts & cool tones: navy, charcoal, slate grey, forest green, pastel blue
      if (
        topColor.includes('navy') ||
        topColor.includes('charcoal') ||
        topColor.includes('black') ||
        topColor.includes('slate') ||
        topColor.includes('grey') ||
        topColor.includes('forest') ||
        topColor.includes('sky blue')
      ) {
        score += 3;
      }
    }
  }

  return Math.min(25, score);
}

/**
 * Unique combination fingerprint for anti-repetition tracking
 */
function getCombinationFingerprint(topId: string, bottomId?: string, footwearId?: string, layerId?: string): string {
  return `${topId}::${bottomId || 'standalone'}::${footwearId || 'none'}::${layerId || 'none'}`;
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
  specialMode: string,
  learnedProfile?: LearnedStyleProfile
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

  const temp = weather?.temperature ?? 28;
  const humidity = weather?.humidity ?? 50;
  const rainProb = weather?.rain_probability ?? 0;
  const windSpeed = weather?.wind_speed ?? 10;
  const isHot = temp >= 30;
  const isVeryHot = temp >= 34;
  const isCool = temp <= 22;
  const isCold = temp <= 16;
  const isRain =
    rainProb >= 35 ||
    (weather?.condition || '').toLowerCase().includes('rain') ||
    (weather?.condition || '').toLowerCase().includes('shower') ||
    (weather?.condition || '').toLowerCase().includes('drizzle');
  const isHighHumidity = humidity >= 70 && temp >= 27;
  const isWindy = windSpeed >= 20;

  const candidates: ScoredCombination[] = [];

  for (const top of tops) {
    const isSinglePiece = isOnePiece(top);
    // For one-piece garments, bottom can be undefined (or paired with bottoms if available)
    const bottomCandidates: (WardrobeItem | undefined)[] = isSinglePiece
      ? (bottoms.length > 0 ? [undefined, ...bottoms] : [undefined])
      : bottoms;

    for (const bottom of bottomCandidates) {
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
        if (belt && bottom && rule.maxAccessories >= 2 && normalizeSubcategory(bottom.subcategory) !== 'Track Pants') {
          matchedAccessories.push(belt);
        }

        const handbag = accessories.find((a) => {
          const sub = normalizeSubcategory(a.subcategory).toLowerCase();
          return sub.includes('bag') || sub.includes('tote') || sub.includes('clutch');
        });
        if (handbag && rule.maxAccessories >= 2 && !matchedAccessories.includes(handbag)) {
          matchedAccessories.push(handbag);
        }

        const fingerprint = getCombinationFingerprint(top.id, bottom?.id, footwear?.id, layer?.id);

        let score = 55; // Base score

        // 1. Occasion & Formality alignment (+25)
        const topFormality = top.formality || 'Smart Casual';
        if (rule.formalityLevels.includes(topFormality as any)) score += 12;

        if (bottom) {
          const bottomFormality = bottom.formality || 'Smart Casual';
          if (rule.formalityLevels.includes(bottomFormality as any)) score += 13;
        } else if (isSinglePiece) {
          // One-piece already carries complete outfit silhouette
          score += 13;
        }

        if (footwear) {
          const footwearFormality = footwear.formality || 'Smart Casual';
          if (rule.formalityLevels.includes(footwearFormality as any)) score += 10;
          if (rule.key === 'interview' && (footwearFormality === 'Formal' || normalizeSubcategory(footwear.subcategory) === 'Formal Shoes')) {
            score += 15; // High priority for formal shoes/Oxfords for interviews
          }
        }

        // 1b. Preferred Occasion Subcategories (+35 max)
        const normTopSub = normalizeSubcategory(top.subcategory).toLowerCase();
        const normBottomSub = bottom ? normalizeSubcategory(bottom.subcategory).toLowerCase() : '';
        const normFootwearSub = footwear ? normalizeSubcategory(footwear.subcategory).toLowerCase() : '';

        if (rule.preferredTopSubcategories?.some((pts) => pts.toLowerCase() === normTopSub)) {
          score += 15;
        }
        if (bottom && rule.preferredBottomSubcategories?.some((pbs) => pbs.toLowerCase() === normBottomSub)) {
          score += 10;
        }
        if (footwear && rule.preferredFootwearSubcategories?.some((pfs) => pfs.toLowerCase() === normFootwearSub)) {
          score += 10;
        }

        // 2. Color harmony & Skin Undertone alignment (+25)
        score += evaluateColorHarmony(top, bottom, footwear, userProfile?.skin_tone);

        // 3. Silhouette & Body Build Proportion Harmony (+6)
        if (userProfile?.body_build) {
          const build = userProfile.body_build.toLowerCase();
          const topFit = (top.fit || 'Regular').toLowerCase();
          const bottomFit = (bottom?.fit || 'Regular').toLowerCase();

          if (isSinglePiece) {
            score += 5; // One-piece silhouettes naturally create fluid, balanced vertical lines
          } else if (build === 'broad') {
            // Broad frames benefit from structured regular tops and straight/relaxed bottoms
            if (topFit === 'regular' || topFit === 'relaxed') score += 3;
            if (bottomFit === 'regular' || bottomFit === 'relaxed' || bottomFit === 'wide') score += 3;
          } else if (build === 'athletic') {
            // Athletic builds look great with tailored/slim tops and tapered or slim-straight bottoms
            if (topFit === 'slim' || topFit === 'tailored' || topFit === 'regular') score += 3;
            if (bottomFit === 'slim' || bottomFit === 'tailored' || bottomFit === 'regular') score += 3;
          } else if (build === 'slim') {
            // Slim frames look great with subtle layering, regular tops, and straight bottoms
            if (topFit === 'regular' || topFit === 'relaxed' || layer) score += 3;
            if (bottomFit === 'regular' || bottomFit === 'straight') score += 3;
          } else if (build === 'medium') {
            // Medium frames are versatile
            score += 4;
          }
        }

        // 3b. Preferred Fit alignment (+4)
        if (userProfile?.preferred_fit) {
          const pref = userProfile.preferred_fit.toLowerCase();
          if ((top.fit || '').toLowerCase().includes(pref) || (bottom?.fit || '').toLowerCase().includes(pref)) {
            score += 4;
          }
        }

        // 4. Enhanced Multi-Dimensional Weather Suitability
        if (isHot) {
          const topMat = (top.material || '').toLowerCase();
          if (topMat.includes('linen') || topMat.includes('cotton') || topMat.includes('modal') || topMat.includes('chambray')) score += 8;
          if (layer && !rule.formalityLevels.includes('Formal')) score -= 15;
          if (isVeryHot && layer) score -= 10;
        } else if (isCold || isCool) {
          const topSub = normalizeSubcategory(top.subcategory).toLowerCase();
          const topMat = (top.material || '').toLowerCase();
          const isWarmTop = topSub.includes('sweater') || topSub.includes('sweatshirt') || topSub.includes('pullover') || topMat.includes('wool') || topMat.includes('cashmere') || topMat.includes('fleece') || topMat.includes('knit');
          const isBreezyTop = topMat.includes('linen') || topSub.includes('sleeveless');

          if (isWarmTop) {
            score += isCold ? 25 : 15; // Strong boost for warm knitwear/wool in cold weather
          }
          if (isBreezyTop) {
            score -= isCold ? 25 : 12; // Heavy penalty for breezy linen in cold weather
          }
          if (layer) {
            score += isCold ? 14 : 8;
          } else if (!isSinglePiece && !isWarmTop && !rule.formalityLevels.includes('Formal')) {
            score -= 10;
          }
        }

        if (isHighHumidity) {
          const topFit = (top.fit || '').toLowerCase();
          if (topFit.includes('relaxed') || topFit.includes('regular') || topFit.includes('oversized')) score += 5;
        }

        if (isRain) {
          if (bottom) {
            const bColor = (bottom.primary_color || '').toLowerCase();
            const bMat = (bottom.material || '').toLowerCase();
            if (bColor.includes('white') || bColor.includes('cream') || bColor.includes('ivory')) score -= 20; // mud/rain splatter risk
            if (bMat.includes('silk') || bMat.includes('satin')) score -= 15;
            if (bColor.includes('black') || bColor.includes('navy') || bColor.includes('charcoal') || bColor.includes('dark')) score += 6;
          }
          if (footwear) {
            const fMat = (footwear.material || '').toLowerCase();
            const fName = (footwear.name || '').toLowerCase();
            if (fMat.includes('suede') || fName.includes('suede') || fMat.includes('canvas') || fName.includes('canvas')) score -= 15;
            if (fMat.includes('leather') || fName.includes('leather') || fName.includes('boot')) score += 6;
          }
        }

        if (isWindy && layer) {
          score += 4;
        }

        // 5. Anti-Repetition Penalty (-40 for exact repeats)
        if (recentFingerprints.has(fingerprint)) {
          score -= 40;
        }

        // 6. User Profile static preferences (+5 / -20)
        if (userProfile?.favorite_colors) {
          if (userProfile.favorite_colors.some((fc) => top.primary_color.toLowerCase().includes(fc.toLowerCase()) || (bottom && bottom.primary_color.toLowerCase().includes(fc.toLowerCase())))) {
            score += 4;
          }
        }
        if (userProfile?.avoided_colors) {
          if (userProfile.avoided_colors.some((ac) => top.primary_color.toLowerCase().includes(ac.toLowerCase()) || (bottom && bottom.primary_color.toLowerCase().includes(ac.toLowerCase())))) {
            score -= 20;
          }
        }

        // 7. Dynamic Personal Style Learning & Feedback Score (+/- 35)
        let personalReasons: string[] = [];
        if (learnedProfile && learnedProfile.totalFeedbacks > 0) {
          const fbResult = calculateFeedbackScore(
            { top, bottom, footwear, layer, accessories: matchedAccessories },
            rule.key,
            learnedProfile
          );
          score += fbResult.score;
          personalReasons = fbResult.reasons;
        }

        const title = generateSmartTitle(rule.key, top, bottom);
        const explanation = generateSmartExplanation(top, bottom, footwear, layer, rule, weather, personalReasons);

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

function getStyleDirection(rule: OccasionRule, top: WardrobeItem, bottom?: WardrobeItem): string[] {
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

function generateSmartTitle(occasionKey: string, top: WardrobeItem, bottom?: WardrobeItem): string {
  if (isOnePiece(top)) {
    const sub = normalizeSubcategory(top.subcategory);
    if (occasionKey === 'wedding' || occasionKey === 'festival') return `Festive Heritage ${sub} Ensemble`;
    if (occasionKey === 'party') return `Modern Evening ${sub} Edit`;
    if (occasionKey === 'office') return `Refined Workday ${sub}`;
    if (occasionKey === 'date' || occasionKey === 'dinner') return `Effortless Evening ${sub}`;
    return `Elevated ${sub} Silhouette`;
  }

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
  bottom: WardrobeItem | undefined,
  footwear: WardrobeItem | undefined,
  layer: WardrobeItem | undefined,
  rule: OccasionRule,
  weather?: WeatherData | null,
  personalReasons: string[] = []
): string {
  const topName = top.name;
  const bottomName = bottom?.name || '';
  const footwearStr = footwear ? ` anchored with ${footwear.name.toLowerCase()}` : '';
  const layerStr = layer ? ` structured with the ${layer.name.toLowerCase()}` : '';

  let weatherStr = '';
  if (weather) {
    const locName = weather.city || 'your location';
    const tempStr = `${weather.temperature}°C`;
    const rainProb = weather.rain_probability || 0;
    const cond = (weather.condition || '').toLowerCase();

    if (rainProb >= 40 || cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
      weatherStr = ` Prepared for ${locName}'s rain (${rainProb}%), the cut and darker tones maintain composure against wet streets.`;
    } else if (weather.temperature >= 32) {
      weatherStr = ` In ${locName}'s ${tempStr} warmth with ${weather.humidity}% humidity, this breathable selection maximizes airflow and lightweight comfort.`;
    } else if (weather.temperature <= 19) {
      weatherStr = ` Calibrated for ${locName}'s ${tempStr} cool climate, this silhouette provides comfortable insulation without bulk.`;
    } else {
      weatherStr = ` In ${locName}'s pleasant ${tempStr} conditions, this selection balances breathability with sharp tailoring.`;
    }
  }

  const personalStr =
    personalReasons.length > 0 ? ` Reflecting your personal style preferences, this look ${personalReasons.join(' and ')}.` : '';

  if (!bottom) {
    return `The ${topName}${layerStr}${footwearStr} creates an effortless, poised standalone silhouette perfectly suited for ${rule.name}.${personalStr}${weatherStr}`;
  }

  if (rule.key === 'interview') {
    return `For your interview, the ${topName} paired with ${bottomName}${footwearStr} creates a crisp, boardroom-ready presence with zero casual distractions.${personalStr}${weatherStr}`;
  }

  if (rule.key === 'party') {
    return `The ${topName} gives an intentional, modern evening vibe, paired with ${bottomName}${footwearStr} for a sleek and confident social look.${personalStr}${weatherStr}`;
  }

  if (rule.key === 'wedding' || rule.key === 'festival') {
    return `The ${topName} harmonizes seamlessly with ${bottomName}${footwearStr}, creating a sophisticated celebratory silhouette that respects festive traditions.${personalStr}${weatherStr}`;
  }

  return `The ${topName} provides a balanced focal point against ${bottomName}${layerStr}${footwearStr}, tailored appropriately for ${rule.name}.${personalStr}${weatherStr}`;
}

/**
 * Intelligent Missing-Item Evaluation Engine
 * Returns a suggestion ONLY when an essential or styling gap genuinely exists for the occasion or weather conditions.
 */
export function evaluateMissingItem(
  wardrobe: WardrobeItem[],
  occasionKey: string,
  chosenTop: WardrobeItem,
  chosenBottom?: WardrobeItem,
  weather?: WeatherData | null
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

  // 1. Weather-driven suggestions (Rain, Cool, Extreme UV)
  if (weather) {
    const isRainy = (weather.rain_probability && weather.rain_probability > 40) || 
      /rain|drizzle|shower|thunderstorm|monsoon/i.test(weather.condition || '');

    if (isRainy) {
      const hasRainwear =
        hasSubcategory('layers', ['Rain Jacket', 'Trench Coat', 'Windbreaker']) ||
        hasNameKeyword('rain') ||
        hasNameKeyword('waterproof') ||
        hasNameKeyword('trench');

      if (!hasRainwear) {
        return {
          title: 'Monsoon / Rain Practicality',
          suggested_item: 'Lightweight Water-Resistant Jacket or Trench',
          reason: `With ${weather.rain_probability ?? 'elevated'}% rain probability expected in ${weather.city}, adding a water-resistant layer ensures practical comfort without dampening your aesthetic.`,
          why_it_works: `Drapes effortlessly over your ${chosenTop.name} and protects clean fabrics from moisture and splashes.`,
          category: 'layers',
          priority: 'recommended',
        };
      }
    }

    const isCold = (weather.temperature && weather.temperature < 19) || 
      (weather.feels_like && weather.feels_like < 19);

    if (isCold) {
      const hasLayersOrKnit =
        hasSubcategory('layers', ['Jacket', 'Blazer', 'Sweater', 'Cardigan', 'Overcoat', 'Hoodie', 'Coat']) ||
        hasSubcategory('tops', ['Sweater', 'Sweatshirt', 'Pullover']);

      if (!hasLayersOrKnit) {
        return {
          title: 'Climate Layering Essential',
          suggested_item: 'Fine Merino Knit or Tailored Overlayer',
          reason: `Cooler conditions (${weather.temperature}°C) in ${weather.city} benefit from structured, refined thermal layering.`,
          why_it_works: `Provides warmth without bulk while introducing textural depth over your ${chosenTop.name}.`,
          category: 'layers',
          priority: 'recommended',
        };
      }
    }

    const isHighUV = (weather.uv_index && weather.uv_index >= 8) && (weather.temperature && weather.temperature >= 30);
    if (isHighUV) {
      const hasSunProtection =
        hasSubcategory('accessories', ['Sunglasses', 'Sun Hat']) ||
        hasNameKeyword('sunglasses') ||
        hasNameKeyword('shades');

      if (!hasSunProtection) {
        return {
          title: 'Daylight UV Protection',
          suggested_item: 'UV-Protected Acetate Sunglasses',
          reason: `High UV index (${weather.uv_index}) in ${weather.city} requires essential eye and facial sun protection during daytime outings.`,
          why_it_works: `Adds an instant high-fashion finish to daytime silhouettes while shielding from intense sun glare.`,
          category: 'accessories',
          priority: 'recommended',
        };
      }
    }
  }

  // 2. Occasion-driven wardrobe gap suggestions
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
        why_it_works: `Pairs seamlessly with your ${chosenBottom ? chosenBottom.name : 'evening accessories'} and clean footwear for an instant upgrade.`,
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
        why_it_works: 'Anchors your formal attire with boardroom-level credibility.',
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
        why_it_works: 'Creates a clean visual line across your tailored silhouette.',
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
    userId,
    wardrobe,
    userProfile,
    occasion,
    customOccasionText,
    date,
    time = '19:00',
    location = '',
    weather,
    previousOutfits = [],
    userFeedback = [],
    specialMode = 'standard',
  } = params;

  // Step 1: Filter active, non-archived items
  const activeItems = wardrobe.filter((i) => !i.is_archived);
  if (activeItems.length === 0) {
    throw new Error('No active items found in your wardrobe. Please add your clothes first.');
  }

  // Step 2: Retrieve or Synthesize Occasion Rule (Custom vs Predefined)
  let rule: OccasionRule;
  let customOccasionSaved: string | null = null;
  let interpretedOccasionSaved: string | null = null;

  if (customOccasionText && customOccasionText.trim().length > 0) {
    const customContext = await interpretCustomOccasion(customOccasionText, occasion);
    rule = buildCustomOccasionRule(customContext);
    customOccasionSaved = customOccasionText.trim();
    interpretedOccasionSaved = customContext.interpretedOccasionName;
  } else {
    rule = getOccasionRule(occasion);
  }

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

  const hasOnePieceTops = validTops.some(isOnePiece);
  if (validTops.length === 0 || (validBottoms.length === 0 && !hasOnePieceTops)) {
    throw new Error(`Your wardrobe does not contain appropriate clothing pieces for ${rule.name}. Please add appropriate pieces to your wardrobe.`);
  }

  // Step 3.5: Build Dynamic Learned Personal Style Profile from Feedback History
  const learnedProfile = buildLearnedStyleProfile(userId, userFeedback, previousOutfits, wardrobe);

  // Step 4: Generate Scored Deterministic Candidates with Personal Learning Feedback
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
    specialMode,
    learnedProfile
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

      const weatherContext = weather
        ? `Location: ${weather.city}${weather.state ? `, ${weather.state}` : ''}${weather.country ? `, ${weather.country}` : ''}
- Temperature: ${weather.temperature}°C (Feels like ${weather.feels_like}°C)
- Condition: ${weather.condition}
- Humidity: ${weather.humidity}%
- Rain Probability: ${weather.rain_probability}%
- Wind Speed: ${weather.wind_speed} km/h
- UV Index: ${weather.uv_index}
- Time of Weather: ${weather.is_forecast ? `Forecast for ${weather.forecast_time}` : 'Current live conditions'}`
        : 'Pleasant & mild conditions (approx 26°C)';

      const climateDirectives = weather
        ? [
            (weather.temperature !== undefined && weather.temperature >= 32) ? '• HEAT/SUMMER: Prioritize breathable fabrics (cotton/linen), lighter weaves, and avoid unnecessary heavy layers.' : '',
            ((weather.rain_probability !== undefined && weather.rain_probability > 40) || /rain|drizzle|shower|thunderstorm|monsoon/i.test(weather.condition || '')) ? '• MONSOON/RAIN: Favor practical footwear, avoid easily stained white canvas bottoms or delicate suede. Prefer clean dark tones or ankle-length cuts.' : '',
            (weather.temperature !== undefined && weather.temperature <= 19) ? '• COOL/CHILLY: Incorporate elegant layering, knitwear, or structured jackets if available in the selected pieces.' : '',
            (weather.humidity !== undefined && weather.humidity >= 70) ? '• HIGH HUMIDITY: Favor airy cuts and natural breathable fibers for maximum all-day comfort.' : '',
            (weather.uv_index !== undefined && weather.uv_index >= 8) ? '• HIGH UV: Consider sun-smart styling and daytime eye protection if outdoor.' : '',
          ].filter(Boolean).join('\n')
        : '• Balanced standard styling.';

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
- Weather & Outing Context:
${weatherContext}
${climateDirectives}
- User Profile: Skin Undertone: ${userProfile?.skin_tone || 'Warm Neutral'}, Body Build: ${userProfile?.body_build || 'Proportional'}, Preferred Fit: ${userProfile?.preferred_fit || 'Regular'}.

ALLOWED USER WARDROBE PIECES:
Tops:
${topOptionsForPrompt.map((t) => `- ID: "${t.id}" | Name: "${t.name}" | Color: ${t.primary_color} | Subcategory: ${t.subcategory} | Material: ${t.material} | Fit: ${t.fit || 'Regular'}`).join('\n')}

Bottoms:
${bottomOptionsForPrompt.map((b) => `- ID: "${b.id}" | Name: "${b.name}" | Color: ${b.primary_color} | Subcategory: ${b.subcategory} | Fit: ${b.fit || 'Regular'}`).join('\n')}

Footwear:
${footwearOptionsForPrompt.map((f) => `- ID: "${f.id}" | Name: "${f.name}" | Color: ${f.primary_color} | Subcategory: ${f.subcategory}`).join('\n')}

MANDATORY INSTRUCTIONS:
1. Select the most elegant, occasion-appropriate Top ID, Bottom ID (or null if the Top is a one-piece outfit like Dress, Saree, Jumpsuit, Anarkali), and Footwear ID from the lists above.
2. Ensure the combination respects the local weather (${weather?.city || 'local'}, ${weather?.temperature ?? 28}°C, ${weather?.condition || 'clear'}) while strictly upholding occasion formality.
3. Consider the user's skin undertone (${userProfile?.skin_tone || 'Warm Neutral'}) for color contrast near the face, and body build (${userProfile?.body_build || 'Proportional'}) for balanced visual silhouette proportions.
4. For PARTY, select stylish modern tops/dresses/shirts with clean jeans/chinos/skirts and sleek footwear. NEVER select informal Kurta or Sandals.
5. For INTERVIEW, select formal shirts/blouses, tailored trousers/skirts, and formal shoes. NEVER select sneakers or t-shirts.
6. Return STRICT JSON:
{
  "title": "Editorial title (e.g., Modern Night-Out Styling)",
  "selected_top_id": "EXACT_ID_FROM_TOPS",
  "selected_bottom_id": "EXACT_ID_FROM_BOTTOMS_OR_NULL",
  "selected_footwear_id": "EXACT_ID_FROM_FOOTWEAR",
  "style_direction": ["Modern", "Classy", "Confident"],
  "ai_explanation": "2 concise sentences explaining why this exact combination works beautifully for this real-world occasion, suits the local climate (${weather?.city || 'local'}), and flatters the user's undertone/proportions."
}
`;

      const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
      const modelCandidates = Array.from(
        new Set([
          preferredModel,
          'gemini-3.8-flash',
          'gemini-2.5-flash',
          'gemini-3.5-flash',
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
        ])
      );

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
              const isValidTop = chosenTop && isItemPermittedForOccasion(chosenTop, 'tops', rule);
              const isOnePieceOutfit = chosenTop && isOnePiece(chosenTop);
              const isValidBottom = chosenBottom ? isItemPermittedForOccasion(chosenBottom, 'bottoms', rule) : isOnePieceOutfit;

              if (isValidTop && isValidBottom) {
                finalLook = {
                  ...topCandidate,
                  top: chosenTop,
                  bottom: chosenBottom || (isOnePieceOutfit ? undefined : topCandidate.bottom),
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
  ];
  if (finalLook.bottom) {
    items.push({ wardrobe_item_id: finalLook.bottom.id, role: 'bottom', item: finalLook.bottom });
  }
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
    finalLook.bottom,
    weather
  );

  return {
    occasion,
    custom_occasion_text: customOccasionSaved,
    interpreted_occasion: interpretedOccasionSaved,
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
      c.bottom?.id !== primaryLook.bottom?.id
  );

  if (alt1Candidate) {
    const alt1Items: OutfitItemReference[] = [
      { wardrobe_item_id: alt1Candidate.top.id, role: 'top', item: alt1Candidate.top },
    ];
    if (alt1Candidate.bottom) {
      alt1Items.push({ wardrobe_item_id: alt1Candidate.bottom.id, role: 'bottom', item: alt1Candidate.bottom });
    }
    if (alt1Candidate.footwear) {
      alt1Items.push({ wardrobe_item_id: alt1Candidate.footwear.id, role: 'footwear', item: alt1Candidate.footwear });
    }
    if (alt1Candidate.layer) {
      alt1Items.push({ wardrobe_item_id: alt1Candidate.layer.id, role: 'layer', item: alt1Candidate.layer });
    }

    const pairDesc = alt1Candidate.bottom ? `with ${alt1Candidate.bottom.name}` : `as a standout silhouette`;
    alternatives.push({
      title: rule.key === 'interview' ? 'Look 02 — Classic Formal Alternative' : 'Look 02 — Subtle Shift',
      badge: rule.key === 'interview' ? 'Formal' : 'Refined',
      description: `Rotate into the ${alt1Candidate.top.name} ${pairDesc} for a distinctive, equally polished aesthetic.`,
      items: alt1Items,
    });
  }

  // Find third distinct candidate
  const alt2Candidate = rankedCandidates.find(
    (c) =>
      c.top.id !== primaryLook.top.id &&
      (alt1Candidate ? c.top.id !== alt1Candidate.top.id : true) &&
      (alt1Candidate ? c.bottom?.id !== alt1Candidate.bottom?.id : true)
  ) || rankedCandidates.find((c) => c.fingerprint !== primaryLook.fingerprint && (alt1Candidate ? c.fingerprint !== alt1Candidate.fingerprint : true));

  if (alt2Candidate) {
    const alt2Items: OutfitItemReference[] = [
      { wardrobe_item_id: alt2Candidate.top.id, role: 'top', item: alt2Candidate.top },
    ];
    if (alt2Candidate.bottom) {
      alt2Items.push({ wardrobe_item_id: alt2Candidate.bottom.id, role: 'bottom', item: alt2Candidate.bottom });
    }
    if (alt2Candidate.footwear) {
      alt2Items.push({ wardrobe_item_id: alt2Candidate.footwear.id, role: 'footwear', item: alt2Candidate.footwear });
    }
    if (alt2Candidate.layer) {
      alt2Items.push({ wardrobe_item_id: alt2Candidate.layer.id, role: 'layer', item: alt2Candidate.layer });
    }

    const pairDesc2 = alt2Candidate.bottom ? `against ${alt2Candidate.bottom.name}` : `in a refined standalone silhouette`;
    alternatives.push({
      title: rule.key === 'interview' ? 'Look 03 — Tailored Contrast' : 'Look 03 — Structured Presence',
      badge: 'Tailored',
      description: `Pairing the ${alt2Candidate.top.name} ${pairDesc2} provides clean tonal definition while remaining 100% occasion-compliant.`,
      items: alt2Items,
    });
  }

  return alternatives;
}


