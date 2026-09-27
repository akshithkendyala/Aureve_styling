import { CustomOccasionContext } from '@/lib/types';
import { OccasionRule, OCCASION_RULES, getOccasionRule } from '@/lib/ai/occasionRules';

/**
 * Fast deterministic semantic analyzer for custom occasion descriptions
 */
export function parseCustomOccasionDeterministic(
  text: string,
  baseOccasionHint?: string
): CustomOccasionContext {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Environment
  let environment: CustomOccasionContext['environment'] = 'General';
  if (lower.includes('rooftop') || lower.includes('terrace')) {
    environment = 'Rooftop';
  } else if (
    lower.includes('outdoor') ||
    lower.includes('lawn') ||
    lower.includes('garden') ||
    lower.includes('beach') ||
    lower.includes('pool') ||
    lower.includes('open-air')
  ) {
    environment = 'Outdoor';
  } else if (lower.includes('gym') || lower.includes('track') || lower.includes('field')) {
    environment = 'Gym';
  } else if (lower.includes('transit') || lower.includes('airport') || lower.includes('flight') || lower.includes('train')) {
    environment = 'Transit';
  } else if (lower.includes('indoor') || lower.includes('hall') || lower.includes('ballroom') || lower.includes('restaurant')) {
    environment = 'Indoor';
  }

  // 2. Detect Time Context
  let timeContext: CustomOccasionContext['timeContext'] = 'Any';
  if (lower.includes('tonight') || lower.includes('night') || lower.includes('late evening') || lower.includes('club')) {
    timeContext = 'Night';
  } else if (lower.includes('evening') || lower.includes('sundown') || lower.includes('sunset') || lower.includes('dinner')) {
    timeContext = 'Evening';
  } else if (lower.includes('morning') || lower.includes('breakfast') || lower.includes('brunch')) {
    timeContext = 'Morning';
  } else if (lower.includes('afternoon') || lower.includes('day') || lower.includes('lunch')) {
    timeContext = 'Day';
  }

  // 3. Detect Base Occasion Mapping
  let matchedBase = 'casual';
  let interpretedName = 'Curated Custom Look';

  const hasInterviewNegation =
    lower.includes('not as formal as an interview') ||
    lower.includes('not an interview') ||
    lower.includes('unlike an interview') ||
    lower.includes('not formal like an interview');

  if (
    !hasInterviewNegation &&
    (lower.includes('interview') ||
      lower.includes('placement') ||
      lower.includes('job fair') ||
      lower.includes('hiring'))
  ) {
    matchedBase = 'interview';
    interpretedName = 'Interview & Professional Pitch';
  } else if (
    lower.includes('wedding') ||
    lower.includes('sangeet') ||
    lower.includes('mehendi') ||
    lower.includes('haldi') ||
    lower.includes('reception') ||
    lower.includes('shaadi') ||
    lower.includes('engagement') ||
    lower.includes('puja') ||
    lower.includes('pooja') ||
    lower.includes('traditional') ||
    lower.includes('ethnic')
  ) {
    matchedBase = 'wedding';
    interpretedName = 'Celebratory Festive Event';
  } else if (
    lower.includes('diwali') ||
    lower.includes('eid') ||
    lower.includes('navratri') ||
    lower.includes('festival') ||
    lower.includes('festive')
  ) {
    matchedBase = 'festival';
    interpretedName = 'Festive Celebration';
  } else if (
    lower.includes('farewell') ||
    lower.includes('college party') ||
    lower.includes('pub') ||
    lower.includes('club') ||
    lower.includes('birthday') ||
    lower.includes('party') ||
    lower.includes('night out') ||
    lower.includes('bash') ||
    lower.includes('cocktail')
  ) {
    matchedBase = 'party';
    interpretedName = lower.includes('farewell')
      ? 'College Farewell Celebration'
      : lower.includes('birthday')
      ? 'Birthday Social Night'
      : 'Modern Evening Party';
  } else if (
    lower.includes('dinner') ||
    lower.includes('restaurant') ||
    lower.includes('bistro') ||
    lower.includes('manager') ||
    lower.includes('colleague')
  ) {
    matchedBase = 'dinner';
    interpretedName = lower.includes('manager') || lower.includes('client')
      ? 'Executive Professional Dinner'
      : 'Evening Dinner & Dining';
  } else if (
    lower.includes('college') ||
    lower.includes('campus') ||
    lower.includes('university') ||
    lower.includes('class') ||
    lower.includes('lecture')
  ) {
    matchedBase = 'college';
    interpretedName = 'Campus Daily & Presentation';
  } else if (
    lower.includes('date') ||
    lower.includes('candlelight') ||
    lower.includes('romantic') ||
    lower.includes('anniversary')
  ) {
    matchedBase = 'date';
    interpretedName = 'Date Night & Intimate Dining';
  } else if (
    lower.includes('gym') ||
    lower.includes('workout') ||
    lower.includes('training') ||
    lower.includes('running') ||
    lower.includes('badminton') ||
    lower.includes('sports')
  ) {
    matchedBase = 'gym';
    interpretedName = 'Athletic Training & Mobility';
  } else if (
    lower.includes('flight') ||
    lower.includes('airport') ||
    lower.includes('travel') ||
    lower.includes('road trip') ||
    lower.includes('vacation')
  ) {
    matchedBase = 'travel';
    interpretedName = 'Transit Ready & Travel';
  } else if (
    lower.includes('presentation') ||
    lower.includes('client') ||
    lower.includes('keynote') ||
    lower.includes('pitch')
  ) {
    matchedBase = 'presentation';
    interpretedName = 'Executive Keynote Presentation';
  } else if (
    lower.includes('office') ||
    lower.includes('work') ||
    lower.includes('corporate')
  ) {
    matchedBase = 'office';
    interpretedName = 'Workday Corporate Presence';
  } else if (baseOccasionHint && baseOccasionHint.trim().length > 0) {
    // Fallback to user selected base hint if specific keywords not found
    const hintLower = baseOccasionHint.toLowerCase();
    const foundKey = Object.keys(OCCASION_RULES).find((k) => hintLower.includes(k));
    if (foundKey) {
      matchedBase = foundKey;
      interpretedName = OCCASION_RULES[foundKey].name;
    }
  }

  // 4. Formality Determination
  let formality: CustomOccasionContext['formality'] = 'Smart Casual';
  if (matchedBase === 'interview') {
    formality = 'Formal';
  } else if (matchedBase === 'wedding' || matchedBase === 'festival') {
    formality = 'Festive';
  } else if (matchedBase === 'gym' || matchedBase === 'home') {
    formality = 'Casual';
  } else if (lower.includes('not too formal') || lower.includes('casual but classy') || lower.includes('smart casual') || lower.includes('relaxed')) {
    formality = 'Smart Casual';
  } else if (lower.includes('very formal') || lower.includes('black tie') || lower.includes('formal suit')) {
    formality = 'Formal';
  } else if (lower.includes('super casual') || lower.includes('chilled out') || lower.includes('informal')) {
    formality = 'Casual';
  }

  // 5. Style Direction synthesis
  const styleDirection: string[] = [];
  if (formality === 'Formal' || matchedBase === 'interview') {
    styleDirection.push('Executive', 'Clean', 'Structured');
  } else if (formality === 'Festive' || matchedBase === 'wedding') {
    styleDirection.push('Heritage', 'Celebratory', 'Refined');
  } else if (matchedBase === 'party' || lower.includes('stylish')) {
    styleDirection.push('Modern', 'Stylish', 'Confident');
  } else if (matchedBase === 'dinner') {
    styleDirection.push('Refined', 'Subtle', 'Polished');
  } else if (matchedBase === 'college') {
    styleDirection.push('Youthful', 'Relaxed', 'Smart Casual');
  } else {
    styleDirection.push('Modern', 'Simple', 'Classy');
  }

  if (environment === 'Outdoor' && !styleDirection.includes('Breathable')) {
    styleDirection.push('Breathable');
  }

  return {
    rawText: clean,
    interpretedOccasionName: interpretedName,
    matchedBaseOccasion: matchedBase,
    formality,
    environment,
    timeContext,
    vibe: clean,
    styleDirection: Array.from(new Set(styleDirection)).slice(0, 3),
    weatherRelevance: true,
    specialRequirements: environment === 'Outdoor' ? ['Lightweight and breathable textures'] : [],
  };
}

