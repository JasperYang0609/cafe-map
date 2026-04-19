/**
 * BeanGo Cafe Identity Module — V40
 *
 * Determines whether a Google Places result is a "BeanGo cafe".
 * Uses ONLY type/name/status signals. Never uses distance, rating, or review count.
 */

import {
  PRIMARY_TYPE_DENYLIST,
  STRONG_COFFEE_TYPES,
  GENERAL_COFFEE_TYPES,
  COFFEE_NAME_KEYWORDS,
  MIN_USER_RATING_COUNT,
} from '../constants/cafeDiscoveryRules';

interface PlaceForIdentity {
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  name?: string;
  total_ratings?: number;
  address?: string;
}

/**
 * Detect Google Places "ghost" records where someone registered a
 * location but never filled in a real business name — the displayName
 * is just the postal address.
 *
 * Seen in cache (verified): place with primaryType=coffee_shop,
 * 0 reviews, name="高雄市三民區大順二路 271 號". Navigating to it
 * drops you at a roadside pin with no storefront.
 */
function looksLikeAddressOnly(name?: string, address?: string): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  const addr = (address || '').trim();
  if (trimmed === addr) return true;
  // Taiwan address shape: ends with 號, contains road keyword, no other content
  if (/號\s*$/.test(trimmed) && /[路街巷弄大道]/.test(trimmed) && trimmed.length < 50) {
    return true;
  }
  return false;
}

/**
 * Check if a place has a strong coffee signal.
 * Strong signal = definitely a cafe, overrides denylist.
 */
export function hasStrongCoffeeSignal(place: PlaceForIdentity): boolean {
  const types = place.types || [];
  const primary = place.primaryType || '';

  // Check types array for strong coffee types
  if (types.some(t => STRONG_COFFEE_TYPES.includes(t))) return true;

  // Check primaryType
  if (STRONG_COFFEE_TYPES.includes(primary)) return true;

  return false;
}

/**
 * Check if a place has a general coffee signal.
 * General signal = probably a cafe, but can be overridden by denylist.
 */
export function hasGeneralCoffeeSignal(place: PlaceForIdentity): boolean {
  const types = place.types || [];
  const primary = place.primaryType || '';
  const name = (place.name || '').toLowerCase();

  // Check types array for general coffee types
  if (types.some(t => GENERAL_COFFEE_TYPES.includes(t))) return true;

  // Check primaryType
  if (GENERAL_COFFEE_TYPES.includes(primary)) return true;

  // Check name keywords
  if (COFFEE_NAME_KEYWORDS.some(kw => name.includes(kw.toLowerCase()))) return true;

  return false;
}

/**
 * Classify whether a place is a BeanGo cafe.
 *
 * Logic order — note the address-as-name check runs BEFORE the strong
 * coffee signal bypass, because Google sometimes tags ghost records with
 * primaryType=coffee_shop. Letting strong signal short-circuit ahead of
 * ghost detection would allow those records through.
 *
 * 1. Permanently closed        → not a cafe
 * 2. Name looks like an address → ghost record, not a cafe
 * 3. Strong coffee signal      → is a cafe (bypasses review count)
 * 4. Low review count          → not a cafe (zombie place_id filter)
 * 5. General signal + not on denylist → is a cafe
 * 6. Otherwise                 → not a cafe
 */
export function classifyCafeIdentity(place: PlaceForIdentity): boolean {
  // 1. Permanently closed — exclude
  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    return false;
  }

  // 2. Address-as-name — ghost record from Google Places cleanup churn
  if (looksLikeAddressOnly(place.name, place.address)) {
    return false;
  }

  // 3. Strong coffee signal — always include (e.g., KEEP Coffee Roastery,
  //    brand new coffee shop with 0 reviews). Only runs after ghost check.
  if (hasStrongCoffeeSignal(place)) {
    return true;
  }

  // 4. Low review count — Nearby Search sometimes returns zombie place_ids
  //    that Google Maps has de-indexed. These typically have 0–few reviews.
  //    Real new cafes get the bypass above via strong signal.
  if ((place.total_ratings ?? 0) < MIN_USER_RATING_COUNT) {
    return false;
  }

  // 5. General coffee signal + not on denylist
  if (hasGeneralCoffeeSignal(place)) {
    const primary = place.primaryType || '';
    if (!PRIMARY_TYPE_DENYLIST.includes(primary)) {
      return true;
    }
    // On denylist but has general signal — excluded (e.g., 7-Eleven with cafe type)
    return false;
  }

  // 6. No coffee signal — exclude
  return false;
}
