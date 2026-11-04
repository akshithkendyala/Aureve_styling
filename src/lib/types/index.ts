export type MainCategory = 'tops' | 'bottoms' | 'layers' | 'footwear' | 'accessories';

export type TopSubcategory =
  | 'shirt'
  | 't-shirt'
  | 'polo'
  | 'overshirt'
  | 'kurta'
  | 'kurti'
  | 'blouse'
  | 'crop_top'
  | 'tunic'
  | 'tank_top'
  | 'camisole'
  | 'peplum_top'
  | 'sweater'
  | 'dress'
  | 'saree'
  | 'other_top';

export type BottomSubcategory =
  | 'jeans'
  | 'trousers'
  | 'chinos'
  | 'shorts'
  | 'track_pants'
  | 'wide_leg_pants'
  | 'palazzo'
  | 'skirt'
  | 'culottes'
  | 'cargo_pants'
  | 'salwar'
  | 'churidar'
  | 'leggings'
  | 'sharara'
  | 'dhoti'
  | 'pajama'
  | 'ethnic_bottom';

export type LayerSubcategory =
  | 'jacket'
  | 'hoodie'
  | 'sweater'
  | 'blazer'
  | 'vest'
  | 'shrug'
  | 'cardigan'
  | 'coat'
  | 'nehru_jacket'
  | 'bomber_jacket'
  | 'denim_jacket';

export type FootwearSubcategory =
  | 'sneakers'
  | 'formal_shoes'
  | 'loafers'
  | 'sandals'
  | 'slippers'
  | 'boots'
  | 'kolhapuris'
  | 'heels'
  | 'flats'
  | 'juttis'
  | 'mojaris'
  | 'wedges'
  | 'slides';

export type AccessorySubcategory =
  | 'watch'
  | 'belt'
  | 'sunglasses'
  | 'cap'
  | 'bracelet'
  | 'bag'
  | 'handbag'
  | 'sling_bag'
  | 'tote'
  | 'earrings'
  | 'necklace'
  | 'jewellery'
  | 'scarf'
  | 'dupatta'
  | 'ring'
  | 'perfume'
  | 'other';

export type Subcategory =
  | TopSubcategory
  | BottomSubcategory
  | LayerSubcategory
  | FootwearSubcategory
  | AccessorySubcategory;

export type OccasionType =
  | 'College'
  | 'Office'
  | 'Interview'
  | 'Date'
  | 'Dinner'
  | 'Party'
  | 'Wedding'
  | 'Family Function'
  | 'Festival'
  | 'Travel'
  | 'Gym'
  | 'Casual Outing'
  | 'Home'
  | 'Custom';

export type ItemRole = 'top' | 'bottom' | 'footwear' | 'layer' | 'accessory';

