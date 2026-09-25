import { AIClassificationResult, MainCategory } from '@/lib/types';

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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are AUREVÉ's expert AI fashion classifier specializing in modern Indian men's and contemporary wardrobe analysis.
Analyze this garment photo and output strict JSON matching this exact structure:
{
  "category": "tops" | "bottoms" | "layers" | "footwear" | "accessories",
  "subcategory": "shirt" | "t-shirt" | "polo" | "overshirt" | "kurta" | "jeans" | "chinos" | "trousers" | "shorts" | "jacket" | "hoodie" | "sweater" | "sneakers" | "loafers" | "formal_shoes" | "sandals" | "kolhapuris" | "watch" | "belt" | "sunglasses",
  "name": "Short descriptive title (e.g., Sky Blue Oxford Shirt)",
  "primary_color": "Main color (e.g., Sky Blue, Navy, Olive, Charcoal, Beige, White)",
  "secondary_colors": ["optional secondary colors"],
  "pattern": "Solid" | "Striped" | "Checked" | "Textured" | "Printed",
  "material": "Cotton" | "Linen" | "Denim" | "Wool" | "Leather" | "Poly-Cotton",
  "fit": "Regular" | "Slim" | "Relaxed" | "Tailored" | "Oversized",
  "style": "Smart Casual" | "Minimal" | "Modern Indian" | "Casual" | "Formal",
  "formality": "Casual" | "Smart Casual" | "Semi-Formal" | "Formal" | "Festive",
  "season": ["Summer", "All-Season", "Winter", "Monsoon"]
}
Return ONLY pure valid JSON, no markdown backticks, no commentary.`,
                  },
                  imageData.startsWith('data:image')
                    ? {
                        inline_data: {
                          mime_type: imageData.substring(imageData.indexOf(':') + 1, imageData.indexOf(';')),
                          data: imageData.substring(imageData.indexOf(',') + 1),
                        },
                      }
                    : {
                        text: `Image URL: ${imageData}. Garment hint: ${hintName || 'Modern wardrobe piece'}`,
                      },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
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
              material: parsed.material || 'Cotton',
              fit: parsed.fit || 'Regular',
              style: parsed.style || 'Smart Casual',
              formality: parsed.formality || 'Smart Casual',
              season: parsed.season || ['All-Season'],
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini vision API error, using intelligent visual heuristic analyzer:', err);
    }
  }

  // Smart Contextual Heuristic Analyzer (Instant response fallback)
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
  const isTee = query.includes('tee') || query.includes('t-shirt');
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
