// Wine Types

export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified' | 'other';
export type WineStatus = 'owned' | 'consumed' | 'gifted';
export type DrinkingStatus = 'aging' | 'optimal' | 'drink_soon' | 'urgent';
export type DrinkingUrgency = 'drink_now' | 'drink_soon' | 'optimal' | 'can_wait';
export type TagType = 'cellar' | 'location' | 'custom';

export interface TasteProfile {
  body: number | null;
  tannin: number | null;
  acidity: number | null;
  sweetness: number | null;
}

export interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  grape_variety: string[] | null;
  region: string | null;
  country: string | null;
  appellation: string | null;
  abv: number | null;
  type: WineType;
  taste_profile: TasteProfile | null;
  food_pairing: string[] | null;
  flavor_notes: string[] | null;
  serving_temp_min: number | null;
  serving_temp_max: number | null;
  drinking_window_start: number | null;
  drinking_window_end: number | null;
  description: string | null;
  image_url: string | null;
  ai_confidence: number | null;
  ai_analysis: WineAIAnalysis | null;
}

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  color: string;
  sort_order: number;
  wine_count: number;
  created_at: string;
}

export interface WineStatusHistory {
  id: string;
  status: 'consumed' | 'gifted';
  event_date: string;
  quantity: number;
  rating: number | null;
  note: string | null;
  recipient: string | null;
  created_at: string;
}

export interface UserWine {
  id: string;
  quantity: number;
  status: WineStatus;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_place: string | null;
  personal_note: string | null;
  personal_rating: number | null;
  original_image_url: string | null;
  label_number: string | null;
  created_at: string;
  updated_at: string;
  wine: Wine;
  tags: Tag[];
  status_histories: WineStatusHistory[];
  drinking_status: DrinkingStatus | null;
}

export interface UserWineListItem {
  id: string;
  quantity: number;
  status: WineStatus;
  purchase_date: string | null;
  purchase_price: number | null;
  label_number: string | null;
  created_at: string;
  wine: Wine;
  tags: Tag[];
  drinking_status: DrinkingStatus | null;
}

// Request types
export interface UserWineCreateRequest {
  scan_id?: string;
  wine_id?: string;
  wine_overrides?: Partial<Wine>;
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  purchase_place?: string;
  personal_note?: string;
  tag_ids?: string[];
}

export interface UserWineUpdateRequest {
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  purchase_place?: string;
  personal_note?: string;
  tag_ids?: string[];
}

export interface WineStatusUpdateRequest {
  status: 'consumed' | 'gifted';
  quantity_change?: number;
  consumed_date?: string;
  gifted_date?: string;
  rating?: number;
  tasting_note?: string;
  recipient?: string;
}

export interface WineQuantityUpdateRequest {
  action: 'increase' | 'decrease' | 'set';
  amount: number;
}

// Filter types
export interface WineFilterParams {
  status?: WineStatus;
  type?: WineType;
  country?: string;
  grape?: string;
  tag_id?: string;
  tag_ids?: string;
  drinking_window?: 'now' | 'aging' | 'urgent';
  min_price?: number;
  max_price?: number;
  search?: string;
}

// Scan types
export interface ScannedWine {
  name: string;
  producer: string | null;
  vintage: number | null;
  grape_variety: string[] | null;
  region: string | null;
  country: string | null;
  type: WineType;
  taste_profile?: TasteProfile;
  food_pairing?: string[];
  flavor_notes?: string[];
  description?: string;
}

export interface ScanResult {
  scan_id: string;
  confidence: number;
  wine: ScannedWine;
  image_url: string;
  existing_wine_id: string | null;
  is_duplicate: boolean;
}

export interface BatchScanResultItem {
  index: number;
  status: 'success' | 'failed';
  confidence: number | null;
  wine: ScannedWine | null;
  bounding_box: { x: number; y: number; width: number; height: number } | null;
  error: string | null;
}

export interface BatchScanResult {
  scan_session_id: string;
  total_detected: number;
  successfully_recognized: number;
  failed: number;
  wines: BatchScanResultItem[];
}

// Recommendation types
export interface RecommendationItem {
  rank: number;
  match_score: number;
  user_wine: UserWineListItem;
  reason: string;
  pairing_tips: string | null;
  drinking_urgency: DrinkingUrgency;
}

export interface RecommendationResult {
  recommendation_id: string;
  query: string;
  recommendations: RecommendationItem[];
  general_advice: string | null;
  no_match_alternatives: string | null;
  created_at: string;
}

export interface RecommendationRequest {
  query: string;
  query_type?: 'food' | 'occasion' | 'mood';
  preferences?: {
    wine_types?: WineType[];
    max_results?: number;
    prioritize_expiring?: boolean;
  };
}

// AI Analysis types
export interface WineAromaProfile {
  primary: string[];
  secondary: string[];
  tertiary: string[];
}

export interface WineAgingPotential {
  current_status: string;
  recommendation: string;
  peak_window: string;
}

export interface WineFoodPairingDetail {
  dish: string;
  reason: string;
}

export interface WineVivinoRating {
  estimated_score: number;
  confidence: string;
  note: string;
}

export interface WineAIAnalysis {
  summary: string;
  aroma_profile: WineAromaProfile | null;
  flavor_analysis: string | null;
  terroir_context: string | null;
  aging_potential: WineAgingPotential | null;
  food_pairing_detail: WineFoodPairingDetail[] | null;
  sommelier_tip: string | null;
  vivino_rating: WineVivinoRating | null;
  comparable_wines: string[] | null;
}

// Dashboard types
export interface CellarSummary {
  total_wines: number;
  total_bottles: number;
  total_value: number;
  by_type: Record<WineType, { count: number; bottles: number }>;
  by_country: Array<{ country: string; count: number }>;
  by_cellar: Array<{ tag_id: string; name: string; count: number }>;
  recent_additions: number;
  consumed_this_month: number;
}

export interface ExpiringWineItem {
  user_wine_id: string;
  wine: {
    name: string;
    vintage: number | null;
  };
  drinking_window_end: number;
  years_left: number;
  message: string;
}

export interface ExpiringWines {
  urgent: ExpiringWineItem[];
  soon: ExpiringWineItem[];
  optimal: ExpiringWineItem[];
}

// Tag types
export interface TagCreateRequest {
  name: string;
  type: TagType;
  color?: string;
}

export interface TagUpdateRequest {
  name?: string;
  color?: string;
}

export interface TagListResponse {
  tags: Tag[];
  summary: {
    cellar_count: number;
    location_count: number;
    custom_count: number;
  };
}
