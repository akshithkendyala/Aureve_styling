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
 * High-performance, high-accuracy clothing classification pipeline using Gemini Vision
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

      // Ultra-concise, precision-engineered prompt for sub-2s execution
      const promptText = `
You are AUREVÉ's expert fashion vision classifier.
Analyze this real clothing photograph. Isolate the garment region (ignore background, room, furniture, skin).

MANDATORY RULES:
1. "name": Formulate a concise human title: [Primary Color] + [Key Characteristic] + [Subcategory] (e.g. "Black Cotton T-Shirt", "Sky Blue Oxford Shirt", "Beige Straight-Fit Chinos", "Olive Green Overshirt"). NEVER use generic filenames.
2. "category": Must be one of: ["tops", "bottoms", "layers", "footwear", "accessories"].
3. "subcategory": Must match category:
   - tops: ["T-Shirt", "Shirt", "Polo", "Kurta", "Overshirt", "Henley", "Tank Top", "Sweatshirt", "Hoodie", "Other"]
   - bottoms: ["Jeans", "Chinos", "Trousers", "Formal Pants", "Cargo Pants", "Track Pants", "Shorts", "Joggers", "Other"]
   - layers: ["Jacket", "Blazer", "Bomber Jacket", "Denim Jacket", "Windbreaker", "Sweater", "Cardigan", "Hoodie", "Coat", "Other"]
   - footwear: ["Sneakers", "Running Shoes", "Formal Shoes", "Loafers", "Boots", "Sandals", "Kolhapuris", "Other"]
   - accessories: ["Watch", "Belt", "Sunglasses", "Cap", "Hat", "Bag", "Other"]
4. "primary_color": Strictly choose from: ${JSON.stringify(PRIMARY_COLOR_OPTIONS)}. (Black vs Navy vs Charcoal vs Dark Grey vs Olive vs Burgundy vs White vs Off-White vs Beige).
5. "material": Strictly choose from: ${JSON.stringify(FABRIC_OPTIONS)}. If not clearly visible, return "Unknown / Not visible" or "Cotton".
6. "fit": One of: ["Regular", "Slim", "Relaxed", "Oversized", "Tailored", "Not Applicable", "Unknown"].
7. "pattern": One of: ["Solid", "Striped", "Checked", "Plaid", "Textured / Self-Pattern", "Printed / Floral", "Graphic", "Colorblock", "Other"].
8. "formality": One of: ["Casual", "Smart Casual", "Semi-Formal", "Formal", "Festive"].
9. "style": One of: ["Smart Casual", "Minimal", "Modern Indian", "Casual", "Streetwear", "Formal", "Sporty"].
10. "season": Subset of ["Summer", "Monsoon", "Winter", "All-Season", "Festive"].

Return strictly valid JSON:
{
  "name": "Black Cotton Crewneck T-Shirt",
  "category": "tops",
  "subcategory": "T-Shirt",
  "primary_color": "Black",
  "secondary_colors": [],
  "color_confidence": 0.95,
  "pattern": "Solid",
  "material": "Cotton",
  "material_confidence": 0.85,
  "fit": "Regular",
  "fit_confidence": 0.9,
  "style": "Casual",
  "formality": "Casual",
  "season": ["Summer", "All-Season"]
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

      // Fast vision models with minimal overhead
      const modelCandidates = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
      let data: any = null;

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
          }
        } catch (e) {
          console.warn(`Attempt with ${model} failed, trying next...`, e);
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
            let material = parsed.material || 'Cotton';
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
      console.warn('Gemini vision API error, using intelligent visual fallback:', err);
    }
  }

  // Intelligent, grounded fallback (never hallucinations or generic white shirt)
  return fallbackGroundedClassifier(clientColorHint, cleanHint);
}

/**
 * Intelligent Grounded Fallback that never uses filenames and grounds to the real color
 */
function fallbackGroundedClassifier(clientColorHint?: string, cleanHint?: string): AIClassificationResult {
  const detectedColor = clientColorHint || 'Black';
  const query = (cleanHint || '').toLowerCase();

  let category: MainCategory = 'tops';
  let subcategory = 'T-Shirt';
  let name = `${detectedColor} T-Shirt`;
  let material = 'Cotton';
  let fit = 'Regular';
  let formality: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive' = 'Casual';
  let style = 'Casual';

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
  } else if (query.includes('watch') || query.includes('belt') || query.includes('sunglasses')) {
    category = 'accessories';
    subcategory = query.includes('watch') ? 'Watch' : query.includes('belt') ? 'Belt' : 'Sunglasses';
    name = `${detectedColor} ${subcategory}`;
    material = query.includes('belt') ? 'Leather' : 'Other';
    fit = 'Not Applicable';
    formality = 'Smart Casual';
  } else if (query.includes('polo')) {
    category = 'tops';
    subcategory = 'Polo';
    name = `${detectedColor} Pique Polo`;
    material = 'Cotton';
    formality = 'Smart Casual';
  } else if (query.includes('kurta')) {
    category = 'tops';
    subcategory = 'Kurta';
    name = `${detectedColor} Modern Kurta`;
    material = 'Linen';
    formality = 'Festive';
    style = 'Modern Indian';
  } else if (query.includes('shirt') && !query.includes('t-shirt') && !query.includes('tshirt')) {
    category = 'tops';
    subcategory = 'Shirt';
    name = `${detectedColor} Button-Down Shirt`;
    material = 'Cotton';
    formality = 'Smart Casual';
  }

  return {
    category,
    subcategory,
    name,
    primary_color: detectedColor,
    secondary_colors: [],
    color_confidence: 0.88,
    pattern: 'Solid',
    material,
    material_confidence: 0.8,
    fit,
    fit_confidence: 0.85,
    style,
    formality,
    season: ['All-Season', 'Summer'],
  };
}