/**
 * Interpret custom occasion with optional Gemini AI reasoning and instant deterministic fallback
 */
export async function interpretCustomOccasion(
  customText: string,
  baseOccasionHint?: string
): Promise<CustomOccasionContext> {
  const fallback = parseCustomOccasionDeterministic(customText, baseOccasionHint);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || customText.trim().length < 5) {
    return fallback;
  }

  try {
    const promptText = `
You are AUREVÉ's master Indian personal fashion stylist.
Analyze the user's natural language occasion description and extract structured styling context.

User Occasion Description: "${customText}"
Optional User-Selected Base Hint: "${baseOccasionHint || 'None'}"

Available Base Occasions: ["party", "interview", "wedding", "festival", "dinner", "date", "college", "office", "presentation", "travel", "gym", "casual", "home"]

Strict JSON Response Schema:
{
  "interpretedOccasionName": "Concise editorial occasion title (e.g. College Farewell Party, Rooftop Dinner with Manager)",
  "matchedBaseOccasion": "One exact key from Available Base Occasions",
  "formality": "One of: Casual | Smart Casual | Semi-Formal | Formal | Festive",
  "environment": "One of: Indoor | Outdoor | Rooftop | Transit | Gym | General",
  "timeContext": "One of: Morning | Day | Evening | Night | Any",
  "styleDirection": ["3 curated style keywords e.g. Modern, Stylish, Confident"]
}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed.matchedBaseOccasion && parsed.formality) {
          return {
            rawText: customText.trim(),
            interpretedOccasionName: parsed.interpretedOccasionName || fallback.interpretedOccasionName,
            matchedBaseOccasion: parsed.matchedBaseOccasion.toLowerCase(),
            formality: parsed.formality,
            environment: parsed.environment || fallback.environment,
            timeContext: parsed.timeContext || fallback.timeContext,
            vibe: customText.trim(),
            styleDirection: parsed.styleDirection || fallback.styleDirection,
            weatherRelevance: true,
            specialRequirements: parsed.environment === 'Outdoor' ? ['Breathable outdoor fabrics'] : [],
          };
        }
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return fallback;
}

/**
 * Construct an adapted OccasionRule tailored to the custom context while maintaining hard safety constraints
 */
export function buildCustomOccasionRule(context: CustomOccasionContext): OccasionRule {
  const baseRule = getOccasionRule(context.matchedBaseOccasion);

  // Clone base rule
  const customRule: OccasionRule = {
    ...baseRule,
    key: `custom_${baseRule.key}`,
    name: context.interpretedOccasionName || baseRule.name,
    description: `Custom Occasion: "${context.rawText}". Interpreted as ${context.interpretedOccasionName} (${context.formality}, ${context.environment || 'General'}).`,
    formalityLevels: [context.formality, ...baseRule.formalityLevels.filter((f) => f !== context.formality)],
  };

  // If outdoor evening event, adapt tips and breathability
  if (context.environment === 'Outdoor' || context.environment === 'Rooftop') {
    customRule.stylingTips = [
      `Tailored for ${context.environment.toLowerCase()} settings with breathable fabrics.`,
      ...baseRule.stylingTips,
    ];
  }

  return customRule;
}
