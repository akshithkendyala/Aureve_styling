import {
  CollectionSlug,
  DEFAULT_COLLECTION_DEFINITIONS,
  MainCategory,
  WardrobeCollection,
  WardrobeItem,
} from '@/lib/types';
import { normalizeSubcategory } from '@/lib/ai/occasionRules';

export interface SuggestedCollectionResult {
  slug: CollectionSlug;
  name: string;
  reason: string;
  confidence: number; // 0.0 - 1.0
}

/**
 * Intelligent collection classifier tailored for Indian middle-class, campus, professional & festive reality.
 * Analyzes garment category, subcategory, title, formality, fit, material, and pattern to determine
 * natural collection assignments. An item can and frequently does belong to multiple collections.
 */
export function suggestCollectionsForItem(item: {
  name: string;
  category: MainCategory;
  subcategory: string;
  primary_color?: string;
  formality?: string;
  style?: string;
  fit?: string;
  material?: string;
  pattern?: string;
}): SuggestedCollectionResult[] {
  const suggestions: SuggestedCollectionResult[] = [];
  const sub = normalizeSubcategory(item.subcategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const formality = (item.formality || 'Casual').toLowerCase();
  const style = (item.style || '').toLowerCase();
  const material = (item.material || '').toLowerCase();
  const cat = item.category;

  const isTraditionalPiece =
    sub.includes('kurta') ||
    sub.includes('kurti') ||
    sub.includes('saree') ||
    sub.includes('lehenga') ||
    sub.includes('salwar') ||
    sub.includes('churidar') ||
    sub.includes('dhoti') ||
    sub.includes('anarkali') ||
    sub.includes('sharara') ||
    sub.includes('juttis') ||
    sub.includes('mojaris') ||
    sub.includes('kolhapuris') ||
    sub.includes('nehru') ||
    sub.includes('dupatta') ||
    name.includes('kurta') ||
    name.includes('kurti') ||
    name.includes('sherwani') ||
    name.includes('ethnic') ||
    name.includes('saree') ||
    name.includes('dupatta') ||
    formality === 'festive';

  const isHomewear =
    sub === 'shorts' ||
    sub === 'track_pants' ||
    sub === 'pajama' ||
    sub === 'slippers' ||
    sub === 'slides' ||
    name.includes('banyan') ||
    name.includes('vest') ||
    name.includes('pyjama') ||
    name.includes('nightwear') ||
    name.includes('lounge') ||
    name.includes('boxer') ||
    (cat === 'footwear' && (sub.includes('slipper') || sub.includes('slide')));

  const isStrictFormal =
    formality === 'formal' ||
    sub === 'blazer' ||
    sub === 'coat' ||
    sub === 'formal_shoes' ||
    name.includes('formal') ||
    name.includes('suit') ||
    name.includes('tuxedo') ||
    (cat === 'footwear' && (name.includes('oxford') || name.includes('derby')));

  const isPartyStyle =
    formality === 'festive' ||
    formality === 'semi-formal' ||
    name.includes('party') ||
    name.includes('club') ||
    name.includes('dinner') ||
    sub === 'dress' ||
    sub === 'blazer' ||
    sub === 'heels' ||
    (cat === 'tops' && (material.includes('satin') || material.includes('silk') || name.includes('black shirt') || name.includes('printed shirt'))) ||
    (cat === 'footwear' && (sub === 'boots' || sub === 'heels' || sub === 'loafers'));

  // 1. TRADITIONAL & FESTIVE
  if (isTraditionalPiece) {
    suggestions.push({
      slug: 'traditional_festive',
      name: 'Traditional & Festive',
      reason: 'Authentic Indian ethnic silhouette ideal for festivals, cultural ceremonies, and wedding functions.',
      confidence: 0.98,
    });
  }

  // Casual cotton kurtis can also be worn everyday or to college
  if (isTraditionalPiece && (sub === 'kurti' || sub === 'kurta') && (material.includes('cotton') || formality === 'casual' || formality === 'smart casual')) {
    suggestions.push({
      slug: 'college_work',
      name: 'College & Work',
      reason: 'Breathable cotton ethnic silhouette widely embraced for dignified daily campus and office wear in India.',
      confidence: 0.88,
    });
    suggestions.push({
      slug: 'everyday',
      name: 'Everyday',
      reason: 'Comfortable everyday ethnic piece suited for daily routines.',
      confidence: 0.82,
    });
  }

  // 2. HOME & COMFORT
  if (isHomewear) {
    suggestions.push({
      slug: 'home_comfort',
      name: 'Home & Comfort',
      reason: 'Relaxed, high-comfort fabric optimized for rest, lounging, and everyday home wear.',
      confidence: 0.96,
    });
  }

  // 3. COLLEGE & WORK
  if (
    !isHomewear &&
    !isTraditionalPiece &&
    (
      isStrictFormal ||
      sub === 'shirt' ||
      sub === 'polo' ||
      sub === 'trousers' ||
      sub === 'chinos' ||
      sub === 'blazer' ||
      sub === 'formal_shoes' ||
      sub === 'loafers' ||
      sub === 'watch' ||
      sub === 'belt' ||
      (sub === 'jeans' && formality !== 'casual') ||
      (sub === 'sneakers' && (style.includes('minimal') || style.includes('smart'))) ||
      formality === 'smart casual' ||
      formality === 'formal' ||
      formality === 'semi-formal'
    )
  ) {
    suggestions.push({
      slug: 'college_work',
      name: 'College & Work',
      reason: 'Structured and composed styling suitable for academic campuses, office environments, and professional meetings.',
      confidence: 0.92,
    });
  }

  // Clean t-shirts or overshirts in smart casual fit for college
  if (
    (sub === 't-shirt' || sub === 'overshirt' || sub === 'sweater' || sub === 'cardigan') &&
    formality !== 'formal' &&
    !isHomewear
  ) {
    suggestions.push({
      slug: 'college_work',
      name: 'College & Work',
      reason: 'Clean contemporary daily campus piece suitable for lectures and smart casual study environments.',
      confidence: 0.78,
    });
  }

  // 4. EVERYDAY
  if (
    !isStrictFormal &&
    (
      sub === 't-shirt' ||
      sub === 'shirt' ||
      sub === 'polo' ||
      sub === 'jeans' ||
      sub === 'chinos' ||
      sub === 'sneakers' ||
      sub === 'sandals' ||
      sub === 'flats' ||
      sub === 'overshirt' ||
      sub === 'jacket' ||
      sub === 'bag' ||
      sub === 'sunglasses' ||
      formality === 'casual' ||
      formality === 'smart casual'
    )
  ) {
    suggestions.push({
      slug: 'everyday',
      name: 'Everyday',
      reason: 'Versatile, effortless staple designed for daily routines, grocery runs, casual catchups, and errands.',
      confidence: 0.94,
    });
  }

  // 5. PARTY & OCCASIONS
  if (
    isPartyStyle ||
    (
      (sub === 'shirt' || sub === 'dress' || sub === 'blazer' || sub === 'trousers' || sub === 'jeans') &&
      (name.includes('black') || name.includes('dark') || name.includes('satin') || name.includes('print') || formality === 'semi-formal' || formality === 'smart casual')
    )
  ) {
    suggestions.push({
      slug: 'party_occasions',
      name: 'Party & Occasions',
      reason: 'Polished or statement silhouette suited for evening gatherings, birthdays, parties, dinners, and celebrations.',
      confidence: 0.85,
    });
  }

  // 6. OUTDOOR & TRAVEL
  if (
    sub === 'jacket' ||
    sub === 'hoodie' ||
    sub === 'sweater' ||
    sub === 'cargo_pants' ||
    sub === 'track_pants' ||
    sub === 'sneakers' ||
    sub === 'boots' ||
    sub === 'sunglasses' ||
    sub === 'cap' ||
    sub === 'bag' ||
    name.includes('travel') ||
    name.includes('windbreaker') ||
    name.includes('cargo') ||
    name.includes('bomber') ||
    (sub === 'shorts' && (material.includes('cotton') || material.includes('linen') || name.includes('cargo')))
  ) {
    suggestions.push({
      slug: 'outdoor_travel',
      name: 'Outdoor & Travel',
      reason: 'Durable, climate-resilient silhouette crafted for transit, travel, airport mobility, and outdoor exploring.',
      confidence: 0.88,
    });
  }

  // If no suggestions triggered, default to Everyday
  if (suggestions.length === 0) {
    suggestions.push({
      slug: 'everyday',
      name: 'Everyday',
      reason: 'Versatile staple suitable for daily wardrobe rotation.',
      confidence: 0.8,
    });
  }

  // Deduplicate by slug and sort by confidence
  const seen = new Set<string>();
  const unique = suggestions.filter((s) => {
    if (seen.has(s.slug)) return false;
    seen.add(s.slug);
    return true;
  });

  return unique.sort((a, b) => b.confidence - a.confidence);
}
