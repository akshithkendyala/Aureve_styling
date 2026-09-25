export type MainCategory = 'tops' | 'bottoms' | 'layers' | 'footwear' | 'accessories';

export type TopSubcategory = 'shirt' | 't-shirt' | 'polo' | 'overshirt' | 'kurta' | 'other_top';
export type BottomSubcategory = 'jeans' | 'trousers' | 'chinos' | 'shorts' | 'track_pants' | 'ethnic_bottom';
export type LayerSubcategory = 'jacket' | 'hoodie' | 'sweater' | 'blazer' | 'vest' | 'nehru_jacket';
export type FootwearSubcategory = 'sneakers' | 'formal_shoes' | 'loafers' | 'sandals' | 'slippers' | 'boots' | 'kolhapuris';
export type AccessorySubcategory = 'watch' | 'belt' | 'sunglasses' | 'cap' | 'bracelet' | 'bag' | 'perfume' | 'other';

export type Subcategory = TopSubcategory | BottomSubcategory | LayerSubcategory | FootwearSubcategory | AccessorySubcategory;

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
  id: string;
  name: string;
  mobile_number: string;
  pin_hash?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  height?: string; // e.g., "5'10\"" or "178 cm"
  weight?: string; // e.g., "72 kg"
  skin_tone?: string; // e.g., "Warm Olive", "Dusky", "Fair", "Deep Tan"
  preferred_fit?: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized';
  favorite_colors: string[];
  avoided_colors: string[];
  style_preferences: string[]; // e.g. ["Minimal", "Smart Casual", "Modern Indian"]
  comfort_preference?: 'Maximum Comfort' | 'Balanced' | 'Structure & Sharpness';
  city?: string;
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
  is_favorite: boolean;
  is_archived: boolean;
  times_worn: number;
  last_worn_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface WeatherData {
  city: string;
  temperature: number; // in Celsius
  feels_like?: number;
  condition: string; // "Clear", "Partly Cloudy", "Rain", "Humid", "Cool"
  humidity: number; // percentage
  rain_probability?: number;
  wind_speed?: number; // km/h
  uv_index?: number;
  summary: string;
}

export interface OutfitItemReference {
  wardrobe_item_id: string;
  role: ItemRole;
  item?: WardrobeItem;
}

export interface Outfit {
  id: string;
  user_id: string;
  occasion: OccasionType | string;
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
  created_at: string;
  worn?: boolean;
}

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
  rating: 'Loved it' | 'Good' | 'Average' | "Didn't like it";
  feedback_tags: string[]; // e.g. ["Very comfortable", "Loved the colors", "Too formal"]
  comment?: string;
  created_at: string;
}

export interface AIClassificationResult {
  category: MainCategory;
  subcategory: string;
  name: string;
  primary_color: string;
  secondary_colors: string[];
  pattern: string;
  material?: string;
  fit: string;
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
