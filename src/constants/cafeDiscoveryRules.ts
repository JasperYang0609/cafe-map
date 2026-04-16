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
export const RULES_VERSION = 'cafe-discovery-v40';

// --- Cafe Identity: Denylist ---
// primaryType values that indicate a non-cafe business
// A place on this list is excluded UNLESS it has a strong coffee signal
export const PRIMARY_TYPE_DENYLIST = [
  'convenience_store',
  'gas_station',
  'supermarket',
  'department_store',
  'pharmacy',
  'bank',
  'atm',
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
// Types to search via Nearby Search API
export const SEARCH_INCLUDED_TYPES = ['cafe', 'coffee_shop'];

// Text search fallback queries for catching edge cases
export const TEXT_SEARCH_QUERIES = ['coffee', '咖啡', 'cafe', 'roastery'];

// Minimum sub-circle radius before stopping recursive split (meters)
export const MIN_RECURSIVE_RADIUS = 250;

// --- Radius Constants ---
export const MAP_SEARCH_RADIUS = 5000; // Map page always searches 5km
export const DEFAULT_EXPLORE_RADIUS = 5000; // Default for explore page
export const MAX_SEARCH_RADIUS = 10000; // Maximum supported radius

// --- Cache ---
export const CACHE_TTL_DAYS = 45;
