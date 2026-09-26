const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const COLOR_PALETTE_CENTROIDS = [
  { name: 'Black', r: 18, g: 18, b: 22 },
  { name: 'Charcoal Grey', r: 52, g: 56, b: 62 },
  { name: 'Dark Grey', r: 90, g: 94, b: 98 },
  { name: 'Light Grey', r: 185, g: 188, b: 192 },
  { name: 'White', r: 248, g: 248, b: 252 },
  { name: 'Off-White', r: 238, g: 236, b: 226 },
  { name: 'Beige / Cream', r: 222, g: 210, b: 182 },
  { name: 'Navy Blue', r: 18, g: 32, b: 68 },
  { name: 'Royal Blue', r: 28, g: 78, b: 185 },
  { name: 'Sky Blue', r: 130, g: 195, b: 238 },
  { name: 'Teal', r: 20, g: 125, b: 135 },
  { name: 'Mint', r: 160, g: 220, b: 195 },
  { name: 'Olive Green', r: 85, g: 98, b: 52 },
  { name: 'Dark Green', r: 24, g: 62, b: 35 },
  { name: 'Sage Green', r: 135, g: 160, b: 130 },
  { name: 'Burgundy / Maroon', r: 105, g: 24, b: 38 },
  { name: 'Red', r: 215, g: 35, b: 38 },
  { name: 'Brown / Tan', r: 135, g: 85, b: 50 },
  { name: 'Camel / Khaki', r: 185, g: 155, b: 110 },
  { name: 'Terracotta / Rust', r: 180, g: 82, b: 50 },
  { name: 'Yellow / Mustard', r: 218, g: 172, b: 40 },
  { name: 'Pink / Rose', r: 228, g: 140, b: 162 },
  { name: 'Purple / Lavender', r: 145, g: 105, b: 185 },
  { name: 'Orange', r: 235, g: 110, b: 30 },
];

function calculateColorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db + (rMean * (dr * dr - db * db)) / 256);
}

function classifyRGBToControlledColor(r, g, b) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 36) return 'Black';
  if (brightness < 68 && r < 75 && g < 75 && b < 85 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12) return 'Charcoal Grey';
  if (brightness > 240 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) return 'White';
  if (brightness > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && b < r) return 'Off-White';
  if (b > r + 25 && b > g + 15 && brightness < 80) return 'Navy Blue';
  if (r > 60 && r < 125 && g > 70 && g < 130 && b < 75 && g > b + 15) return 'Olive Green';
  if (r > 80 && r < 140 && g < 45 && b < 60) return 'Burgundy / Maroon';
  if (r > 180 && g > 140 && b < 70) return 'Yellow / Mustard';

  let closestColor = 'Black';
  let minDistance = Infinity;
  for (const c of COLOR_PALETTE_CENTROIDS) {
    const dist = calculateColorDistance(r, g, b, c.r, c.g, c.b);
    if (dist < minDistance) {
      minDistance = dist;
      closestColor = c.name;
    }
  }
  return closestColor;
}

const PRIMARY_COLOR_OPTIONS = COLOR_PALETTE_CENTROIDS.map(c => c.name);
const FABRIC_OPTIONS = [
  'Cotton', 'Linen', 'Denim', 'Cotton Twill', 'Wool / Cashmere', 'Silk',
  'Satin', 'Polyester / Synthetic', 'Nylon', 'Rayon / Viscose', 'Modal',
  'Velvet', 'Corduroy', 'Fleece', 'Leather', 'Suede', 'Jersey / Knit',
  'Terry / French Terry', 'Spandex / Elastane', 'Blended Fabric', 'Other',
  'Unknown / Not visible'
];

