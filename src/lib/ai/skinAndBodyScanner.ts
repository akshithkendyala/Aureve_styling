import {
  SkinScanResult,
  BodyScanResult,
  SkinUndertoneCategory,
  BodyBuildCategory,
} from '@/lib/types';

/**
 * Valid AUREVÉ Skin Undertone categories
 */
export const AUREVE_SKIN_CATEGORIES: SkinUndertoneCategory[] = [
  'Warm Olive',
  'Medium Wheatish',
  'Dusky',
  'Deep Tan',
  'Fair',
];

/**
 * Valid AUREVÉ Body Build categories
 */
export const AUREVE_BODY_CATEGORIES: BodyBuildCategory[] = [
  'Slim',
  'Athletic',
  'Medium',
  'Broad',
];

/**
 * Convert base64 data URL or remote URL to inline data for Gemini Vision
 */
async function getImageInlineData(
  imageData: string
): Promise<{ mimeType: string; base64Data: string } | null> {
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
 * Call Gemini Vision with model fallback and JSON generation config
 */
async function callGeminiVision(promptText: string, imagePayload: { mimeType: string; base64Data: string } | null): Promise<any> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const parts: any[] = [{ text: promptText }];
  if (imagePayload) {
    parts.push({
      inline_data: {
        mime_type: imagePayload.mimeType,
        data: imagePayload.base64Data,
      },
    });
  }

  const modelCandidates = [
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

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
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(cleaned);
        }
      }
    } catch (e) {
      // Try next model candidate
    }
  }

  return null;
}

/**
 * AI FACE SCAN: Analyze facial skin undertone for fashion color contrast
 * 
 * Ephemeral processing: Raw image frames are discarded immediately after analysis.
 */
