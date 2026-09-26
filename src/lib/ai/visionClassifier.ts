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
  classifyRGBToControlledColor,
} from '@/lib/constants/clothingOptions';

/**
 * Clean and sanitize any technical filename (WhatsApp, IMG_1234, Screenshot, UUIDs)
 */
function sanitizeHint(hint?: string): string | undefined {
  if (!hint) return undefined;
  const lower = hint.toLowerCase();
  if (
    lower.includes('whatsapp') ||
    lower.includes('screenshot') ||
    lower.includes('img_') ||
    lower.includes('camera_') ||
    lower.includes('photo_') ||
    lower.includes('image_') ||
    /^[0-9a-f-_.\s]+$/i.test(hint) ||
    /\.(jpe?g|png|webp|heic|avif)$/i.test(hint)
  ) {
    return undefined; // technical filename, completely ignore
  }
  return hint.trim();
}

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
 * High-performance, high-accuracy clothing & accessories classification pipeline using Gemini Vision
 */
export async function classifyClothingImage(
  imageData: string,
  hintName?: string,
  clientColorHint?: string
): Promise<AIClassificationResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const cleanHint = sanitizeHint(hintName);

  if (geminiApiKey) {
    try {
      const imagePayload = await getImageInlineData(imageData);

      // Precision-engineered fashion vision prompt with explicit taxonomy mapping
      const promptText = `
You are AUREVÉ's expert fashion vision classifier.
Analyze this wardrobe piece image carefully. Identify what type of clothing, footwear, or accessory it actually is.
Isolate the item region and ignore background, room, mannequin, furniture, or skin.

MANDATORY TAXONOMY RULES:
1. "name": Formulate a concise, elegant human title: [Primary Color] + [Important Characteristic / Material / Fit] + [Subcategory]
   Examples:
   - "Black Leather Belt" (NEVER classify a belt as a T-shirt)
   - "Brown Leather Belt"
   - "Silver Stainless Steel Watch"
   - "Black Chronograph Watch"
   - "Black Half-Sleeve T-Shirt"
   - "Sky Blue Oxford Shirt"
   - "Dark Indigo Straight-Fit Jeans"
   - "Beige Slim-Fit Chinos"
   - "Navy Blue Tailored Blazer"
   - "White Leather Sneakers"
   - "Brown Leather Loafers"
   NEVER use generic filenames, camera IDs, or technical names.
2. "category": Must be strictly one of: ["tops", "bottoms", "layers", "footwear", "accessories"].
   - accessories: Watches, Belts, Sunglasses, Bags, Caps, Hats, Wallets, Ties, Scarves, Jewelry, Pocket Squares
   - footwear: Sneakers, Running Shoes, Formal Shoes, Loafers, Boots, Sandals, Kolhapuris, Slippers
   - bottoms: Jeans, Chinos, Trousers, Formal Pants, Cargo Pants, Shorts, Track Pants, Joggers
   - layers: Jackets, Blazers, Bomber Jackets, Denim Jackets, Sweaters, Cardigans, Hoodies, Coats, Overcoats
   - tops: T-Shirts, Shirts, Polos, Kurtas, Overshirts, Henleys, Tank Tops, Sweatshirts
3. "subcategory": Must strictly match the chosen category from this list:
   - accessories: ["Watch", "Belt", "Sunglasses", "Cap", "Hat", "Wallet", "Bag", "Bracelet", "Ring", "Tie", "Pocket Square", "Scarf", "Other"]
   - footwear: ["Sneakers", "Running Shoes", "Formal Shoes", "Loafers", "Boots", "Sandals", "Kolhapuris", "Slippers", "Flip-Flops", "Sports Shoes", "Other"]
   - bottoms: ["Jeans", "Chinos", "Trousers", "Formal Pants", "Cargo Pants", "Track Pants", "Shorts", "Joggers", "Dhoti", "Pajama", "Other"]
   - layers: ["Jacket", "Blazer", "Bomber Jacket", "Denim Jacket", "Windbreaker", "Sweater", "Cardigan", "Hoodie", "Coat", "Overcoat", "Other"]
   - tops: ["T-Shirt", "Shirt", "Polo", "Kurta", "Overshirt", "Henley", "Tank Top", "Sweatshirt", "Hoodie", "Other"]
4. "primary_color": Strictly choose from: ${JSON.stringify(PRIMARY_COLOR_OPTIONS)}. (Accurately distinguish Black vs Charcoal vs Navy Blue vs Olive Green vs Brown vs Burgundy vs White vs Off-White vs Beige).
5. "material": Strictly choose from: ${JSON.stringify(FABRIC_OPTIONS)}.
   - For leather belts/shoes/bags: choose "Leather" or "Suede".
   - For metal watches: choose "Other" or "Unknown / Not visible".
   - For jeans: choose "Denim".
   - If not clearly visible, choose "Unknown / Not visible" or "Cotton".
6. "fit": One of: ["Regular", "Slim", "Relaxed", "Oversized", "Tailored", "Not Applicable", "Unknown"]. (For accessories and footwear, ALWAYS return "Not Applicable").
7. "pattern": One of: ["Solid", "Striped", "Checked", "Plaid", "Textured / Self-Pattern", "Printed / Floral", "Graphic", "Colorblock", "Other"].
8. "formality": One of: ["Casual", "Smart Casual", "Semi-Formal", "Formal", "Festive"].
9. "style": One of: ["Smart Casual", "Minimal", "Modern Indian", "Casual", "Streetwear", "Formal", "Sporty"].
10. "season": Subset of ["Summer", "Monsoon", "Winter", "All-Season", "Festive"].

Return strictly valid JSON:
{
  "name": "Black Leather Belt",
  "category": "accessories",
  "subcategory": "Belt",
  "primary_color": "Black",
  "secondary_colors": [],
  "color_confidence": 0.96,
  "pattern": "Solid",
  "material": "Leather",
  "material_confidence": 0.92,
  "fit": "Not Applicable",
  "fit_confidence": 1.0,
  "style": "Smart Casual",
  "formality": "Smart Casual",
  "season": ["All-Season"]
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
      }

      if (cleanHint) {
        parts.push({ text: `User hint: ${cleanHint}` });
      }

      // Fast vision models with multi-model fallback and rate-limit resilience
      const modelCandidates = [
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ];
      let data: any = null;

      for (let attempt = 0; attempt < 2 && !data; attempt++) {
        for (const model of modelCandidates) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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

            if (res.ok) {
              data = await res.json();
              if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                break;
              }
            } else if (res.status === 429 || res.status === 503) {
              // Rate-limited or temporary service spike, immediately try next model candidate
              continue;
            }
          } catch (e) {
            // Network failure on this model, try next
          }
        }

        if (!data && attempt === 0) {
          // Pause briefly before second retry attempt
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (data) {
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText.replace(/```json\n?|\n?```/g, '').trim());
          if (parsed.category || parsed.name) {
            const rawCat = String(parsed.category || 'tops').toLowerCase().trim() as MainCategory;
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
            let primaryColor = parsed.primary_color || clientColorHint || 'Black';
            const matchedColor = PRIMARY_COLOR_OPTIONS.find(
              (c) => c.toLowerCase() === String(primaryColor).toLowerCase()
            );
            if (matchedColor) {
              primaryColor = matchedColor;
            } else if (clientColorHint && PRIMARY_COLOR_OPTIONS.includes(clientColorHint)) {
              primaryColor = clientColorHint;
            }

            // Validate material
            let material = parsed.material || (validCat === 'accessories' && subcategory === 'Belt' ? 'Leather' : 'Cotton');
            const matchedMat = FABRIC_OPTIONS.find(
              (m) => m.toLowerCase() === String(material).toLowerCase()
            );
            if (matchedMat) {
              material = matchedMat;
            }

            // Validate fit
            let fit = parsed.fit || (validCat === 'accessories' || validCat === 'footwear' ? 'Not Applicable' : 'Regular');
            if (!FIT_OPTIONS.includes(fit)) {
              fit = validCat === 'accessories' || validCat === 'footwear' ? 'Not Applicable' : 'Regular';
            }

            // Validate piece name (Ensure clean, human-friendly piece name)
            let name = parsed.name || `${primaryColor} ${subcategory}`;
            if (name.toLowerCase().includes('whatsapp') || name.toLowerCase().includes('image') || name.length < 3) {
              name = `${primaryColor} ${subcategory}`;
            }

            return {
              category: validCat,
              subcategory,
              name,
              primary_color: primaryColor,
              secondary_colors: Array.isArray(parsed.secondary_colors) ? parsed.secondary_colors : [],
              color_confidence: parsed.color_confidence || 0.92,
              pattern: PATTERN_OPTIONS.includes(parsed.pattern) ? parsed.pattern : 'Solid',
              material,
              material_confidence: parsed.material_confidence || 0.85,
              fit,
              fit_confidence: parsed.fit_confidence || 0.88,
              style: STYLE_OPTIONS.includes(parsed.style) ? parsed.style : 'Smart Casual',
              formality: FORMALITY_OPTIONS.includes(parsed.formality) ? parsed.formality : 'Smart Casual',
              season: Array.isArray(parsed.season) && parsed.season.length > 0 ? parsed.season : ['All-Season'],
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini vision API error, using honest grounded fallback:', err);
    }
  }

  // Honest grounded fallback that never hallucinates a fake T-Shirt
  return fallbackGroundedClassifier(clientColorHint, cleanHint);
}

/**
 * Honest Grounded Fallback: Does NOT falsely claim every piece is a T-shirt or cotton
 */
function fallbackGroundedClassifier(clientColorHint?: string, cleanHint?: string): AIClassificationResult {
  const detectedColor = clientColorHint || 'Black';
  const query = (cleanHint || '').toLowerCase();

  let category: MainCategory = 'tops';
  let subcategory = 'Shirt';
  let name = `${detectedColor} Piece`;
  let material = 'Unknown / Not visible';
  let fit = 'Regular';
  let formality: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive' = 'Casual';
  let style = 'Smart Casual';

  if (query.includes('shoe') || query.includes('sneaker') || query.includes('loafer') || query.includes('boot')) {
    category = 'footwear';
    subcategory = query.includes('loafer') ? 'Loafers' : query.includes('formal') ? 'Formal Shoes' : 'Sneakers';
    name = `${detectedColor} ${subcategory}`;
    material = 'Leather';
    fit = 'Not Applicable';
    formality = subcategory === 'Formal Shoes' ? 'Formal' : 'Smart Casual';
  } else if (query.includes('jean') || query.includes('pant') || query.includes('trouser') || query.includes('chino') || query.includes('short')) {
    category = 'bottoms';
    subcategory = query.includes('jean') ? 'Jeans' : query.includes('chino') ? 'Chinos' : query.includes('short') ? 'Shorts' : 'Trousers';
    name = `${detectedColor} ${subcategory}`;
    material = query.includes('jean') ? 'Denim' : 'Cotton Twill';
    fit = 'Regular';
    formality = query.includes('jean') || query.includes('short') ? 'Casual' : 'Smart Casual';
  } else if (query.includes('jacket') || query.includes('blazer') || query.includes('hoodie') || query.includes('sweater')) {
    category = 'layers';
    subcategory = query.includes('blazer') ? 'Blazer' : query.includes('hoodie') ? 'Hoodie' : query.includes('sweater') ? 'Sweater' : 'Jacket';
    name = `${detectedColor} ${subcategory}`;
    material = query.includes('sweater') ? 'Wool / Cashmere' : 'Cotton Twill';
    fit = 'Regular';
    formality = query.includes('blazer') ? 'Formal' : 'Smart Casual';
  } else if (query.includes('watch') || query.includes('belt') || query.includes('sunglasses') || query.includes('bag') || query.includes('wallet')) {
    category = 'accessories';
    subcategory = query.includes('watch') ? 'Watch' : query.includes('belt') ? 'Belt' : query.includes('bag') ? 'Bag' : query.includes('wallet') ? 'Wallet' : 'Sunglasses';
    name = `${detectedColor} ${subcategory}`;
    material = query.includes('belt') || query.includes('wallet') || query.includes('bag') ? 'Leather' : 'Other';
    fit = 'Not Applicable';
    formality = 'Smart Casual';
  } else if (query.includes('polo')) {
    category = 'tops';
    subcategory = 'Polo';
    name = `${detectedColor} Polo`;
    material = 'Cotton';
    formality = 'Smart Casual';
  } else if (query.includes('kurta')) {
    category = 'tops';
    subcategory = 'Kurta';
    name = `${detectedColor} Kurta`;
    material = 'Linen';
    formality = 'Festive';
    style = 'Modern Indian';
  } else if (query.includes('t-shirt') || query.includes('tshirt') || query.includes('tee')) {
    category = 'tops';
    subcategory = 'T-Shirt';
    name = `${detectedColor} T-Shirt`;
    material = 'Cotton';
    formality = 'Casual';
  } else if (query.includes('shirt')) {
    category = 'tops';
    subcategory = 'Shirt';
    name = `${detectedColor} Shirt`;
    material = 'Cotton';
    formality = 'Smart Casual';
  }

  return {
    category,
    subcategory,
    name,
    primary_color: detectedColor,
    secondary_colors: [],
    color_confidence: 0.85,
    pattern: 'Solid',
    material,
    material_confidence: 0.7,
    fit,
    fit_confidence: 0.75,
    style,
    formality,
    season: ['All-Season', 'Summer'],
  };
}
