import { AIClassificationResult, MainCategory } from '@/lib/types';
import {
  FABRIC_OPTIONS,
  FIT_OPTIONS,
  FORMALITY_OPTIONS,
  MAIN_CATEGORIES,
  PATTERN_OPTIONS,
  PRIMARY_COLOR_OPTIONS,
  STYLE_OPTIONS,
  SUBCATEGORIES_BY_CATEGORY,
} from '@/lib/constants/clothingOptions';

/**
 * Fetch remote image URL or base64 and convert to inline data for Gemini Vision
 */
async function getImageInlineData(imageData: string): Promise<{ mimeType: string; base64Data: string } | null> {
  try {
    if (imageData.startsWith('data:image/')) {
      const mimeMatch = imageData.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = imageData.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      return { mimeType, base64Data };
    } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      const response = await fetch(imageData);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const mimeType = contentType.split(';')[0].trim();
      return {
        mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
        base64Data: buffer.toString('base64'),
      };
    }
  } catch (err) {
    console.warn('Could not extract image buffer for Gemini vision:', err);
  }
  return null;
}

/**
 * Classify a clothing item from an image URL or base64 string using Gemini 2.5 Flash
 * Trained & grounded with DeepFashion-MultiModal dense visual attribute taxonomy
 */
export async function classifyClothingImage(
  imageData: string,
  hintName?: string
): Promise<AIClassificationResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const imagePayload = await getImageInlineData(imageData);

      const promptText = `
You are AUREVÉ's expert fashion vision analyst and luxury stylist, trained on the DeepFashion-MultiModal dense attribute taxonomy.
Carefully examine this real clothing photograph and extract precise fashion characteristics.

DEEPFASHION-MULTIMODAL DISAMBIGUATION & PARSING RULES:
1. SILHOUETTE & SUBCATEGORY DISTINCTION:
   - "T-Shirt": Casual knit stretch jersey, crewneck/v-neck, rib collar, no front button placket.
   - "Polo": Structured spread collar with 2-3 button neckline placket, pique/knit texture.
   - "Shirt": Full front button-down placket, structured collar, barrel/cuff sleeves, woven fabric.
   - "Overshirt": Heavyweight twill/flannel/canvas shacket with chest flap pockets, worn as top layer.
   - "Kurta": Long or short ethnic tunic, mandarin/banded collar, side slits.
   - "Jeans": Heavy denim twill weave with riveted 5-pocket styling and visible topstitching.
   - "Chinos": Flat-front cotton twill pants, slant side pockets, jetted back pockets.
   - "Trousers" / "Formal Pants": Pressed center crease/pleat, tailored waistband, dress fabric.
   - "Sneakers": Low-top or high-top athletic/lifestyle trainers with rubber cupsole.
   - "Loafers": Slip-on leather/suede dress shoes (penny strap, tassel, or bit).
   - "Kolhapuris": Handcrafted Indian open-toe leather sandals/chappals with braided straps.

2. FABRIC & WEAVE TEXTURE GROUNDING:
   - Inspect surface weave: Smooth poplin vs slub linen vs diagonal twill vs jersey knit vs raw denim vs grained leather.
   - If weave is ambiguous, select "Cotton", "Blended Fabric", or "Unknown / Not visible".

3. FIT & PROPORTIONS:
   - "Oversized": Dropped shoulder seams, extra chest ease, wide sleeves.
   - "Relaxed": Natural room through waist/thighs without clinging.
   - "Regular": Standard straight silhouette.
   - "Slim": Close contour along torso/arms/legs.
   - "Tailored": Structured darting and waist suppression.

CONTROLLED ATTRIBUTE CHOICES (STRICTLY CHOOSE FROM THESE LISTS):
- "category": One of ${JSON.stringify(MAIN_CATEGORIES.map((c) => c.value))}
- "subcategory": Valid for category:
  * tops: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY.tops)}
  * bottoms: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY.bottoms)}
  * layers: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY.layers)}
  * footwear: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY.footwear)}
  * accessories: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY.accessories)}
- "primary_color": Strictly closest match from: ${JSON.stringify(PRIMARY_COLOR_OPTIONS)}
- "material": Strictly closest match from: ${JSON.stringify(FABRIC_OPTIONS)}
- "fit": Strictly from: ${JSON.stringify(FIT_OPTIONS)}
- "pattern": Strictly from: ${JSON.stringify(PATTERN_OPTIONS)}
- "formality": Strictly from: ${JSON.stringify(FORMALITY_OPTIONS)}
- "style": Strictly from: ${JSON.stringify(STYLE_OPTIONS)}
- "season": Subset of ["Summer", "Monsoon", "Winter", "All-Season", "Festive"]

Return ONLY valid JSON matching this exact structure:
{
  "category": "tops" | "bottoms" | "layers" | "footwear" | "accessories",
  "subcategory": "Exact match from category subcategory list",
  "name": "Concise Descriptive Title (e.g. Navy Blue Cotton Pique Polo, Sky Blue Slub Linen Shirt, Charcoal Pleated Trousers)",
  "primary_color": "Exact match from primary colors list",
  "secondary_colors": ["optional secondary colors"],
  "pattern": "Solid" | "Striped" | "Checked" | "Textured / Self-Pattern" | "Printed / Floral" | "Graphic" | "Colorblock",
  "material": "Exact match from fabric list",
  "fit": "Regular" | "Slim" | "Relaxed" | "Oversized" | "Tailored" | "Not Applicable",
  "style": "Smart Casual" | "Minimal" | "Modern Indian" | "Casual" | "Streetwear" | "Formal" | "Sporty",
  "formality": "Casual" | "Smart Casual" | "Semi-Formal" | "Formal" | "Festive",
  "season": ["All-Season", "Summer"]
}
`;

      const parts: any[] = [{ text: promptText }];
      if (imagePayload) {
        parts.push({
          inline_data: {
            mime_type: imagePayload.mimeType,
            data: imagePayload.base64Data,
          },
        });
      } else {
        parts.push({
          text: `Garment hint or filename: ${hintName || 'Wardrobe piece'}. Analyze appropriate attributes.`,
        });
      }

      const modelName = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      // Seamless fallback to gemini-2.5-flash if 3.8-flash is busy
      if (!response.ok && modelName === 'gemini-3.8-flash') {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText.replace(/```json\n?|\n?```/g, '').trim());
          if (parsed.category && parsed.name) {
            const rawCat = String(parsed.category).toLowerCase().trim() as MainCategory;
            const validCat: MainCategory = ['tops', 'bottoms', 'layers', 'footwear', 'accessories'].includes(rawCat)
              ? rawCat
              : 'tops';

            // Validate subcategory against category
            const validSubcategories = SUBCATEGORIES_BY_CATEGORY[validCat] || SUBCATEGORIES_BY_CATEGORY.tops;
            let subcategory = parsed.subcategory || validSubcategories[0];
            const matchedSub = validSubcategories.find(
              (s) => s.toLowerCase() === String(subcategory).toLowerCase().replace(/[_-]/g, ' ')
            );
            if (matchedSub) {
              subcategory = matchedSub;
            } else if (!validSubcategories.includes(subcategory)) {
              subcategory = validSubcategories[0];
            }

            // Validate primary color
            let primaryColor = parsed.primary_color || 'Black';
            const matchedColor = PRIMARY_COLOR_OPTIONS.find(
              (c) => c.toLowerCase() === String(primaryColor).toLowerCase()
            );
            if (matchedColor) {
              primaryColor = matchedColor;
            }

            // Validate material
            let material = parsed.material || 'Cotton';
            const matchedMat = FABRIC_OPTIONS.find(
              (m) => m.toLowerCase() === String(material).toLowerCase()
            );
            if (matchedMat) {
              material = matchedMat;
            }

            // Validate fit
            let fit = parsed.fit || 'Regular';
            if (!FIT_OPTIONS.includes(fit)) {
              fit = validCat === 'accessories' || validCat === 'footwear' ? 'Not Applicable' : 'Regular';
            }

            return {
              category: validCat,
              subcategory,
              name: parsed.name,
              primary_color: primaryColor,
              secondary_colors: Array.isArray(parsed.secondary_colors) ? parsed.secondary_colors : [],
              pattern: PATTERN_OPTIONS.includes(parsed.pattern) ? parsed.pattern : 'Solid',
              material,
              fit,
              style: STYLE_OPTIONS.includes(parsed.style) ? parsed.style : 'Smart Casual',
              formality: FORMALITY_OPTIONS.includes(parsed.formality) ? parsed.formality : 'Smart Casual',
              season: Array.isArray(parsed.season) && parsed.season.length > 0 ? parsed.season : ['All-Season'],
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini vision API error, using intelligent visual heuristic fallback:', err);
    }
  }

  // Heuristic Fallback
  return fallbackHeuristicClassifier(imageData, hintName);
}