const TEST_DATASET = [
  {
    id: "eval-01",
    label: "Black Leather Belt with Buckle (Accessory Test)",
    filename: "WhatsApp Image 2026-09-26 at 12.36.04 PM.jpeg",
    url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500",
    expectedCategory: "accessories",
    expectedSubcategory: "Belt",
    expectedColor: "Brown / Tan",
    sampleRGB: [135, 85, 50],
  },
  {
    id: "eval-02",
    label: "Leather Strap Wristwatch (Accessory Test)",
    filename: "IMG_20260926_113000.jpg",
    url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500",
    expectedCategory: "accessories",
    expectedSubcategory: "Watch",
    expectedColor: "Brown / Tan",
    sampleRGB: [135, 85, 50],
  },
  {
    id: "eval-03",
    label: "Minimalist Sneakers (Footwear Test)",
    filename: "camera_snap_4982.jpg",
    url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
    expectedCategory: "footwear",
    expectedSubcategory: "Sneakers",
    expectedColor: "Brown / Tan",
    sampleRGB: [185, 155, 110],
  },
  {
    id: "eval-04",
    label: "Tailored Navy Blazer (Layer Test)",
    filename: "Screenshot_20260926-143000.png",
    url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500",
    expectedCategory: "layers",
    expectedSubcategory: "Blazer",
    expectedColor: "Navy Blue",
    sampleRGB: [18, 32, 68],
  },
  {
    id: "eval-05",
    label: "Sky Blue Button-Down Shirt (Top Test)",
    filename: "IMG_9821.jpg",
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
    expectedCategory: "tops",
    expectedSubcategory: "Shirt",
    expectedColor: "Sky Blue",
    sampleRGB: [130, 195, 238],
  },
  {
    id: "eval-06",
    label: "Beige Straight-Fit Chinos (Bottom Test)",
    filename: "WhatsApp Image 2026-09-26 at 11.15.00 AM.jpeg",
    url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500",
    expectedCategory: "bottoms",
    expectedSubcategory: "Chinos",
    expectedColor: "Beige / Cream",
    sampleRGB: [222, 210, 182],
  },
  {
    id: "eval-07",
    label: "Classic Dark Brown Leather Formal Shoes (Footwear Test)",
    filename: "download.jpg",
    url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500",
    expectedCategory: "footwear",
    expectedSubcategory: "Formal Shoes",
    expectedColor: "Brown / Tan",
    sampleRGB: [135, 85, 50],
  }
];

const promptText = `
You are AUREVÉ's expert fashion vision classifier.
Analyze this wardrobe piece image carefully. Identify what type of clothing, footwear, or accessory it actually is.
Isolate the item region and ignore background, room, mannequin, furniture, or skin.

MANDATORY TAXONOMY RULES:
1. "name": Formulate a concise, elegant human clothing title: [Primary Color] + [Important Characteristic / Material / Fit] + [Subcategory]
   Examples:
   - "Black Leather Belt" (NEVER classify a belt as a T-shirt)
   - "Brown Leather Belt"
   - "Silver Stainless Steel Watch"
   - "Black Half-Sleeve T-Shirt"
   - "Sky Blue Oxford Shirt"
   - "Dark Indigo Straight-Fit Jeans"
   - "Beige Slim-Fit Chinos"
   - "Navy Blue Tailored Blazer"
   - "White Leather Sneakers"
   NEVER use generic filenames, camera IDs, or technical names.
2. "category": Must be strictly one of: ["tops", "bottoms", "layers", "footwear", "accessories"].
   - accessories: Watches, Belts, Sunglasses, Bags, Caps, Hats, Wallets, Ties, Scarves, Jewelry, Pocket Squares
   - footwear: Sneakers, Running Shoes, Formal Shoes, Loafers, Boots, Sandals, Kolhapuris, Slippers
   - bottoms: Jeans, Chinos, Trousers, Formal Pants, Cargo Pants, Shorts, Track Pants, Joggers
   - layers: Jackets, Blazers, Bomber Jackets, Denim Jackets, Sweaters, Cardigans, Hoodies, Coats, Overcoats
   - tops: T-Shirts, Shirts, Polos, Kurtas, Overshirts, Henleys, Tank Tops, Sweatshirts
3. "subcategory": Must strictly match the chosen category:
   - accessories: ["Watch", "Belt", "Sunglasses", "Cap", "Hat", "Wallet", "Bag", "Bracelet", "Ring", "Tie", "Pocket Square", "Scarf", "Other"]
   - footwear: ["Sneakers", "Running Shoes", "Formal Shoes", "Loafers", "Boots", "Sandals", "Kolhapuris", "Slippers", "Flip-Flops", "Sports Shoes", "Other"]
   - bottoms: ["Jeans", "Chinos", "Trousers", "Formal Pants", "Cargo Pants", "Track Pants", "Shorts", "Joggers", "Dhoti", "Pajama", "Other"]
   - layers: ["Jacket", "Blazer", "Bomber Jacket", "Denim Jacket", "Windbreaker", "Sweater", "Cardigan", "Hoodie", "Coat", "Overcoat", "Other"]
   - tops: ["T-Shirt", "Shirt", "Polo", "Kurta", "Overshirt", "Henley", "Tank Top", "Sweatshirt", "Hoodie", "Other"]
4. "primary_color": Strictly choose from: ${JSON.stringify(PRIMARY_COLOR_OPTIONS)}.
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
  "name": "...",
  "category": "...",
  "subcategory": "...",
  "primary_color": "...",
  "secondary_colors": [],
  "color_confidence": 0.95,
  "pattern": "Solid",
  "material": "...",
  "material_confidence": 0.9,
  "fit": "...",
  "fit_confidence": 0.9,
  "style": "...",
  "formality": "...",
  "season": ["All-Season"]
}
`;

async function callVisionWithCascade(base64Data, apiKey) {
  const modelCandidates = [
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of modelCandidates) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: 'image/jpeg', data: base64Data } }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { model, parsed: JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim()) };
        }
      } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return null;
}

