import {
  Outfit,
  WardrobeItem,
  OutfitFeedback,
  LearnedStyleProfile,
  PreferenceSignal,
  ItemPerformanceStats,
  OccasionStylePreference,
} from '@/lib/types';
import { normalizeSubcategory } from '@/lib/ai/occasionRules';

/**
 * Convert qualitative or numerical ratings to standard 1.0 - 5.0 scale
 */
export function normalizeRatingValue(rating: string | number): number {
  if (typeof rating === 'number') {
    return Math.max(1, Math.min(5, rating));
  }
  const str = String(rating).toLowerCase().trim();
  if (str.includes('loved') || str.includes('5') || str.includes('excellent')) return 5;
  if (str.includes('good') || str.includes('4') || str.includes('liked')) return 4;
  if (str.includes('average') || str.includes('3') || str.includes('okay') || str.includes('neutral')) return 3;
  if (str.includes("didn't") || str.includes('dislike') || str.includes('2') || str.includes('poor')) return 2;
  if (str.includes('hate') || str.includes('1') || str.includes('terrible')) return 1;
  return 3;
}

/**
 * Calculate age-based recency decay (1.0 for recent, decaying gracefully to 0.45 for older)
 */
function getRecencyWeight(dateStr: string): number {
  try {
    const feedbackTime = new Date(dateStr).getTime();
    if (isNaN(feedbackTime)) return 0.8;
    const now = Date.now();
    const ageDays = Math.max(0, (now - feedbackTime) / (1000 * 60 * 60 * 24));
    // 0-14 days: 1.0; 15-45 days: 0.85; 46-90 days: 0.7; 90+ days: 0.45
    return Math.max(0.45, 1.0 - Math.min(0.55, (ageDays / 90) * 0.55));
  } catch {
    return 0.8;
  }
}

/**
 * Calculate statistical confidence from evidence count and consistency
 */
function calculateSignalConfidence(
  evidenceCount: number,
  positiveCount: number,
  negativeCount: number
): { confidence: number; strength: 'weak' | 'emerging' | 'strong' } {
  if (evidenceCount <= 0) {
    return { confidence: 0, strength: 'weak' };
  }

  // Sample size confidence curve: 1 item -> ~0.25, 3 items -> ~0.50, 6 items -> ~0.67, 12+ items -> ~0.80-0.95
  const sampleConfidence = evidenceCount / (evidenceCount + 3.0);

  // Consistency check: are signals harmonious or divided?
  const dominantCount = Math.max(positiveCount, negativeCount);
  const consistency = dominantCount / evidenceCount; // 0.5 (split) to 1.0 (unanimous)
  const consistencyMultiplier = 0.5 + 0.5 * consistency;

  const confidence = Math.min(1.0, Number((sampleConfidence * consistencyMultiplier).toFixed(2)));

  let strength: 'weak' | 'emerging' | 'strong' = 'weak';
  if (evidenceCount >= 7 && confidence >= 0.65) {
    strength = 'strong';
  } else if (evidenceCount >= 3 && confidence >= 0.4) {
    strength = 'emerging';
  }

  return { confidence, strength };
}

/**
 * Helper to update or initialize a PreferenceSignal
 */