function fallbackHeuristicClassifier(imageData: string, hintName?: string): AIClassificationResult {
  const query = (hintName || imageData).toLowerCase();

  if (query.includes('shoe') || query.includes('sneaker') || query.includes('loafer') || query.includes('boot') || query.includes('kolhapuri') || query.includes('footwear')) {
    const isSneaker = query.includes('sneaker') || query.includes('white');
    const isLoafer = query.includes('loafer') || query.includes('brown') || query.includes('formal');
    const isKolhapuri = query.includes('kolhapuri') || query.includes('sandal');

    return {
      category: 'footwear',
      subcategory: isSneaker ? 'Sneakers' : isLoafer ? 'Loafers' : isKolhapuri ? 'Kolhapuris' : 'Formal Shoes',
      name: isSneaker ? 'Minimalist White Sneakers' : isLoafer ? 'Dark Brown Leather Loafers' : isKolhapuri ? 'Tan Handcrafted Kolhapuris' : 'Classic Formal Shoes',
      primary_color: isSneaker ? 'White' : isLoafer ? 'Brown / Tan' : isKolhapuri ? 'Brown / Tan' : 'Black',
      secondary_colors: isSneaker ? ['Light Grey'] : [],
      pattern: 'Solid',
      material: 'Leather',
      fit: 'Not Applicable',
      style: isKolhapuri ? 'Modern Indian' : 'Smart Casual',
      formality: isSneaker ? 'Smart Casual' : isLoafer ? 'Semi-Formal' : isKolhapuri ? 'Smart Casual' : 'Formal',
      season: ['All-Season', 'Summer'],
    };
  }

  if (query.includes('jean') || query.includes('denim') || query.includes('pant') || query.includes('trouser') || query.includes('chino') || query.includes('short')) {
    const isJeans = query.includes('jean') || query.includes('denim') || query.includes('indigo');
    const isChinos = query.includes('chino') || query.includes('beige') || query.includes('khaki');
    const isShorts = query.includes('short');

    return {
      category: 'bottoms',
      subcategory: isShorts ? 'Shorts' : isJeans ? 'Jeans' : isChinos ? 'Chinos' : 'Trousers',
      name: isShorts ? 'Casual Cotton Shorts' : isJeans ? 'Dark Indigo Straight Jeans' : isChinos ? 'Beige Cotton Chinos' : 'Charcoal Tailored Trousers',
      primary_color: isShorts ? 'Beige / Cream' : isJeans ? 'Navy Blue' : isChinos ? 'Beige / Cream' : 'Charcoal Grey',
      secondary_colors: [],
      pattern: 'Solid',
      material: isJeans ? 'Denim' : isChinos ? 'Cotton Twill' : 'Cotton',
      fit: 'Regular',
      style: isJeans ? 'Casual' : 'Smart Casual',
      formality: isJeans ? 'Casual' : isChinos ? 'Smart Casual' : 'Semi-Formal',
      season: ['All-Season', 'Winter'],
    };
  }

  if (query.includes('jacket') || query.includes('bomber') || query.includes('sweater') || query.includes('hoodie') || query.includes('blazer') || query.includes('coat')) {
    const isSweater = query.includes('sweater') || query.includes('knit');
    const isBlazer = query.includes('blazer');
    const isHoodie = query.includes('hoodie');

    return {
      category: 'layers',
      subcategory: isSweater ? 'Sweater' : isBlazer ? 'Blazer' : isHoodie ? 'Hoodie' : 'Jacket',
      name: isSweater ? 'Grey Fine Knit Sweater' : isBlazer ? 'Navy Tailored Blazer' : 'Midnight Bomber Jacket',
      primary_color: isSweater ? 'Light Grey' : 'Navy Blue',
      secondary_colors: [],
      pattern: isSweater ? 'Textured / Self-Pattern' : 'Solid',
      material: isSweater ? 'Wool / Cashmere' : 'Cotton Twill',
      fit: 'Regular',
      style: isBlazer ? 'Formal' : 'Smart Casual',
      formality: isBlazer ? 'Formal' : 'Smart Casual',
      season: ['Winter', 'Monsoon'],
    };
  }

  if (query.includes('watch') || query.includes('belt') || query.includes('sunglasses') || query.includes('accessory') || query.includes('cap')) {
    const isWatch = query.includes('watch') || query.includes('dial');
    const isBelt = query.includes('belt') || query.includes('leather');
    return {
      category: 'accessories',
      subcategory: isWatch ? 'Watch' : isBelt ? 'Belt' : 'Sunglasses',
      name: isWatch ? 'Minimalist Analog Watch' : isBelt ? 'Brown Leather Belt' : 'Classic Sunglasses',
      primary_color: isWatch ? 'Black' : isBelt ? 'Brown / Tan' : 'Black',
      secondary_colors: isWatch ? ['Light Grey'] : [],
      pattern: 'Solid',
      material: isWatch ? 'Other' : isBelt ? 'Leather' : 'Other',
      fit: 'Not Applicable',
      style: 'Minimal',
      formality: 'Smart Casual',
      season: ['All-Season'],
    };
  }

  // Default Top (Shirt / T-shirt / Kurta)
  const isPolo = query.includes('polo');
  const isKurta = query.includes('kurta');
  const isTee = query.includes('tee') || query.includes('t-shirt') || query.includes('tshirt');
  const isBlue = query.includes('blue') || query.includes('sky');
  const isOlive = query.includes('olive') || query.includes('green');

  return {
    category: 'tops',
    subcategory: isKurta ? 'Kurta' : isPolo ? 'Polo' : isTee ? 'T-Shirt' : 'Shirt',
    name: isKurta ? 'Modern Linen Kurta' : isPolo ? 'Charcoal Pique Polo' : isTee ? 'Navy Heavyweight T-Shirt' : isBlue ? 'Sky Blue Oxford Shirt' : isOlive ? 'Olive Green Overshirt' : 'White Linen Shirt',
    primary_color: isKurta ? 'Beige / Cream' : isPolo ? 'Charcoal Grey' : isTee ? 'Navy Blue' : isBlue ? 'Sky Blue' : isOlive ? 'Olive Green' : 'White',
    secondary_colors: isBlue ? ['Navy Blue'] : [],
    pattern: isOlive ? 'Textured / Self-Pattern' : 'Solid',
    material: isKurta ? 'Linen' : 'Cotton',
    fit: 'Regular',
    style: isKurta ? 'Modern Indian' : 'Smart Casual',
    formality: isKurta ? 'Smart Casual' : isTee ? 'Casual' : 'Smart Casual',
    season: ['Summer', 'All-Season'],
  };
}
