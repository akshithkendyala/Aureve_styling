import {
  CollectionSlug,
  MainCategory,
  Outfit,
  OutfitItemReference,
  RecommendedMissingItem,
  SuggestedCombination,
  UserProfile,
  WardrobeItem,
  WeatherData,
} from '@/lib/types';
import { OccasionRule, normalizeSubcategory } from '@/lib/ai/occasionRules';

export interface PartialWardrobeStylingResult {
  wardrobe_completeness: 'partial' | 'single_item';
  title: string;
  ai_explanation: string;
  style_match: number;
  style_direction: string[];
  owned_items: OutfitItemReference[];
  recommended_missing_items: RecommendedMissingItem[];
  suggested_combinations: SuggestedCombination[];
  conflict_note?: string | null;
}

/**
 * Intelligent Conflict Detection between Collection and Occasion
 */
export function checkCollectionOccasionConflict(
  collectionSlugOrName?: string | null,
  occasionKey?: string
): string | null {
  if (!collectionSlugOrName || !occasionKey) return null;
  const col = collectionSlugOrName.toLowerCase();
  const occ = occasionKey.toLowerCase();

  // Home & Comfort conflicts with formal, celebratory, or active environments
  if (col.includes('home') || col.includes('comfort')) {
    if (['interview', 'office', 'wedding', 'party', 'dinner', 'date', 'festival'].includes(occ)) {
      return `Stylist Insight: You selected the "Home & Comfort" collection for a ${occasionKey} setting. Loungewear and relaxed home pieces are generally unsuitable for formal or celebratory dress codes. We recommend switching to the "College & Work" or "Party & Occasions" collection for optimal polish.`;
    }
  }

  // Traditional & Festive conflicts with Gym or strict Western Corporate
  if (col.includes('traditional') || col.includes('festive')) {
    if (occ === 'gym') {
      return `Stylist Insight: "Traditional & Festive" attire is not safe or practical for athletic workouts. We recommend selecting athletic pieces from your everyday wardrobe.`;
    }
    if (occ === 'interview') {
      return `Stylist Note: While ethnic wear can be refined, most corporate interviews require formal Western shirts and trousers. Ensure your selected outfit aligns with your industry's standards.`;
    }
  }

  // Party conflicts with Gym or Boardroom Interview
  if (col.includes('party') || col.includes('occasions')) {
    if (['gym', 'interview'].includes(occ)) {
      return `Stylist Insight: Partywear aesthetics (bold prints, satin weaves, evening fits) conflict with ${occasionKey} expectations. Consider structured professional or activewear pieces.`;
    }
  }

  return null;
}

/**
 * Expert Stylist Partial Wardrobe Reasoning Engine
 * Delivers deep, culturally grounded Indian fashion consulting when the user's wardrobe has
 * single items or incomplete categories, without fabricating wardrobe records or displaying broken outfits.
 */