function updateSignal(
  map: { [key: string]: PreferenceSignal },
  type: PreferenceSignal['attributeType'],
  rawKey: string,
  normalizedScore: number, // -1.0 to +1.0
  recencyWeight: number,
  dateStr: string
) {
  if (!rawKey) return;
  const key = rawKey.trim().toLowerCase();
  if (!key) return;

  const existing = map[key] || {
    attributeType: type,
    attributeValue: rawKey.trim(),
    score: 0,
    confidence: 0,
    evidenceCount: 0,
    positiveCount: 0,
    negativeCount: 0,
    recencyWeightedScore: 0,
    signalStrength: 'weak',
    lastObservedAt: dateStr,
  };

  existing.evidenceCount += 1;
  if (normalizedScore > 0.15) {
    existing.positiveCount += 1;
  } else if (normalizedScore < -0.15) {
    existing.negativeCount += 1;
  }

  // Update rolling score with recency
  const currentTotalWeight = existing.evidenceCount;
  existing.score = Number(((existing.score * (currentTotalWeight - 1) + normalizedScore) / currentTotalWeight).toFixed(2));
  existing.recencyWeightedScore = Number(
    ((existing.recencyWeightedScore * (currentTotalWeight - 1) + normalizedScore * recencyWeight) / currentTotalWeight).toFixed(2)
  );

  const { confidence, strength } = calculateSignalConfidence(
    existing.evidenceCount,
    existing.positiveCount,
    existing.negativeCount
  );
  existing.confidence = confidence;
  existing.signalStrength = strength;
  existing.lastObservedAt = dateStr;

  map[key] = existing;
}

/**
 * Build the complete Learned Style Profile from past feedback, outfits, and wardrobe
 */
