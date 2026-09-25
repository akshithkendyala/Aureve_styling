import {
  Outfit,
  WardrobeItem,
  UserProfile,
  WeatherData,
  OccasionType,
  OutfitItemReference,
  AlternativeLook,
} from '@/lib/types';

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

export async function generateIntelligentOutfit(params: GenerateOutfitParams): Promise<Omit<Outfit, 'id' | 'user_id' | 'created_at'>> {
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

  // Filter only active, non-archived items
  const activeItems = wardrobe.filter((i) => !i.is_archived);

  if (activeItems.length === 0) {
    throw new Error('No active items found in your wardrobe. Please add your clothes first.');
  }

  const tops = activeItems.filter((i) => i.category === 'tops');
  const bottoms = activeItems.filter((i) => i.category === 'bottoms');
  const footwears = activeItems.filter((i) => i.category === 'footwear');
  const layers = activeItems.filter((i) => i.category === 'layers');
  const accessories = activeItems.filter((i) => i.category === 'accessories');

  if (tops.length === 0 || bottoms.length === 0) {
    throw new Error('You need at least one top and one bottom in your wardrobe to create an outfit.');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const promptText = `
You are AUREVÉ's elite Indian personal fashion stylist.
PHILOSOPHY: Simple + Classy + Modern + Indian + Practical.
GOAL: The desired reaction is "He dresses really well", NOT "He is trying too hard".
CRITICAL RULE: You MUST select items STRICTLY using the provided wardrobe item IDs. Do NOT invent IDs or recommend unowned clothes.

CONTEXT:
- Occasion: ${occasion}
- Date & Time: ${date} at ${time}
- Location: ${location}
- Weather: ${weather ? `${weather.temperature}°C, ${weather.condition}, ${weather.humidity}% humidity, ${weather.rain_probability}% rain chance. ${weather.summary}` : '28°C pleasant'}
- Mode: ${specialMode}
- User Profile: ${userProfile ? `Fit: ${userProfile.preferred_fit}, Colors: Favs [${userProfile.favorite_colors?.join(', ')}], Avoid [${userProfile.avoided_colors?.join(', ')}], Style: ${userProfile.style_preferences?.join(', ')}` : 'Smart Casual minimalist'}

AVAILABLE USER WARDROBE:
Tops:
${tops.map((t) => `- ID: "${t.id}" | Name: "${t.name}" | Color: ${t.primary_color} | Subcategory: ${t.subcategory} | Formality: ${t.formality} | Worn: ${t.times_worn || 0} times`).join('\n')}

Bottoms:
${bottoms.map((b) => `- ID: "${b.id}" | Name: "${b.name}" | Color: ${b.primary_color} | Subcategory: ${b.subcategory} | Formality: ${b.formality} | Worn: ${b.times_worn || 0} times`).join('\n')}

Footwear:
${footwears.map((f) => `- ID: "${f.id}" | Name: "${f.name}" | Color: ${f.primary_color} | Subcategory: ${f.subcategory} | Formality: ${f.formality}`).join('\n')}

Layers:
${layers.map((l) => `- ID: "${l.id}" | Name: "${l.name}" | Color: ${l.primary_color} | Subcategory: ${l.subcategory}`).join('\n')}

Accessories:
${accessories.map((a) => `- ID: "${a.id}" | Name: "${a.name}" | Color: ${a.primary_color} | Subcategory: ${a.subcategory}`).join('\n')}

STYLING PRIORITIES:
1. Occasion & Indian social context (e.g. Office, Date, Indian Family Function, College, Casual Outing).
2. Weather practicality (No heavy jackets in heat/humidity; breathable fabrics).
3. Color harmony (Clean contrast, neutral anchors).
4. Proportions & subtle elegance.
5. Rotation freshness (prefer items not worn recently).

OUTPUT FORMAT: Return STRICT JSON matching this exact structure:
{
  "title": "Short editorial title (e.g., Smart Casual Evening)",
  "selected_top_id": "EXACT_ID_FROM_TOPS",
  "selected_bottom_id": "EXACT_ID_FROM_BOTTOMS",
  "selected_footwear_id": "EXACT_ID_FROM_FOOTWEAR_OR_EMPTY",
  "selected_layer_id": "EXACT_ID_FROM_LAYERS_OR_EMPTY",
  "selected_accessory_ids": ["EXACT_ID_FROM_ACCESSORIES"],
  "style_direction": ["Simple", "Classy", "Modern"],
  "ai_explanation": "2-3 concise sentences explaining why this combination works effortlessly for the Indian climate and occasion.",
  "style_match": 94
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText.replace(/```json\n?|\n?```/g, '').trim());
          const topItem = tops.find((t) => t.id === parsed.selected_top_id) || tops[0];
          const bottomItem = bottoms.find((b) => b.id === parsed.selected_bottom_id) || bottoms[0];
          const footwearItem = footwears.find((f) => f.id === parsed.selected_footwear_id) || footwears[0];
          const layerItem = layers.find((l) => l.id === parsed.selected_layer_id);
          const accessoryItems = accessories.filter((a) => (parsed.selected_accessory_ids || []).includes(a.id));

          const items: OutfitItemReference[] = [
            { wardrobe_item_id: topItem.id, role: 'top', item: topItem },
            { wardrobe_item_id: bottomItem.id, role: 'bottom', item: bottomItem },
          ];

          if (footwearItem) {
            items.push({ wardrobe_item_id: footwearItem.id, role: 'footwear', item: footwearItem });
          }
          if (layerItem) {
            items.push({ wardrobe_item_id: layerItem.id, role: 'layer', item: layerItem });
          }
          accessoryItems.slice(0, 2).forEach((acc) => {
            items.push({ wardrobe_item_id: acc.id, role: 'accessory', item: acc });
          });

          // Generate 2 curated alternative looks
          const alternatives = buildAlternativeLooks(activeItems, topItem, bottomItem, occasion);

          return {
            occasion,
            date,
            time,
            location,
            weather_data: weather,
            title: parsed.title || `${occasion} Look`,
            ai_explanation: parsed.ai_explanation || generateReasoningExplanation(topItem, bottomItem, footwearItem, occasion, weather),
            style_match: Math.min(98, Math.max(88, parsed.style_match || 93)),
            style_direction: parsed.style_direction || ['Simple', 'Classy', 'Modern'],
            items,
            alternative_looks: alternatives,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini outfit generation error, using heuristic stylist:', err);
    }
  }

  // High-Precision Rule-Based Stylist Engine (Always reliable, Indian Context aware)
  return buildHeuristicOutfit(params);
}

function buildHeuristicOutfit(params: GenerateOutfitParams): Omit<Outfit, 'id' | 'user_id' | 'created_at'> {
  const { wardrobe, occasion, date, time, location, weather, specialMode } = params;
  const activeItems = wardrobe.filter((i) => !i.is_archived);

  const tops = activeItems.filter((i) => i.category === 'tops');
  const bottoms = activeItems.filter((i) => i.category === 'bottoms');
  const footwears = activeItems.filter((i) => i.category === 'footwear');
  const layers = activeItems.filter((i) => i.category === 'layers');
  const accessories = activeItems.filter((i) => i.category === 'accessories');

  const occ = occasion.toLowerCase();
  const isHot = (weather?.temperature || 28) >= 30;
  const isRain = (weather?.rain_probability || 0) > 40;
  const isCool = (weather?.temperature || 28) <= 20;

  // Select Top based on occasion & temperature
  let chosenTop: WardrobeItem;
  if (occ.includes('wedding') || occ.includes('festival') || occ.includes('family')) {
    chosenTop = tops.find((t) => t.subcategory === 'kurta' || t.style?.includes('Indian') || t.primary_color.includes('White') || t.name.includes('Linen')) || tops[0];
  } else if (occ.includes('interview') || occ.includes('office')) {
    chosenTop = tops.find((t) => (t.subcategory === 'shirt' && (t.primary_color.includes('Blue') || t.primary_color.includes('White')))) || tops.find((t) => t.subcategory === 'shirt') || tops[0];
  } else if (occ.includes('date') || occ.includes('dinner')) {
    chosenTop = tops.find((t) => t.name.includes('Oxford') || t.subcategory === 'shirt' || t.subcategory === 'polo') || tops[0];
  } else if (specialMode === 'comfort' || occ.includes('gym') || occ.includes('home')) {
    chosenTop = tops.find((t) => t.subcategory === 't-shirt') || tops[0];
  } else {
    chosenTop = tops.find((t) => t.is_favorite) || tops[0];
  }

  // Select Bottom matching top contrast & formality
  let chosenBottom: WardrobeItem;
  if (occ.includes('interview') || occ.includes('office')) {
    chosenBottom = bottoms.find((b) => b.subcategory === 'trousers' || b.subcategory === 'chinos') || bottoms[0];
  } else if (occ.includes('wedding') || occ.includes('festival')) {
    chosenBottom = bottoms.find((b) => b.name.includes('Linen') || b.subcategory === 'chinos' || b.primary_color.includes('Off-White') || b.primary_color.includes('Beige')) || bottoms[0];
  } else if (occ.includes('casual') || occ.includes('college') || occ.includes('party')) {
    chosenBottom = bottoms.find((b) => b.subcategory === 'jeans' || b.subcategory === 'chinos') || bottoms[0];
  } else {
    chosenBottom = bottoms.find((b) => b.is_favorite) || bottoms[0];
  }

  // Select Footwear
  let chosenFootwear: WardrobeItem | undefined;
  if (footwears.length > 0) {
    if (occ.includes('wedding') || occ.includes('festival')) {
      chosenFootwear = footwears.find((f) => f.subcategory === 'kolhapuris' || f.subcategory === 'loafers') || footwears[0];
    } else if (occ.includes('interview') || occ.includes('formal')) {
      chosenFootwear = footwears.find((f) => f.subcategory === 'formal_shoes' || f.subcategory === 'loafers') || footwears[0];
    } else if (occ.includes('date') || occ.includes('dinner')) {
      chosenFootwear = footwears.find((f) => f.subcategory === 'loafers' || f.subcategory === 'sneakers') || footwears[0];
    } else {
      chosenFootwear = footwears.find((f) => f.subcategory === 'sneakers') || footwears[0];
    }
  }

  // Select Layer only if evening or cool climate
  let chosenLayer: WardrobeItem | undefined;
  if (layers.length > 0 && (isCool || occ.includes('dinner') || occ.includes('party'))) {
    chosenLayer = layers.find((l) => l.is_favorite) || layers[0];
  }

  // Select Accessories
  const chosenAccessories: WardrobeItem[] = [];
  const watch = accessories.find((a) => a.subcategory === 'watch');
  if (watch) chosenAccessories.push(watch);
  const belt = accessories.find((a) => a.subcategory === 'belt');
  if (belt && chosenBottom.subcategory !== 'track_pants') chosenAccessories.push(belt);

  const items: OutfitItemReference[] = [
    { wardrobe_item_id: chosenTop.id, role: 'top', item: chosenTop },
    { wardrobe_item_id: chosenBottom.id, role: 'bottom', item: chosenBottom },
  ];

  if (chosenFootwear) {
    items.push({ wardrobe_item_id: chosenFootwear.id, role: 'footwear', item: chosenFootwear });
  }
  if (chosenLayer) {
    items.push({ wardrobe_item_id: chosenLayer.id, role: 'layer', item: chosenLayer });
  }
  chosenAccessories.forEach((acc) => {
    items.push({ wardrobe_item_id: acc.id, role: 'accessory', item: acc });
  });

  const title = generateOutfitTitle(occasion, chosenTop, chosenBottom);
  const explanation = generateReasoningExplanation(chosenTop, chosenBottom, chosenFootwear, occasion, weather);
  const alternatives = buildAlternativeLooks(activeItems, chosenTop, chosenBottom, occasion);

  return {
    occasion,
    date,
    time: time || '19:00',
    location: location || 'Mumbai',
    weather_data: weather,
    title,
    ai_explanation: explanation,
    style_match: 94,
    style_direction: ['Simple', 'Classy', 'Modern'],
    items,
    alternative_looks: alternatives,
  };
}

function generateOutfitTitle(occasion: string, top: WardrobeItem, bottom: WardrobeItem): string {
  const occ = occasion.toLowerCase();
  if (occ.includes('office')) return 'Sharp Workday Minimal';
  if (occ.includes('interview')) return 'Polished Executive Presence';
  if (occ.includes('date')) return 'Modern Effortless Date Night';
  if (occ.includes('dinner')) return 'Refined Evening Palette';
  if (occ.includes('wedding') || occ.includes('festival')) return 'Contemporary Celebratory Classic';
  if (occ.includes('college')) return 'Relaxed Campus Essential';
  if (occ.includes('travel')) return 'Comfort-Driven Travel Edit';
  return `Elevated ${occasion} Combination`;
}

function generateReasoningExplanation(
  top: WardrobeItem,
  bottom: WardrobeItem,
  footwear?: WardrobeItem,
  occasion?: string,
  weather?: WeatherData | null
): string {
  const topColor = top.primary_color.toLowerCase();
  const bottomColor = bottom.primary_color.toLowerCase();
  const footwearStr = footwear ? ` paired with ${footwear.name.toLowerCase()}` : '';
  const weatherStr = weather ? ` In ${weather.city}'s ${weather.temperature}°C weather, this ensures breathability and natural comfort.` : '';

  return `The ${top.name.toLowerCase()} creates a clean, intentional anchor against the ${bottom.name.toLowerCase()}${footwearStr}. This combination strikes the sweet spot of looking thoroughly put-together without feeling overdressed.${weatherStr}`;
}

function buildAlternativeLooks(
  activeItems: WardrobeItem[],
  currentTop: WardrobeItem,
  currentBottom: WardrobeItem,
  occasion: string
): AlternativeLook[] {
  const tops = activeItems.filter((i) => i.category === 'tops');
  const bottoms = activeItems.filter((i) => i.category === 'bottoms');
  const footwears = activeItems.filter((i) => i.category === 'footwear');

  const otherTops = tops.filter((t) => t.id !== currentTop.id);
  const otherBottoms = bottoms.filter((b) => b.id !== currentBottom.id);

  const alt1Top = otherTops[0] || currentTop;
  const alt1Bottom = currentBottom;
  const alt1Footwear = footwears[1] || footwears[0];

  const alt2Top = otherTops[1] || currentTop;
  const alt2Bottom = otherBottoms[0] || currentBottom;
  const alt2Footwear = footwears[0];

  const alternatives: AlternativeLook[] = [];

  if (otherTops.length > 0 || otherBottoms.length > 0) {
    alternatives.push({
      title: 'Look 02 — More Relaxed',
      badge: 'Relaxed',
      description: `Swap in the ${alt1Top.name} for an easier, breezy silhouette suited for long hours.`,
      items: [
        { wardrobe_item_id: alt1Top.id, role: 'top', item: alt1Top },
        { wardrobe_item_id: alt1Bottom.id, role: 'bottom', item: alt1Bottom },
        ...(alt1Footwear ? [{ wardrobe_item_id: alt1Footwear.id, role: 'footwear' as const, item: alt1Footwear }] : []),
      ],
    });

    if (otherTops.length > 1 || otherBottoms.length > 0) {
      alternatives.push({
        title: 'Look 03 — Slightly More Structured',
        badge: 'Structured',
        description: `Styling the ${alt2Top.name} with ${alt2Bottom.name} delivers higher definition for formal moments.`,
        items: [
          { wardrobe_item_id: alt2Top.id, role: 'top', item: alt2Top },
          { wardrobe_item_id: alt2Bottom.id, role: 'bottom', item: alt2Bottom },
          ...(alt2Footwear ? [{ wardrobe_item_id: alt2Footwear.id, role: 'footwear' as const, item: alt2Footwear }] : []),
        ],
      });
    }
  }

  return alternatives;
}