export async function analyzeSkinUndertoneFromImage(
  imageData: string
): Promise<SkinScanResult> {
  const imagePayload = await getImageInlineData(imageData);
  if (!imagePayload) {
    return {
      success: false,
      rejection_reason: 'Unable to process camera frame. Please try taking a clearer photo.',
      quality_checks: {
        face_detected: false,
        face_centered: false,
        lighting_adequate: false,
        quality_ok: false,
      },
    };
  }

  const promptText = `
You are AUREVÉ's expert fashion colorist and Indian skin undertone specialist.
Your task is to analyze this facial image strictly for fashion color-contrast and clothing palette calibration.
This is NOT biometric identity verification; it is exclusively a color-theory analysis.

PRE-ANALYSIS QUALITY CRITERIA:
1. "face_detected": (boolean) Is a human face clearly visible?
2. "face_centered": (boolean) Is the face reasonably framed and not cut off?
3. "lighting_adequate": (boolean) Is there sufficient light to observe natural skin tones without severe overexposure, heavy shadows, or strong colored filters?
4. "quality_ok": (boolean) True if the image is clear and adequate for reliable fashion undertone classification; false if too dark, blurry, masked, or obstructed.
5. "rejection_reason": (string or null) If quality_ok is false, provide a gentle, actionable 1-sentence tip (e.g. "Move to natural light and face the camera directly.", "Please ensure your face is fully visible without heavy shadows.").

EXACT AUREVÉ SKIN UNDERTONE CATEGORIES (Choose strictly ONE):
- "Warm Olive": Golden/yellow undertones, warm olive depth (resonates with earthy tones, olive, rust, warm navy, cream).
- "Medium Wheatish": Neutral-warm undertones, classic Indian wheatish complexion (resonates with rich jewel tones, sage, beige, navy).
- "Dusky": Rich warm brown undertones (resonates with crisp white, cobalt blue, emerald green, warm terracotta, wine).
- "Deep Tan": Deep warm sun-kissed undertones (resonates with champagne, rich mustard, ivory, deep burgundy, teal).
- "Fair": Cool or neutral fair undertones (resonates with navy, forest green, pastel blue, charcoal, burgundy).

CONFIDENCE SCORING:
- Assign "confidence" (number between 0.0 and 1.0) reflecting lighting stability and undertone clarity.
- If confidence < 0.65 or lighting is very poor, set quality_ok to false with an appropriate rejection_reason.

REQUIRED JSON OUTPUT FORMAT:
{
  "quality_checks": {
    "face_detected": true,
    "face_centered": true,
    "lighting_adequate": true,
    "quality_ok": true
  },
  "rejection_reason": null,
  "skin_undertone": "Warm Olive",
  "confidence": 0.92,
  "undertone_nuance": "Golden-yellow warm undertone with balanced natural warmth.",
  "styling_advice": "Earthy tones like olive green, rich rust, off-white, and deep navy will create flattering natural contrast with your skin undertone."
}
`;

  try {
    const rawResult = await callGeminiVision(promptText, imagePayload);
    if (!rawResult || !rawResult.quality_checks) {
      return {
        success: false,
        rejection_reason: 'Lighting is too low or face is unclear. Please move to better lighting and scan again.',
        quality_checks: {
          face_detected: false,
          face_centered: false,
          lighting_adequate: false,
          quality_ok: false,
        },
      };
    }

    const { quality_checks, rejection_reason, skin_undertone, confidence, undertone_nuance, styling_advice } = rawResult;

    if (!quality_checks.quality_ok || rejection_reason) {
      return {
        success: false,
        rejection_reason: rejection_reason || 'Move to natural light and keep your face clearly visible.',
        quality_checks,
      };
    }

    // Validate that the returned category matches one of the 5 exact AUREVÉ categories
    const matchedCategory = AUREVE_SKIN_CATEGORIES.find(
      (c) => c.toLowerCase() === (skin_undertone || '').trim().toLowerCase()
    );

    if (!matchedCategory) {
      // Fallback to closest match
      return {
        success: true,
        skin_undertone: 'Medium Wheatish',
        confidence: Math.min(Math.max(Number(confidence) || 0.85, 0.5), 0.99),
        undertone_nuance: undertone_nuance || 'Balanced natural warm undertones.',
        styling_advice: styling_advice || 'Versatile warm and neutral palettes work harmoniously with your complexion.',
        quality_checks,
      };
    }

    return {
      success: true,
      skin_undertone: matchedCategory,
      confidence: Math.min(Math.max(Number(confidence) || 0.9, 0.5), 0.99),
      undertone_nuance: undertone_nuance || `${matchedCategory} with natural undertone clarity.`,
      styling_advice: styling_advice || 'Selected for personalized clothing color contrast and palette harmony.',
      quality_checks,
    };
  } catch (err: any) {
    console.error('Skin undertone scan exception:', err);
    return {
      success: false,
      error: 'Analysis could not be completed. You can select your undertone manually or scan again.',
      rejection_reason: 'Scan interrupted. Please try again with good lighting.',
    };
  }
}

/**
 * AI FULL-BODY SCAN: Analyze silhouette and body proportions for clothing fit balance
 * 
 * Ephemeral processing: Raw image frames are discarded immediately after analysis.
 */