export function buildLearnedStyleProfile(
  userId: string,
  feedbacks: OutfitFeedback[] = [],
  outfits: Outfit[] = [],
  wardrobe: WardrobeItem[] = []
): LearnedStyleProfile {
  const outfitMap = new Map<string, Outfit>();
  outfits.forEach((o) => outfitMap.set(o.id, o));

  const wardrobeMap = new Map<string, WardrobeItem>();
  wardrobe.forEach((w) => wardrobeMap.set(w.id, w));

  const itemStats: { [itemId: string]: ItemPerformanceStats } = {};
  const colorPreferences: { [color: string]: PreferenceSignal } = {};
  const fitPreferences: { [fit: string]: PreferenceSignal } = {};
  const stylePreferences: { [style: string]: PreferenceSignal } = {};
  const footwearPreferences: { [footwear: string]: PreferenceSignal } = {};
  const patternPreferences: { [pattern: string]: PreferenceSignal } = {};
  const formalityPreferences: { [formality: string]: PreferenceSignal } = {};
  const occasionPreferences: { [occasion: string]: OccasionStylePreference } = {};
  const combinationScores: { [fingerprint: string]: { score: number; evidence: number } } = {};

  let totalRatingSum = 0;
  let totalFeedbacksCount = 0;

  // Process each feedback event
  for (const fb of feedbacks) {
    if (fb.user_id && fb.user_id !== userId) continue; // Multi-user isolation security

    const ratingVal = normalizeRatingValue(fb.rating);
    totalRatingSum += ratingVal;
    totalFeedbacksCount += 1;

    // Normalized delta: 5 -> +1.0, 4 -> +0.5, 3 -> 0.0, 2 -> -0.6, 1 -> -1.0
    let baseDelta = (ratingVal - 3) / 2; // -1.0 to +1.0
    if (ratingVal === 2) baseDelta = -0.6; // Slightly more pronounced for dislike
    if (ratingVal === 4) baseDelta = 0.5;

    const recencyWeight = getRecencyWeight(fb.created_at);
    const tags = (fb.feedback_tags || []).map((t) => t.toLowerCase());
    const comment = (fb.comment || '').toLowerCase();

    // Find outfit associated with this feedback
    const outfit = outfitMap.get(fb.outfit_id);
    if (!outfit) continue;

    const occasionKey = (outfit.occasion || 'casual').toLowerCase();
    if (!occasionPreferences[occasionKey]) {
      occasionPreferences[occasionKey] = {
        occasion: outfit.occasion,
        preferredFits: {},
        preferredFootwear: {},
        preferredStyles: {},
        preferredColors: {},
      };
    }
    const occPref = occasionPreferences[occasionKey];

    // Identify constituent wardrobe items
    const outfitItems: WardrobeItem[] = [];
    let topItem: WardrobeItem | undefined;
    let bottomItem: WardrobeItem | undefined;
    let footwearItem: WardrobeItem | undefined;

    for (const ref of outfit.items) {
      const item = ref.item || wardrobeMap.get(ref.wardrobe_item_id);
      if (item) {
        outfitItems.push(item);
        if (ref.role === 'top' || item.category === 'tops') topItem = item;
        if (ref.role === 'bottom' || item.category === 'bottoms') bottomItem = item;
        if (ref.role === 'footwear' || item.category === 'footwear') footwearItem = item;
      }
    }

    // Combination Fingerprint tracking
    if (topItem && bottomItem) {
      const comboKey = `${topItem.id}::${bottomItem.id}::${footwearItem?.id || 'none'}`;
      let comboDelta = baseDelta;
      if (tags.some((t) => t.includes('combination') || t.includes('didn’t like the combination'))) {
        comboDelta = -0.9;
      }
      const existingCombo = combinationScores[comboKey] || { score: 0, evidence: 0 };
      existingCombo.evidence += 1;
      existingCombo.score = (existingCombo.score * (existingCombo.evidence - 1) + comboDelta) / existingCombo.evidence;
      combinationScores[comboKey] = existingCombo;
    }

    // Process item-level stats & attribute-level signals
    for (const item of outfitItems) {
      // 1. Item Stats
      if (!itemStats[item.id]) {
        itemStats[item.id] = {
          itemId: item.id,
          timesRecommended: 1,
          timesWorn: item.times_worn || 0,
          ratings: [],
          averageRating: 0,
          positiveCount: 0,
          negativeCount: 0,
          lastRatingAt: fb.created_at,
        };
      }
      const stats = itemStats[item.id];
      stats.ratings.push(ratingVal);
      stats.averageRating = Number((stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(2));
      if (ratingVal >= 4) stats.positiveCount += 1;
      if (ratingVal <= 2) stats.negativeCount += 1;
      stats.lastRatingAt = fb.created_at;

      // 2. Specific Semantic Tag Adjustments
      let colorDelta = baseDelta;
      let fitDelta = baseDelta;
      let styleDelta = baseDelta;
      let footwearDelta = baseDelta;

      if (tags.some((t) => t.includes('color') && (t.includes('love') || t.includes('great')))) {
        colorDelta = Math.max(colorDelta, 0.85);
      }
      if (tags.some((t) => t.includes('color') && (t.includes("don't") || t.includes("didn't")))) {
        colorDelta = Math.min(colorDelta, -0.85);
      }
      if (tags.some((t) => t.includes('comfortable') || t.includes('fit') && t.includes('love'))) {
        fitDelta = Math.max(fitDelta, 0.8);
      }
      if (tags.some((t) => t.includes('fit') && (t.includes("didn't") || t.includes('bad') || t.includes('tight') || t.includes('loose')))) {
        fitDelta = Math.min(fitDelta, -0.85);
      }
      if (tags.some((t) => t.includes('sharp') || t.includes('confident'))) {
        styleDelta = Math.max(styleDelta, 0.8);
      }

      // Comment parsing keywords
      if (comment.includes('love shirt') && item.category === 'tops') colorDelta = 0.9;
      if (comment.includes('trousers') && comment.includes('bad') && item.category === 'bottoms') fitDelta = -0.9;

      // Update Global Signals
      if (item.primary_color) {
        updateSignal(colorPreferences, 'color', item.primary_color, colorDelta, recencyWeight, fb.created_at);
        updateSignal(occPref.preferredColors, 'color', item.primary_color, colorDelta, recencyWeight, fb.created_at);
      }
      if (item.fit) {
        updateSignal(fitPreferences, 'fit', item.fit, fitDelta, recencyWeight, fb.created_at);
        updateSignal(occPref.preferredFits, 'fit', item.fit, fitDelta, recencyWeight, fb.created_at);
      }
      if (item.style) {
        updateSignal(stylePreferences, 'style', item.style, styleDelta, recencyWeight, fb.created_at);
        updateSignal(occPref.preferredStyles, 'style', item.style, styleDelta, recencyWeight, fb.created_at);
      }
      if (item.pattern) {
        updateSignal(patternPreferences, 'pattern', item.pattern, baseDelta, recencyWeight, fb.created_at);
      }
      if (item.formality) {
        updateSignal(formalityPreferences, 'formality', item.formality, baseDelta, recencyWeight, fb.created_at);
      }
      if (item.category === 'footwear') {
        const normFoot = normalizeSubcategory(item.subcategory);
        updateSignal(footwearPreferences, 'footwear', normFoot, footwearDelta, recencyWeight, fb.created_at);
        updateSignal(occPref.preferredFootwear, 'footwear', normFoot, footwearDelta, recencyWeight, fb.created_at);
      }
    }
  }

  // Synthesize Stylist Observations for the user
  const observations: string[] = [];
  const strongFits = Object.values(fitPreferences).filter((f) => f.signalStrength === 'strong' && f.score > 0.4);
  const strongColors = Object.values(colorPreferences).filter((c) => c.signalStrength === 'strong' && c.score > 0.4);
  const strongFootwear = Object.values(footwearPreferences).filter((fw) => fw.signalStrength === 'strong' && fw.score > 0.4);

  if (strongFits.length > 0) {
    observations.push(`You consistently rate ${strongFits.map((f) => f.attributeValue).join(' and ')} fits highly for daily confidence.`);
  }
  if (strongColors.length > 0) {
    observations.push(`Your highest-rated looks frequently feature ${strongColors.map((c) => c.attributeValue).join(', ')} palettes.`);
  }
  if (strongFootwear.length > 0) {
    observations.push(`You prefer ${strongFootwear.map((fw) => fw.attributeValue).join(' and ')} anchoring your social and casual ensembles.`);
  }

  return {
    userId,
    totalFeedbacks: totalFeedbacksCount,
    averageRating: totalFeedbacksCount > 0 ? Number((totalRatingSum / totalFeedbacksCount).toFixed(2)) : 0,
    itemStats,
    colorPreferences,
    fitPreferences,
    stylePreferences,
    footwearPreferences,
    patternPreferences,
    formalityPreferences,
    occasionPreferences,
    combinationScores,
    stylistObservations: observations,
  };
}

/**
 * Score a Candidate Outfit against the user's Learned Style Profile
 * Returns score modifier (+/- 35 max) and stylistic rationale
 */
export function calculateFeedbackScore(
  candidate: {
    top: WardrobeItem;
    bottom: WardrobeItem;
    footwear?: WardrobeItem;
    layer?: WardrobeItem;
    accessories?: WardrobeItem[];
  },
  occasionKey: string,
  profile: LearnedStyleProfile
): { score: number; reasons: string[] } {
  if (!profile || profile.totalFeedbacks === 0) {
    return { score: 0, reasons: [] };
  }

  let feedbackScore = 0;
  const reasons: string[] = [];
  const occPref = profile.occasionPreferences[occasionKey.toLowerCase()];

  // 1. Item-Level Specific Performance (+/- 12 max)
  const topStats = profile.itemStats[candidate.top.id];
  if (topStats && topStats.ratings.length >= 2) {
    if (topStats.averageRating >= 4.3) {
      feedbackScore += 8;
    } else if (topStats.averageRating <= 2.3) {
      feedbackScore -= 10;
    }
  }

  const bottomStats = profile.itemStats[candidate.bottom.id];
  if (bottomStats && bottomStats.ratings.length >= 2) {
    if (bottomStats.averageRating >= 4.3) {
      feedbackScore += 7;
    } else if (bottomStats.averageRating <= 2.3) {
      feedbackScore -= 9;
    }
  }

  if (candidate.footwear) {
    const footStats = profile.itemStats[candidate.footwear.id];
    if (footStats && footStats.ratings.length >= 2) {
      if (footStats.averageRating >= 4.3) {
        feedbackScore += 6;
      } else if (footStats.averageRating <= 2.3) {
        feedbackScore -= 8;
      }
    }
  }

  // 2. Learned Fit Affinity (+/- 10 max)
  const topFit = (candidate.top.fit || '').trim().toLowerCase();
  const bottomFit = (candidate.bottom.fit || '').trim().toLowerCase();

  const learnedTopFit = profile.fitPreferences[topFit];
  if (learnedTopFit && learnedTopFit.confidence >= 0.3) {
    const delta = Math.round(learnedTopFit.recencyWeightedScore * learnedTopFit.confidence * 6);
    feedbackScore += delta;
    if (delta >= 3 && learnedTopFit.signalStrength !== 'weak') {
      reasons.push(`incorporates your preferred ${candidate.top.fit} silhouette`);
    }
  }

  const learnedBottomFit = profile.fitPreferences[bottomFit];
  if (learnedBottomFit && learnedBottomFit.confidence >= 0.3) {
    const delta = Math.round(learnedBottomFit.recencyWeightedScore * learnedBottomFit.confidence * 6);
    feedbackScore += delta;
  }

  // 3. Learned Color Affinity (+/- 10 max)
  const topColor = candidate.top.primary_color.trim().toLowerCase();
  const bottomColor = candidate.bottom.primary_color.trim().toLowerCase();

  const learnedTopColor = profile.colorPreferences[topColor];
  if (learnedTopColor && learnedTopColor.confidence >= 0.3) {
    const delta = Math.round(learnedTopColor.recencyWeightedScore * learnedTopColor.confidence * 6);
    feedbackScore += delta;
    if (delta >= 3 && learnedTopColor.signalStrength !== 'weak') {
      reasons.push(`features highly-rated ${candidate.top.primary_color} tones`);
    }
  }

  const learnedBottomColor = profile.colorPreferences[bottomColor];
  if (learnedBottomColor && learnedBottomColor.confidence >= 0.3) {
    const delta = Math.round(learnedBottomColor.recencyWeightedScore * learnedBottomColor.confidence * 5);
    feedbackScore += delta;
  }

  // 4. Learned Footwear Affinity (+/- 8 max)
  if (candidate.footwear) {
    const normFoot = normalizeSubcategory(candidate.footwear.subcategory).toLowerCase();
    const learnedFoot = profile.footwearPreferences[normFoot];
    if (learnedFoot && learnedFoot.confidence >= 0.3) {
      const delta = Math.round(learnedFoot.recencyWeightedScore * learnedFoot.confidence * 7);
      feedbackScore += delta;
    }
  }

  // 5. Occasion-Specific Preferences (+/- 10 max)
  if (occPref) {
    if (topFit && occPref.preferredFits[topFit]) {
      const occFitSig = occPref.preferredFits[topFit];
      feedbackScore += Math.round(occFitSig.recencyWeightedScore * occFitSig.confidence * 5);
    }
    if (candidate.footwear) {
      const normFoot = normalizeSubcategory(candidate.footwear.subcategory).toLowerCase();
      if (occPref.preferredFootwear[normFoot]) {
        const occFootSig = occPref.preferredFootwear[normFoot];
        feedbackScore += Math.round(occFootSig.recencyWeightedScore * occFootSig.confidence * 6);
      }
    }
  }

  // 6. Combination Rating Penalty / Boost (+/- 12 max)
  const comboKey = `${candidate.top.id}::${candidate.bottom.id}::${candidate.footwear?.id || 'none'}`;
  const comboRecord = profile.combinationScores[comboKey];
  if (comboRecord && comboRecord.evidence >= 1) {
    if (comboRecord.score > 0.4) {
      feedbackScore += 6;
    } else if (comboRecord.score < -0.4) {
      feedbackScore -= 15; // Strongly avoid combinations user explicitly disliked
    }
  }

  // Clamp total feedback score adjustment between -35 and +30
  const clampedScore = Math.max(-35, Math.min(30, feedbackScore));
  return { score: clampedScore, reasons };
}