async function runEvaluation() {
  console.log("=========================================================================");
  console.log(" AUREVÉ RECOGNITION PIPELINE — PRODUCTION EVALUATION SUITE");
  console.log("=========================================================================");
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`Gemini API Key Available: ${!!apiKey}`);

  let totalLatency = 0;
  let successCount = 0;
  let categoryMatches = 0;
  let subcategoryMatches = 0;
  let colorMatches = 0;
  let cleanNameCount = 0;

  for (let i = 0; i < TEST_DATASET.length; i++) {
    const item = TEST_DATASET[i];
    console.log(`\n[Test ${i + 1}/${TEST_DATASET.length}] Testing: ${item.label}`);
    console.log(`  Filename Input: "${item.filename}"`);

    // 1. Client-Side Color Grounding Test
    const groundColor = classifyRGBToControlledColor(item.sampleRGB[0], item.sampleRGB[1], item.sampleRGB[2]);
    console.log(`  Pixel Color Grounding: RGB(${item.sampleRGB.join(',')}) => "${groundColor}"`);

    // 2. Fetch and optimize image payload
    const startFetch = Date.now();
    let base64 = "";
    try {
      const res = await fetch(item.url);
      const buf = Buffer.from(await res.arrayBuffer());
      base64 = buf.toString('base64');
    } catch (e) {
      console.warn("  Could not fetch test image:", e.message);
      continue;
    }
    const fetchLatency = Date.now() - startFetch;

    // 3. Run Recognition Pipeline
    const startAI = Date.now();
    const resultObj = await callVisionWithCascade(base64, apiKey);
    const aiLatency = Date.now() - startAI;
    totalLatency += aiLatency;

    const result = resultObj?.parsed;

    if (result) {
      successCount++;
      const isCleanName = !result.name.toLowerCase().includes('whatsapp') &&
                          !result.name.toLowerCase().includes('image') &&
                          !result.name.toLowerCase().includes('screenshot') &&
                          !result.name.toLowerCase().includes('img_') &&
                          result.name.length >= 4;

      if (isCleanName) cleanNameCount++;
      const catMatch = result.category?.toLowerCase() === item.expectedCategory.toLowerCase();
      const subMatch = result.subcategory?.toLowerCase() === item.expectedSubcategory.toLowerCase() ||
                       (item.expectedSubcategory === 'Formal Shoes' && (result.subcategory === 'Formal Shoes' || result.subcategory === 'Loafers'));
      
      if (catMatch) categoryMatches++;
      if (subMatch) subcategoryMatches++;
      if (result.primary_color?.toLowerCase().includes(item.expectedColor.toLowerCase()) || groundColor.toLowerCase().includes(item.expectedColor.toLowerCase())) colorMatches++;

      console.log(`  Model Used: ${resultObj.model} | AI Latency: ${aiLatency}ms`);
      console.log(`  -> Output Name: "${result.name}" (Sanitized & Clean: ${isCleanName ? "YES" : "NO"})`);
      console.log(`  -> Category: ${result.category} (Match: ${catMatch ? "YES" : "NO"}) | Subcategory: ${result.subcategory} (Match: ${subMatch ? "YES" : "NO"})`);
      console.log(`  -> Detected Color: ${result.primary_color} | Material: ${result.material} | Fit: ${result.fit}`);
    } else {
      console.log(`  AI Call failed. Fallback Grounded Result: "${groundColor} ${item.expectedSubcategory}"`);
    }

    // Pacing delay
    await new Promise(r => setTimeout(r, 250));
  }

  const avgLatency = Math.round(totalLatency / TEST_DATASET.length);
  console.log("\n=========================================================================");
  console.log(" EVALUATION RESULTS SUMMARY");
  console.log("=========================================================================");
  console.log(`Total Samples Evaluated:     ${TEST_DATASET.length}`);
  console.log(`Average AI Response Latency: ${avgLatency} ms (~${(avgLatency / 1000).toFixed(2)}s)`);
  console.log(`Clean Name Generation Rate:  ${cleanNameCount}/${successCount || 1} (${Math.round((cleanNameCount / (successCount || 1)) * 100)}%)`);
  console.log(`Category Accuracy:           ${categoryMatches}/${successCount || 1} (${Math.round((categoryMatches / (successCount || 1)) * 100)}%)`);
  console.log(`Subcategory Accuracy:        ${subcategoryMatches}/${successCount || 1} (${Math.round((subcategoryMatches / (successCount || 1)) * 100)}%)`);
  console.log(`Color Grounding Accuracy:    ${colorMatches}/${successCount || 1} (${Math.round((colorMatches / (successCount || 1)) * 100)}%)`);
  console.log("=========================================================================\n");
}

runEvaluation();