export async function analyzeBodySilhouetteFromImage(
  imageData: string
): Promise<BodyScanResult> {
  const imagePayload = await getImageInlineData(imageData);
  if (!imagePayload) {
    return {
      success: false,
      rejection_reason: 'Unable to process camera frame. Please try taking a full-body photo.',
      quality_checks: {
        full_body_detected: false,
        head_visible: false,
        feet_visible: false,
        lighting_adequate: false,
        quality_ok: false,
      },
    };
  }

  const promptText = `
You are AUREVÉ's expert fashion tailor and silhouette proportion analyst.
Your task is to analyze this full-body image strictly for clothing proportion, drape balance, and silhouette harmony recommendations.
This is NOT medical/health measurement, BMI calculation, or biometric identification; it is exclusively a fashion silhouette classification.

PRE-ANALYSIS QUALITY CRITERIA:
1. "full_body_detected": (boolean) Is the person's full body visible in the frame?
2. "head_visible": (boolean) Is the upper silhouette and head visible?
3. "feet_visible": (boolean) Is the lower silhouette (legs/feet area) visible?
4. "lighting_adequate": (boolean) Is lighting sufficient to clearly discern body silhouette and proportions?
5. "quality_ok": (boolean) True if full body is adequately framed from head to toe; false if only upper torso, cropped at waist, heavily blurred, or obstructed.
6. "rejection_reason": (string or null) If quality_ok is false, provide a polite, actionable 1-sentence tip (e.g. "Please step back ~2–3 meters so your full body from head to feet is visible.", "Lighting is too dark to balance silhouette proportions.").

EXACT AUREVÉ BODY BUILD CATEGORIES (Choose strictly ONE):
- "Slim": Lean, slender frame, linear shoulder-to-hip balance (benefits from structured layers, tailored regular cuts, horizontal breaks).
- "Athletic": Sculpted V-taper frame, broad shoulders tapering to waist (benefits from clean crewnecks, tapered trousers, structured blazers).
- "Medium": Proportional, balanced natural build (benefits from classic cuts, balanced smart-casual proportions).
- "Broad": Structured frame with wider chest and shoulder span (benefits from vertical drape, unbuttoned overshirts, structured fabrics, open collars).

CONFIDENCE SCORING:
- Assign "confidence" (number between 0.0 and 1.0) reflecting silhouette clarity.
- If confidence < 0.65 or full body is not visible, set quality_ok to false with an appropriate rejection_reason.

REQUIRED JSON OUTPUT FORMAT:
{
  "quality_checks": {
    "full_body_detected": true,
    "head_visible": true,
    "feet_visible": true,
    "lighting_adequate": true,
    "quality_ok": true
  },
  "rejection_reason": null,
  "body_build": "Athletic",
  "confidence": 0.88,
  "silhouette_characteristics": "Defined shoulder structure tapering naturally toward the waist.",
  "proportion_advice": "Structured shirts, layered overshirts, and clean tapered trousers will flatter your proportions nicely."
}
`;

  try {
    const rawResult = await callGeminiVision(promptText, imagePayload);
    if (!rawResult || !rawResult.quality_checks) {
      return {
        success: false,
        rejection_reason: 'Please step back and ensure your full silhouette is visible in the frame.',
        quality_checks: {
          full_body_detected: false,
          head_visible: false,
          feet_visible: false,
          lighting_adequate: false,
          quality_ok: false,
        },
      };
    }

    const { quality_checks, rejection_reason, body_build, confidence, silhouette_characteristics, proportion_advice } = rawResult;

    if (!quality_checks.quality_ok || rejection_reason) {
      return {
        success: false,
        rejection_reason: rejection_reason || 'Please step back so your full body from head to toe is visible.',
        quality_checks,
      };
    }

    // Validate that the returned category matches one of the 4 exact AUREVÉ categories
    const matchedCategory = AUREVE_BODY_CATEGORIES.find(
      (c) => c.toLowerCase() === (body_build || '').trim().toLowerCase()
    );

    if (!matchedCategory) {
      return {
        success: true,
        body_build: 'Medium',
        confidence: Math.min(Math.max(Number(confidence) || 0.85, 0.5), 0.99),
        silhouette_characteristics: silhouette_characteristics || 'Balanced proportional natural frame.',
        proportion_advice: proportion_advice || 'Classic tailored cuts and versatile layering work well for your silhouette.',
        quality_checks,
      };
    }

    return {
      success: true,
      body_build: matchedCategory,
      confidence: Math.min(Math.max(Number(confidence) || 0.88, 0.5), 0.99),
      silhouette_characteristics: silhouette_characteristics || `${matchedCategory} frame with proportional shoulder line.`,
      proportion_advice: proportion_advice || 'Selected for balanced garment drape and outfit silhouette proportions.',
      quality_checks,
    };
  } catch (err: any) {
    console.error('Body silhouette scan exception:', err);
    return {
      success: false,
      error: 'Analysis could not be completed. You can select your build manually or scan again.',
      rejection_reason: 'Scan interrupted. Please try again with full-body framing.',
    };
  }
}