export interface User {
  id: string; // Supabase auth.users.id
  email?: string;
  name: string; // Preferred app name
  mobile_number?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Non-binary / Other' | 'Prefer not to say' | string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type SkinUndertoneCategory =
  | 'Warm Olive'
  | 'Medium Wheatish'
  | 'Dusky'
  | 'Deep Tan'
  | 'Fair';

export type BodyBuildCategory = 'Slim' | 'Athletic' | 'Medium' | 'Broad';

export interface SkinScanResult {
  success: boolean;
  skin_undertone?: SkinUndertoneCategory;
  confidence?: number;
  undertone_nuance?: string;
  styling_advice?: string;
  quality_checks?: {
    face_detected: boolean;
    face_centered: boolean;
    lighting_adequate: boolean;
    quality_ok: boolean;
  };
  rejection_reason?: string;
  error?: string;
}

export interface BodyScanResult {
  success: boolean;
  body_build?: BodyBuildCategory;
  confidence?: number;
  silhouette_characteristics?: string;
  proportion_advice?: string;
  quality_checks?: {
    full_body_detected: boolean;
    head_visible: boolean;
    feet_visible: boolean;
    lighting_adequate: boolean;
    quality_ok: boolean;
  };
  rejection_reason?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  user_id: string; // Supabase auth.users.id
  email?: string;
  name?: string; // Preferred app name (e.g. "Akshith")
  full_name?: string;
  mobile_number?: string; // Required Indian mobile number (+91XXXXXXXXXX)
  age?: number; // Required user age
  gender?: 'Male' | 'Female' | 'Non-binary / Other' | 'Prefer not to say' | string;
  height?: string; // e.g., "5'10\"" or "178 cm"
  weight?: string; // e.g., "72 kg" or "158 lb"
  body_build?: BodyBuildCategory | string;
  body_scan_confidence?: number;
  skin_tone?: SkinUndertoneCategory | string; // e.g., "Warm Olive", "Dusky", "Fair", "Deep Tan"
  skin_scan_confidence?: number;
  preferred_fit?: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized';
  favorite_colors: string[];
  avoided_colors: string[];
  style_preferences: string[]; // e.g. ["Minimal", "Smart Casual", "Modern Indian"]
  comfort_preference?: 'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness';
  typical_occasions?: string[]; // e.g. ["Office", "Casual outings", "Dates", "Weddings / functions"]
  city?: string;
  profile_completed?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  category: MainCategory;
  subcategory: Subcategory | string;
  primary_color: string;
  secondary_colors?: string[];
  pattern?: string; // Solid, Striped, Checked, Textured, Floral, Printed
  material?: string; // Cotton, Linen, Denim, Wool, Silk, Polyester, Leather
  fit?: string; // Slim, Regular, Relaxed, Tailored, Oversized
  style?: string; // Smart Casual, Minimal, Casual, Formal, Ethnic, Streetwear
  formality?: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';
  season?: string[]; // Summer, Monsoon, Winter, All-Season, Spring
  is_favorite?: boolean;
  is_archived?: boolean;
  times_worn: number;
  last_worn_at?: string | null;
  collection_ids?: string[];
  collections?: { id: string; name: string; slug: string }[];
  created_at: string;
  updated_at?: string;
}

export interface WeatherData {
  city: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  temperature: number; // in Celsius
  feels_like?: number;
  condition: string; // "Clear", "Partly Cloudy", "Rain", "Humid", "Cool"
  humidity: number; // percentage
  rain_probability?: number;
  wind_speed?: number; // km/h
  uv_index?: number;
  summary: string;
  is_forecast?: boolean;
  forecast_time?: string;
  last_updated?: string;
}

export interface OutfitItemReference {
  wardrobe_item_id: string;
  role: ItemRole;
  item?: WardrobeItem;
}

export interface MissingItemSuggestion {
  title: string;
  suggested_item: string;
  reason: string;
  why_it_works: string;
  category: 'tops' | 'bottoms' | 'footwear' | 'layers' | 'accessories';
  priority: 'essential' | 'recommended';
}

export interface CustomOccasionContext {
  rawText: string;
  interpretedOccasionName: string;
  matchedBaseOccasion: string; // key from OCCASION_RULES (e.g. party, interview, dinner, college, etc.)
  formality: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';
  environment?: 'Indoor' | 'Outdoor' | 'Rooftop' | 'Transit' | 'Gym' | 'General';
  timeContext?: 'Morning' | 'Day' | 'Evening' | 'Night' | 'Any';
  vibe?: string;
  styleDirection: string[];
  weatherRelevance?: boolean;
  specialRequirements?: string[];
}

export interface OutfitScoreBreakdown {
  color_harmony: number; // 0 to 10
  style_cohesion: number; // 0 to 10
  fit_and_proportion: number; // 0 to 10
  occasion_fit: number; // 0 to 10
  footwear_compatibility: number; // 0 to 10
  accessory_balance: number; // 0 to 10
}

export interface OutfitSuggestionAlternative {
  type: 'KEEP' | 'IMPROVE' | 'ELEVATE' | 'CASUAL' | 'FORMAL';
  title: string;
  description: string;
  swapped_item?: WardrobeItem | null;
  target_role?: ItemRole;
}

export interface SelfStyledAnalysis {
  overall_score: number; // out of 10 e.g. 8.4
  breakdown: OutfitScoreBreakdown;
  verdict: string; // e.g. "Polished Contemporary"
  what_works: string;
  how_to_improve: string;
  wardrobe_alternatives: OutfitSuggestionAlternative[];
  occasion?: string;
}

export interface RecommendedMissingItem {
  name: string; // e.g. "Beige Straight-Fit Trousers"
  category: 'tops' | 'bottoms' | 'footwear' | 'layers' | 'accessories';
  reason: string; // e.g. "Creates a clean, balanced smart-casual look."
  why_it_works: string; // e.g. "Balances proportions and neutral tones for Indian campus/work settings."
  priority: 'essential' | 'recommended';
  color_suggestion?: string;
  fabric_suggestion?: string;
  substitutes?: string[];
}

export interface SuggestedCombination {
  name: string; // e.g. "Modern Smart Casual"
  combination: string[]; // ["Black Shirt (In your wardrobe)", "Beige Straight-Fit Trousers", "White Minimal Sneakers"]
  styling_tip: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  occasion: OccasionType | string;
  custom_occasion_text?: string | null;
  interpreted_occasion?: string | null;
  collection?: string | null; // e.g. "College & Work" or "Everyday"
  collection_id?: string | null;
  wardrobe_completeness?: 'complete' | 'partial' | 'single_item';
  conflict_note?: string | null;
  date: string;
  time?: string;
  location?: string;
  weather_data?: WeatherData | null;
  title: string;
  ai_explanation: string;
  style_match: number; // 0-100 percentage
  style_direction: string[]; // e.g., ["Simple", "Classy", "Modern"]
  items: OutfitItemReference[];
  alternative_looks?: AlternativeLook[];
  missing_item?: MissingItemSuggestion | null;
  recommended_missing_items?: RecommendedMissingItem[];
  suggested_combinations?: SuggestedCombination[];
  is_self_styled?: boolean;
  self_styled_analysis?: SelfStyledAnalysis | null;
  created_at: string;
  worn?: boolean;
}

export type CollectionSlug =
  | 'everyday'
  | 'college_work'
  | 'traditional_festive'
  | 'party_occasions'
  | 'home_comfort'
  | 'outdoor_travel'
  | string;

export interface WardrobeCollection {
  id: string;
  user_id: string;
  name: string;
  slug: CollectionSlug;
  description: string;
  collection_type: 'system' | 'custom';
  icon: string; // e.g., "Sun", "Briefcase", "Sparkles", "PartyPopper", "Home", "Plane", "FolderHeart"
  item_count?: number;
  preview_image_urls?: string[];
  created_at: string;
  updated_at?: string;
}

export interface WardrobeCollectionItem {
  id: string;
  collection_id: string;
  wardrobe_item_id: string;
  user_id: string;
  created_at: string;
}

export interface DefaultCollectionDef {
  name: string;
  slug: CollectionSlug;
  description: string;
  icon: string;
  keywords: string[];
}

export const DEFAULT_COLLECTION_DEFINITIONS: DefaultCollectionDef[] = [
  {
    name: 'Everyday',
    slug: 'everyday',
    description: 'Regular casual clothing, frequently used tees, everyday shirts, jeans, and comfortable daily footwear.',
    icon: 'Sun',
    keywords: ['casual', 't-shirt', 'shirt', 'jeans', 'chinos', 'sneakers', 'sandals', 'daily'],
  },
  {
    name: 'College & Work',
    slug: 'college_work',
    description: 'College outfits, smart casuals, office formal shirts & trousers, interview wear, and presentation styles.',
    icon: 'Briefcase',
    keywords: ['formal', 'shirt', 'trousers', 'blazer', 'polo', 'chinos', 'loafers', 'shoes', 'work', 'college', 'office', 'interview'],
  },
  {
    name: 'Traditional & Festive',
    slug: 'traditional_festive',
    description: 'Kurtas, ethnic wear, sarees, lehengas, festive footwear, wedding guest outfits, and Indo-Western attire.',
    icon: 'Sparkles',
    keywords: ['kurta', 'kurti', 'saree', 'lehenga', 'ethnic', 'festive', 'juttis', 'mojaris', 'kolhapuris', 'nehru jacket', 'dupatta', 'anarkali', 'sharara', 'dhoti', 'pajama'],
  },
  {
    name: 'Party & Occasions',
    slug: 'party_occasions',
    description: 'Statement party shirts, stylish tees, night-out jeans, dresses, dinner outfits, and celebration partywear.',
    icon: 'PartyPopper',
    keywords: ['party', 'evening', 'dress', 'club', 'dinner', 'birthday', 'black shirt', 'stylish', 'sleek', 'boots', 'heels'],
  },
  {
    name: 'Home & Comfort',
    slug: 'home_comfort',
    description: 'Relaxed shorts, banyans, track pants, comfortable tees, nightwear, and everyday home loungewear.',
    icon: 'Home',
    keywords: ['shorts', 'track pants', 'joggers', 't-shirt', 'banyan', 'vest', 'slippers', 'slides', 'pajama', 'nightwear', 'loungewear', 'home'],
  },
  {
    name: 'Outdoor & Travel',
    slug: 'outdoor_travel',
    description: 'Travel-friendly outfits, walking layers, utility pants, weather-appropriate pieces, and transit footwear.',
    icon: 'Plane',
    keywords: ['travel', 'jacket', 'hoodie', 'cargo', 'walking shoes', 'sneakers', 'backpack', 'sunglasses', 'windbreaker', 'outdoor'],
  },
];

export interface AlternativeLook {
  title: string; // e.g. "Look 02 — More Relaxed"
  badge: string; // "Relaxed" | "Formal" | "Contemporary"
  description: string;
  items: OutfitItemReference[];
}

export interface OutfitFeedback {
  id: string;
  user_id: string;
  outfit_id: string;
  rating: 'Loved it' | 'Good' | 'Average' | "Didn't like it" | number;
  feedback_tags: string[]; // e.g. ["Very comfortable", "Loved the colors", "Too formal", "Didn't like the fit"]
  comment?: string;
  created_at: string;
}

export interface PreferenceSignal {
  attributeType: 'color' | 'fit' | 'style' | 'footwear' | 'formality' | 'pattern' | 'material' | 'garment_type';
  attributeValue: string;
  score: number; // -1.0 to +1.0
  confidence: number; // 0.0 to 1.0
  evidenceCount: number;
  positiveCount: number;
  negativeCount: number;
  recencyWeightedScore: number;
  signalStrength: 'weak' | 'emerging' | 'strong';
  lastObservedAt: string;
}

export interface ItemPerformanceStats {
  itemId: string;
  timesRecommended: number;
  timesWorn: number;
  ratings: number[];
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  lastRatingAt: string;
}

export interface OccasionStylePreference {
  occasion: string;
  preferredFits: { [fit: string]: PreferenceSignal };
  preferredFootwear: { [footwear: string]: PreferenceSignal };
  preferredStyles: { [style: string]: PreferenceSignal };
  preferredColors: { [color: string]: PreferenceSignal };
}

export interface LearnedStyleProfile {
  userId: string;
  totalFeedbacks: number;
  averageRating: number;
  itemStats: { [itemId: string]: ItemPerformanceStats };
  colorPreferences: { [color: string]: PreferenceSignal };
  fitPreferences: { [fit: string]: PreferenceSignal };
  stylePreferences: { [style: string]: PreferenceSignal };
  footwearPreferences: { [footwear: string]: PreferenceSignal };
  patternPreferences: { [pattern: string]: PreferenceSignal };
  formalityPreferences: { [formality: string]: PreferenceSignal };
  occasionPreferences: { [occasion: string]: OccasionStylePreference };
  combinationScores: { [fingerprint: string]: { score: number; evidence: number } };
  stylistObservations: string[];
}


export interface AIClassificationResult {
  category: MainCategory;
  subcategory: string;
  name: string;
  primary_color: string;
  secondary_colors: string[];
  color_confidence?: number;
  pattern: string;
  material?: string;
  material_confidence?: number;
  fit: string;
  fit_confidence?: number;
  style: string;
  formality: 'Casual' | 'Smart Casual' | 'Semi-Formal' | 'Formal' | 'Festive';
  season: string[];
}

export interface WardrobeStats {
  total: number;
  tops: number;
  bottoms: number;
  layers: number;
  footwear: number;
  accessories: number;
  favorites: number;
  archived: number;
  mostWornItem?: WardrobeItem | null;
  leastWornItem?: WardrobeItem | null;
  dominantColors: { color: string; count: number }[];
  styleInsights: string[];
}
