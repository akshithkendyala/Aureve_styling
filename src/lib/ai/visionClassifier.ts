import { AIClassificationResult, MainCategory } from '@/lib/types';

/**
 * Fetch remote image URL and convert to base64 inline data for Gemini Vision
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
 * Classify a clothing item from an image URL or base64 string using AI vision
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
You are AUREVÉ's expert fashion vision analyst and tailor.
Carefully examine this real garment image and extract precise fashion characteristics.

CRITICAL CLASSIFICATION INSTRUCTIONS:
1. DISTINGUISH SUBCATEGORIES ACCURATELY:
   - "t-shirt": Crewneck / round neck or V-neck, casual knit tee without full collar and buttons.
   - "shirt": Button-down front, formal/casual collar, cuffs, woven fabric (e.g. Oxford, Linen, Poplin, Denim shirt).
   - "polo": T-shirt with a structured collar and 2-3 button placket.
   - "overshirt": Heavy shirt jacket / shacket, thick cotton or twill worn open or closed.
   - "kurta": Indian ethnic long or short kurta tunic.
   - "jeans": Denim cotton with visible twill texture, pockets, and rivets.
   - "trousers": Formal or dress pants, pressed creases, pleated or flat front.
   - "chinos": Casual cotton trousers, flat-front, casual pockets.
   - "sneakers": Athletic or casual minimal leather/canvas trainers.
   - "loafers": Slip-on leather shoes (penny loafers, tassels, horsebit).
   - "kolhapuris": Handcrafted Indian leather sandals or ethnic chappals.
   - "watch": Wristwatch with dial and strap.

2. FIT DETECTION:
   - "Oversized": Dropped shoulders, very wide chest/sleeves, relaxed baggy silhouette.
   - "Relaxed": Easy breezy drape, loose through waist and arms without tight tapering.
   - "Regular": Classic standard proportion, straight cut.
   - "Slim": Fitted close to torso/arms/thighs.
   - "Tailored": Structured waist/shoulder definition.

3. COLOR & MATERIAL:
   - Identify the exact primary color (e.g. "Sky Blue", "Navy Blue", "Olive Green", "Charcoal Grey", "Sand Beige", "Crisp White", "Dark Indigo", "Burgundy", "Terracotta", "Forest Green", "Off-White", "Black").
   - Secondary accent colors if present.
   - Detect fabric material: "100% Cotton", "Pure Linen", "Raw Denim", "Merino Wool", "Full Grain Leather", "Cotton Twill", "Linen Blend", "Silk", "Knit Cotton", etc.

Return ONLY strict, valid JSON with NO markdown formatting, matching this exact JSON schema:
{
  "category": "tops" | "bottoms" | "layers" | "footwear" | "accessories",
  "subcategory": "shirt" | "t-shirt" | "polo" | "overshirt" | "kurta" | "jeans" | "chinos" | "trousers" | "shorts" | "track_pants" | "jacket" | "hoodie" | "sweater" | "sneakers" | "loafers" | "formal_shoes" | "sandals" | "kolhapuris" | "watch" | "belt" | "sunglasses",
  "name": "Concise Descriptive Title (e.g. Olive Green Relaxed Overshirt, Sky Blue Linen Button-Down, Dark Indigo Straight Jeans)",
  "primary_color": "Exact Color Name (e.g. Olive Green, Sky Blue, Charcoal, Sand Beige, Crisp White)",
  "secondary_colors": ["optional secondary colors"],
  "pattern": "Solid" | "Striped" | "Checked" | "Textured" | "Printed" | "Graphic",
  "material": "Cotton" | "Pure Linen" | "Denim" | "Wool" | "Full Grain Leather" | "Cotton Twill",
  "fit": "Regular" | "Slim" | "Relaxed" | "Oversized" | "Tailored",
  "style": "Smart Casual" | "Minimal" | "Modern Indian" | "Casual" | "Streetwear" | "Formal",
  "formality": "Casual" | "Smart Casual" | "Semi-Formal" | "Formal" | "Festive",
  "season": ["Summer", "All-Season", "Winter", "Monsoon"]
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
          text: `Garment metadata or filename hint: ${hintName || 'Real wardrobe clothing item'}. Analyze appropriate attributes.`,
        });
      }

      const response = await fetch(
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

      if (response.ok) {
        const data = await response.json();
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText.replace(/```json\n?|\n?```/g, '').trim());
          if (parsed.category && parsed.name) {
            return {
              category: parsed.category.toLowerCase() as MainCategory,
              subcategory: parsed.subcategory || 'shirt',
              name: parsed.name,
              primary_color: parsed.primary_color || 'Neutral',
              secondary_colors: parsed.secondary_colors || [],
              pattern: parsed.pattern || 'Solid',
              material: parsed.material || '100% Cotton',
              fit: parsed.fit || 'Regular',
              style: parsed.style || 'Smart Casual',
              formality: parsed.formality || 'Smart Casual',
              season: parsed.season || ['All-Season'],
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
      subcategory: isSneaker ? 'sneakers' : isLoafer ? 'loafers' : isKolhapuri ? 'kolhapuris' : 'formal_shoes',
      name: isSneaker ? 'Minimalist White Leather Sneakers' : isLoafer ? 'Dark Brown Leather Loafers' : isKolhapuri ? 'Tan Handcrafted Kolhapuri Slippers' : 'Classic Dress Shoes',
      primary_color: isSneaker ? 'White' : isLoafer ? 'Dark Brown' : isKolhapuri ? 'Tan' : 'Black',
      secondary_colors: isSneaker ? ['Off-White'] : [],
      pattern: 'Solid',
      material: 'Full Grain Leather',
      fit: 'Regular',
      style: isKolhapuri ? 'Modern Indian' : 'Smart Casual',
      formality: isSneaker ? 'Smart Casual' : isLoafer ? 'Semi-Formal' : isKolhapuri ? 'Smart Casual' : 'Formal',
      season: ['All-Season', 'Summer'],
    };
  }

  if (query.includes('jean') || query.includes('denim') || query.includes('pant') || query.includes('trouser') || query.includes('chino') || query.includes('short')) {
    const isJeans = query.includes('jean') || query.includes('denim') || query.includes('indigo');
    const isChinos = query.includes('chino') || query.includes('beige') || query.includes('khaki');

    return {
      category: 'bottoms',
      subcategory: isJeans ? 'jeans' : isChinos ? 'chinos' : 'trousers',
      name: isJeans ? 'Raw Indigo Straight-Fit Jeans' : isChinos ? 'Beige Pleated Chinos' : 'Charcoal Tailored Trousers',
      primary_color: isJeans ? 'Dark Indigo' : isChinos ? 'Beige' : 'Charcoal',
      secondary_colors: [],
      pattern: isJeans ? 'Solid Denim' : 'Solid',
      material: isJeans ? 'Raw Denim Cotton' : isChinos ? 'Cotton Gabardine' : 'Tropical Wool Blend',
      fit: 'Regular',
      style: isJeans ? 'Casual' : 'Smart Casual',
      formality: isJeans ? 'Casual' : isChinos ? 'Smart Casual' : 'Semi-Formal',
      season: ['All-Season', 'Winter'],
    };
  }

  if (query.includes('jacket') || query.includes('bomber') || query.includes('sweater') || query.includes('hoodie') || query.includes('blazer') || query.includes('coat')) {
    const isSweater = query.includes('sweater') || query.includes('knit');
    return {
      category: 'layers',
      subcategory: isSweater ? 'sweater' : 'jacket',
      name: isSweater ? 'Heather Grey Fine Knit Sweater' : 'Midnight Navy Bomber Jacket',
      primary_color: isSweater ? 'Grey' : 'Navy Blue',
      secondary_colors: [],
      pattern: isSweater ? 'Textured' : 'Solid',
      material: isSweater ? 'Merino Wool Blend' : 'Lightweight Poly-Cotton',
      fit: 'Regular',
      style: 'Smart Casual',
      formality: 'Smart Casual',
      season: ['Winter', 'Evening'],
    };
  }

  if (query.includes('watch') || query.includes('belt') || query.includes('sunglasses') || query.includes('accessory') || query.includes('cap')) {
    const isWatch = query.includes('watch') || query.includes('dial');
    const isBelt = query.includes('belt') || query.includes('leather');
    return {
      category: 'accessories',
      subcategory: isWatch ? 'watch' : isBelt ? 'belt' : 'sunglasses',
      name: isWatch ? 'Obsidian Minimalist Analog Watch' : isBelt ? 'Cognac Full-Grain Leather Belt' : 'Matte Black Classic Sunglasses',
      primary_color: isWatch ? 'Black' : isBelt ? 'Cognac Brown' : 'Black',
      secondary_colors: isWatch ? ['Silver'] : [],
      pattern: 'Solid',
      material: isWatch ? 'Stainless Steel & Leather' : isBelt ? 'Full-Grain Leather' : 'Acetate',
      fit: 'Standard',
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
    subcategory: isKurta ? 'kurta' : isPolo ? 'polo' : isTee ? 't-shirt' : 'shirt',
    name: isKurta ? 'Sand Modern Kurta Shirt' : isPolo ? 'Charcoal Pique Polo' : isTee ? 'Classic Navy Heavyweight T-Shirt' : isBlue ? 'Sky Blue Oxford Button-Down' : isOlive ? 'Olive Green Structured Overshirt' : 'Crisp White Linen Shirt',
    primary_color: isKurta ? 'Sand Beige' : isPolo ? 'Charcoal' : isTee ? 'Navy Blue' : isBlue ? 'Sky Blue' : isOlive ? 'Olive Green' : 'White',
    secondary_colors: isBlue ? ['Navy'] : [],
    pattern: isOlive ? 'Textured' : 'Solid',
    material: isKurta ? 'Linen Blend' : isBlue ? '100% Cotton Oxford' : 'Pure Linen',
    fit: 'Regular',
    style: isKurta ? 'Modern Indian' : 'Smart Casual',
    formality: isKurta ? 'Smart Casual' : isTee ? 'Casual' : 'Smart Casual',
    season: ['Summer', 'All-Season'],
  };
}