export async function generatePartialWardrobeStyling(params: {
  wardrobe: WardrobeItem[];
  rule: OccasionRule;
  collectionName?: string | null;
  collectionSlug?: string | null;
  userProfile?: UserProfile | null;
  weather?: WeatherData | null;
  geminiApiKey?: string;
}): Promise<PartialWardrobeStylingResult> {
  const { wardrobe, rule, collectionName, collectionSlug, userProfile, weather, geminiApiKey } = params;

  const activeItems = wardrobe.filter((i) => !i.is_archived);
  const tops = activeItems.filter((i) => i.category === 'tops');
  const bottoms = activeItems.filter((i) => i.category === 'bottoms');
  const footwear = activeItems.filter((i) => i.category === 'footwear');
  const layers = activeItems.filter((i) => i.category === 'layers');
  const accessories = activeItems.filter((i) => i.category === 'accessories');

  const conflictNote = checkCollectionOccasionConflict(collectionSlug || collectionName, rule.key);

  const isMale = userProfile?.gender?.toLowerCase().includes('male') && !userProfile?.gender?.toLowerCase().includes('fe');
  const isFemale = userProfile?.gender?.toLowerCase().includes('female');

  // Determine what the user owns
  const hasTops = tops.length > 0;
  const hasBottoms = bottoms.length > 0;
  const hasFootwear = footwear.length > 0;

  // Select the focal anchor piece(s) from user's actual items
  let anchorTop: WardrobeItem | null = null;
  let anchorBottom: WardrobeItem | null = null;
  let anchorFootwear: WardrobeItem | null = null;

  if (hasTops) {
    // Pick the most occasion/collection-appropriate top
    anchorTop =
      tops.find((t) => {
        const sub = normalizeSubcategory(t.subcategory).toLowerCase();
        if (rule.key === 'interview') return sub.includes('shirt') || sub.includes('blouse');
        if (rule.key === 'party') return (t.material || '').includes('satin') || t.primary_color.toLowerCase() === 'black' || sub.includes('shirt') || sub.includes('dress');
        if (rule.key === 'festival' || rule.key === 'wedding') return sub.includes('kurta') || sub.includes('kurti') || sub.includes('saree');
        return true;
      }) || tops[0];
  }

  if (hasBottoms) {
    anchorBottom =
      bottoms.find((b) => {
        const sub = normalizeSubcategory(b.subcategory).toLowerCase();
        if (rule.key === 'interview') return sub.includes('trouser') || sub.includes('chino') || sub.includes('formal');
        if (rule.key === 'college') return sub.includes('chino') || sub.includes('jean') || sub.includes('trouser');
        return true;
      }) || bottoms[0];
  }

  if (hasFootwear) {
    anchorFootwear = footwear[0];
  }

  const ownedItemRefs: OutfitItemReference[] = [];
  if (anchorTop) {
    ownedItemRefs.push({ wardrobe_item_id: anchorTop.id, role: 'top', item: anchorTop });
  }
  if (anchorBottom) {
    ownedItemRefs.push({ wardrobe_item_id: anchorBottom.id, role: 'bottom', item: anchorBottom });
  }
  if (anchorFootwear) {
    ownedItemRefs.push({ wardrobe_item_id: anchorFootwear.id, role: 'footwear', item: anchorFootwear });
  }

  // Synthesize intelligent missing-item recommendations tailored to the anchor item
  const recommendedItems: RecommendedMissingItem[] = [];
  const suggestedCombinations: SuggestedCombination[] = [];

  const anchorPieceName = anchorTop?.name || anchorBottom?.name || 'your piece';
  const anchorColor = (anchorTop?.primary_color || anchorBottom?.primary_color || 'Neutral').toLowerCase();

  // SCENARIO A: Only Tops Available (Bottoms and Footwear missing)
  if (hasTops && !hasBottoms) {
    const isTraditional =
      anchorTop &&
      (normalizeSubcategory(anchorTop.subcategory).toLowerCase().includes('kurta') ||
        normalizeSubcategory(anchorTop.subcategory).toLowerCase().includes('kurti') ||
        anchorTop.name.toLowerCase().includes('kurta'));

    if (isTraditional) {
      if (isFemale) {
        recommendedItems.push({
          name: 'Off-White or Cream Straight-Cut Palazzo',
          category: 'bottoms',
          reason: `Provides an airy, graceful drape that enhances the length and festive elegance of ${anchorTop?.name}.`,
          why_it_works: 'Off-white bottoms serve as a neutral anchor for vibrant or pastel Indian ethnic kurtis.',
          priority: 'essential',
          color_suggestion: 'Off-White / Cream',
          fabric_suggestion: 'Cotton-Linen or Chanderi Silk Blend',
        });
        recommendedItems.push({
          name: 'Traditional Mojaris or Embellished Juttis',
          category: 'footwear',
          reason: 'Completes the traditional Indian aesthetic with authentic artisanal craftsmanship.',
          why_it_works: 'Flat leather juttis offer all-day cultural comfort for festive celebrations and family functions.',
          priority: 'essential',
          color_suggestion: 'Gold or Tan Leather',
        });
        recommendedItems.push({
          name: 'Matching Chiffon or Silk Dupatta',
          category: 'accessories',
          reason: 'Adds fluid movement, modest framing, and elevated traditional sophistication.',
          why_it_works: 'Draped over the shoulder to balance the ethnic silhouette.',
          priority: 'recommended',
        });
      } else {
        recommendedItems.push({
          name: 'White or Off-White Cotton Churidar / Pajama',
          category: 'bottoms',
          reason: `The timeless, classic companion to ${anchorTop?.name} for cultural functions and festivals.`,
          why_it_works: 'A crisp tapered white pajama creates a refined, proportioned ethnic silhouette without breaking formality.',
          priority: 'essential',
          color_suggestion: 'Crisp White or Raw Silk Cream',
          fabric_suggestion: 'Breathable Pure Cotton',
        });
        recommendedItems.push({
          name: 'Handcrafted Leather Juttis or Kolhapuri Sandals',
          category: 'footwear',
          reason: 'Elevates your traditional festive look with authentic Indian heritage craftsmanship.',
          why_it_works: 'Brings textured richness that western sneakers or loafers cannot match in ethnic settings.',
          priority: 'essential',
          color_suggestion: 'Tan Leather / Deep Brown',
        });
        recommendedItems.push({
          name: 'Silk or Jacquard Nehru Jacket',
          category: 'layers',
          reason: 'Instantly adds royal structure and wedding-ready presence over a solid kurta.',
          why_it_works: 'Brings chest structure and rich texture, transforming casual ethnic into celebratory formalwear.',
          priority: 'recommended',
          color_suggestion: 'Champagne Gold, Olive, or Deep Navy',
        });
      }
    } else {
      // Modern / Western / Smart Casual Top
      const isBlackOrDark = ['black', 'charcoal', 'navy', 'dark indigo'].some((c) => anchorColor.includes(c));

      recommendedItems.push({
        name: 'Beige Straight-Fit Chinos / Trousers',
        category: 'bottoms',
        reason: isBlackOrDark
          ? `Creates a crisp, high-contrast smart-casual balance with your ${anchorTop?.name}.`
          : `A versatile neutral base that lets your ${anchorTop?.name} remain the visual focal point.`,
        why_it_works: 'Straight-leg beige trousers are universally flattering, modern, and bridge campus daily wear with office meetings.',
        priority: 'essential',
        color_suggestion: 'Warm Beige / Khaki',
        fabric_suggestion: 'Stretch Cotton Twill',
      });

      recommendedItems.push({
        name: 'Dark Blue Straight-Fit Denim Jeans',
        category: 'bottoms',
        reason: 'The ultimate dependable daily workhorse for college, weekend outings, and casual evening meetups.',
        why_it_works: 'Dark wash indigo jeans maintain clean lines without looking overly informal or distressed.',
        priority: 'recommended',
        color_suggestion: 'Dark Indigo / Clean Raw Denim',
        fabric_suggestion: '100% Cotton Denim',
      });

      recommendedItems.push({
        name: 'White Minimal Low-Top Sneakers',
        category: 'footwear',
        reason: 'Instantly injects modern, youthful polish while ensuring high walking comfort.',
        why_it_works: 'Clean white court sneakers complement virtually all trouser shades and anchor the silhouette.',
        priority: 'essential',
        color_suggestion: 'Clean White',
        fabric_suggestion: 'Smooth Leather / Vegan Leather',
      });

      recommendedItems.push({
        name: 'Dark Brown or Black Leather Loafers',
        category: 'footwear',
        reason: 'Upgrades the entire ensemble into a poised semi-formal or dinner-ready statement.',
        why_it_works: 'Gives slip-on ease and refined silhouette definition without needing rigid oxford shoes.',
        priority: 'recommended',
        color_suggestion: 'Espresso Brown or Rich Black',
      });

      recommendedItems.push({
        name: 'Minimalist Steel or Leather-Strap Watch',
        category: 'accessories',
        reason: 'Subtly signifies attention to detail and personal grooming.',
        why_it_works: 'Adds a refined metal/leather accent on the wrist to complete an intentional outfit.',
        priority: 'recommended',
      });
    }

    // Generate suggested combinations
    suggestedCombinations.push({
      name: 'Modern Smart Casual Edit',
      combination: [
        `${anchorTop?.name} (In your wardrobe)`,
        'Beige Straight-Fit Chinos',
        'White Minimal Low-Top Sneakers',
        'Minimalist Leather Watch',
      ],
      styling_tip: 'Tuck in slightly or wear untucked with the sleeves rolled once for an effortless, confident Indian campus/office aesthetic.',
    });

    suggestedCombinations.push({
      name: 'Relaxed Weekend & Outing Stride',
      combination: [
        `${anchorTop?.name} (In your wardrobe)`,
        'Dark Blue Straight-Fit Jeans',
        'White Minimal Sneakers',
      ],
      styling_tip: 'Pair with clean denim and minimal white footwear for a balanced, low-effort high-impact combination.',
    });
  }

  // SCENARIO B: Only Bottoms Available (Tops and Footwear missing)
  else if (!hasTops && hasBottoms) {
    recommendedItems.push({
      name: 'Crisp White Oxford Cotton Shirt',
      category: 'tops',
      reason: `Serves as the pinnacle versatile top to pair with your ${anchorBottom?.name}.`,
      why_it_works: 'Bright white near the face highlights natural Indian skin undertones and provides sharp contrast with any bottom.',
      priority: 'essential',
      color_suggestion: 'Bright White or Off-White',
      fabric_suggestion: '100% Oxford Weave Cotton',
    });

    recommendedItems.push({
      name: 'Navy Blue or Black Polo T-Shirt',
      category: 'tops',
      reason: 'Elevates everyday casual into smart-casual with structured collar definition.',
      why_it_works: 'The structured polo collar frames the jawline while remaining breathable in Indian climate.',
      priority: 'recommended',
      color_suggestion: 'Deep Navy or Obsidian Black',
      fabric_suggestion: 'Pique Cotton',
    });

    recommendedItems.push({
      name: 'White Minimal Low-Top Sneakers',
      category: 'footwear',
      reason: 'Brings modern Gen-Z / millennial street-smart polish to your trouser silhouette.',
      why_it_works: 'Clean white footwear keeps the eye moving naturally down the outfit without visual clutter.',
      priority: 'essential',
      color_suggestion: 'White',
    });

    suggestedCombinations.push({
      name: 'Polished Everyday Uniform',
      combination: [
        'Crisp White Oxford Shirt',
        `${anchorBottom?.name} (In your wardrobe)`,
        'White Minimal Low-Top Sneakers',
      ],
      styling_tip: 'A crisp white top paired with your bottoms delivers timeless style that never fails across college or meetings.',
    });
  }

  // SCENARIO C: Top and Bottom Available, Footwear missing
  else if (hasTops && hasBottoms && !hasFootwear) {
    const isFestive = rule.key === 'festival' || rule.key === 'wedding';
    const isFormal = rule.key === 'interview' || rule.key === 'office';

    if (isFestive) {
      recommendedItems.push({
        name: 'Handcrafted Tan Leather Juttis / Mojaris',
        category: 'footwear',
        reason: `Harmonizes with your ${anchorTop?.name} and ${anchorBottom?.name} for cultural events.`,
        why_it_works: 'Adds authentic ethnic ground support that sneakers cannot provide.',
        priority: 'essential',
        color_suggestion: 'Tan / Camel Leather',
      });
    } else if (isFormal) {
      recommendedItems.push({
        name: 'Dark Brown or Black Formal Leather Shoes / Loafers',
        category: 'footwear',
        reason: `Anchors the formal posture of ${anchorTop?.name} and ${anchorBottom?.name}.`,
        why_it_works: 'Maintains boardroom professionalism and sharp lines.',
        priority: 'essential',
        color_suggestion: 'Dark Brown or Black',
      });
    } else {
      recommendedItems.push({
        name: 'White Minimal Low-Top Leather Sneakers',
        category: 'footwear',
        reason: `Ties together your ${anchorTop?.name} and ${anchorBottom?.name} with modern urban ease.`,
        why_it_works: 'Clean white sneakers bridge casual and smart-casual across all Indian metropolitan settings.',
        priority: 'essential',
        color_suggestion: 'Minimal White',
      });
      recommendedItems.push({
        name: 'Sleek Black or Tan Suede Loafers',
        category: 'footwear',
        reason: 'Offers an elevated slip-on alternative for dinners, dates, and semi-formal occasions.',
        why_it_works: 'Adds rich textural depth without being as rigid as dress shoes.',
        priority: 'recommended',
        color_suggestion: 'Tan Suede or Black Leather',
      });
    }

    suggestedCombinations.push({
      name: 'Complete Silhouette Stride',
      combination: [
        `${anchorTop?.name} (In your wardrobe)`,
        `${anchorBottom?.name} (In your wardrobe)`,
        isFestive ? 'Handcrafted Leather Juttis' : isFormal ? 'Dark Leather Formal Shoes' : 'White Minimal Sneakers',
      ],
      styling_tip: 'Your top and bottom form a fantastic foundation; anchoring it with the recommended footwear completes the look effortlessly.',
    });
  }

  // SCENARIO E: Only Homewear
  const isOnlyHomewear = activeItems.every((it) => {
    const sub = normalizeSubcategory(it.subcategory).toLowerCase();
    return sub === 'shorts' || sub === 'track_pants' || sub === 'slippers' || sub === 'pajama';
  });

  if (isOnlyHomewear) {
    recommendedItems.length = 0; // Clear generic items
    recommendedItems.push({
      name: 'Relaxed Pure Cotton Loungewear T-Shirt',
      category: 'tops',
      reason: 'Maximizes breathable comfort for home relaxation, reading, and remote downtime.',
      why_it_works: 'Soft combed cotton absorbs moisture and allows effortless thermal regulation.',
      priority: 'essential',
      color_suggestion: 'Heather Grey, Soft Sage, or Navy',
    });
    recommendedItems.push({
      name: 'Ergonomic EVA Comfort Slides',
      category: 'footwear',
      reason: 'Protects feet with cushioned arch support on tiled home floors.',
      why_it_works: 'Non-slip and easy to clean, ideal for Indian home use.',
      priority: 'essential',
      color_suggestion: 'Charcoal or Olive Green',
    });
  }

  // Synthesize rich, AI-augmented styling explanation
  let explanation = '';
  const weatherText = weather
    ? ` In ${weather.city}'s ${weather.temperature}°C weather (${weather.condition}), these complementary pieces prioritize breathable fabrics and practical walking ease.`
    : '';

  if (hasTops && !hasBottoms) {
    explanation = `Your ${anchorTop?.name} is a versatile wardrobe anchor. To form a complete, occasion-ready look for ${rule.name}, pairing it with neutral straight-fit trousers or dark denim along with clean minimalist footwear establishes ideal visual proportions without competing with your shirt.${weatherText}`;
  } else if (!hasTops && hasBottoms) {
    explanation = `Your ${anchorBottom?.name} provides a solid architectural foundation. Adding a crisp white oxford or structured dark polo immediately directs visual focus upward and balances your overall proportions for ${rule.name}.${weatherText}`;
  } else if (hasTops && hasBottoms && !hasFootwear) {
    explanation = `You have the core pairing ready with ${anchorTop?.name} and ${anchorBottom?.name}. Anchoring this look with the recommended clean footwear ensures the silhouette feels cohesive from head to toe.${weatherText}`;
  } else {
    explanation = `Consulting on ${anchorPieceName}: Even with a focused single piece in your wardrobe, styling with these essential wardrobe staples builds a clean, versatile outfit for ${rule.name}.${weatherText}`;
  }

  // Step 6: If Gemini API is available, optionally enrich the stylist guidance
  if (geminiApiKey) {
    try {
      const prompt = `
You are AUREVÉ's expert Indian fashion stylist.
The user's wardrobe currently only has: ${activeItems.map((i) => i.name).join(', ')}.
Selected Collection: "${collectionName || 'Everyday'}"
Intended Occasion: "${rule.name}" (${rule.description})
User Context: Skin undertone: ${userProfile?.skin_tone || 'Warm Olive/Wheatish'}, Gender: ${userProfile?.gender || 'Inclusive'}, City: ${weather?.city || 'India'}, Weather: ${weather?.temperature ?? 28}°C.

Task: Provide 2 refined, warm, encouraging sentences of personal styling guidance explaining how they can wear their owned piece(s) and what neutral, budget-friendly staples they can pair it with to complete the look.
Return strictly valid JSON:
{
  "title": "Editorial title (e.g., Campus Smart Casual Direction)",
  "explanation": "2 sentences of encouraging expert advice",
  "style_direction": ["Versatile", "Smart Casual", "Balanced"]
}
`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
          if (parsed.explanation) {
            explanation = parsed.explanation;
          }
        }
      }
    } catch (e) {
      // Fallback explanation already set
    }
  }

  return {
    wardrobe_completeness: activeItems.length === 1 ? 'single_item' : 'partial',
    title: `Styling Direction: ${anchorPieceName}`,
    ai_explanation: explanation,
    style_match: 91,
    style_direction: ['Smart Casual', 'Versatile', 'Balanced'],
    owned_items: ownedItemRefs,
    recommended_missing_items: recommendedItems,
    suggested_combinations: suggestedCombinations,
    conflict_note: conflictNote,
  };
}
