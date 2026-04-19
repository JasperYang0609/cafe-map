/**
 * BeanGo Cafe Discovery Rules — V40
 *
 * Central source of truth for:
 * - What counts as a "cafe" (identity rules)
 * - What gets excluded (denylist)
 * - Search strategy constants
 * - Cache versioning
 */

// Bump this when identity rules, search sources, or merge logic changes
// Forces cache invalidation so old data doesn't pollute results
// grid-v1: 1km lat-corrected grid + 3x3 neighbor lookup (pure JS, Hermes-safe)
export const RULES_VERSION = 'cafe-discovery-grid-v1';

// --- Cafe Identity: Denylist ---
// primaryType values that indicate a non-cafe business
// A place on this list is excluded UNLESS it has a strong coffee signal.
// Also passed to Nearby Search as `excludedPrimaryTypes` so Google
// filters these server-side before we even see them.
export const PRIMARY_TYPE_DENYLIST = [
  // Retail / convenience
  'convenience_store',
  'gas_station',
  'supermarket',
  'department_store',
  'pharmacy',
  'bank',
  'atm',
  'clothing_store',
  'home_goods_store',
  'furniture_store',
  'hardware_store',
  'electronics_store',
  'book_store',
  'shoe_store',
  'jewelry_store',
  // Professional services (user reports: 會計師 / 律師 / 保險 / 不動產)
  'accounting',
  'lawyer',
  'real_estate_agency',
  'insurance_agency',
  // Medical / wellness (user reports: 足浴)
  'doctor',
  'dentist',
  'hospital',
  'physiotherapist',
  'spa',
  'beauty_salon',
  'hair_care',
  'gym',
  // Automotive
  'car_dealer',
  'car_rental',
  'car_repair',
  // Misc
  'laundry',
  'post_office',
  'storage',
];

// --- Cafe Identity: Strong Coffee Signals ---
// Any ONE of these = definitely a cafe, even if primaryType is weird
export const STRONG_COFFEE_TYPES = [
  'coffee_shop',
  'coffee_stand',
  'coffee_roastery',
];

// --- Cafe Identity: General Coffee Signals ---
// These indicate "probably a cafe" but can be overridden by denylist
export const GENERAL_COFFEE_TYPES = [
  'cafe',
];

// Name keywords that indicate a coffee-related business
export const COFFEE_NAME_KEYWORDS = [
  'coffee',
  '咖啡',
  '珈琲',
  'roastery',
  'café',
  'espresso',
];

// --- Search Strategy ---
// Types to search via Nearby Search API (merged into single request)
export const SEARCH_INCLUDED_TYPES = ['cafe', 'coffee_shop'];

// Minimum sub-circle radius before stopping recursive split (meters)
// Raised from 250 → 500 to cap deep recursion (cost optimization)
export const MIN_RECURSIVE_RADIUS = 500;

// --- Radius Constants (cost-optimized) ---
export const MAP_SEARCH_RADIUS = 3000; // Map page searches 3km
export const DEFAULT_EXPLORE_RADIUS = 2000; // Default for explore page
export const MAX_SEARCH_RADIUS = 3000; // Maximum supported radius (hard cap)

// --- Identity Thresholds ---
// Minimum review count for a place without a strong coffee signal to pass.
// Zombie place_ids that Google's API returns but Maps has de-indexed
// typically have 0–few reviews; set the floor to filter them. Real new
// coffee shops can still pass via the strong-signal bypass in classifyCafeIdentity.
export const MIN_USER_RATING_COUNT = 5;

// --- Cache ---
export const CACHE_TTL_DAYS = 45;
