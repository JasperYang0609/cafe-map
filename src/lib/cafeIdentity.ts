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
} from '../constants/cafeDiscoveryRules';

interface PlaceForIdentity {
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  name?: string;
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
 * Logic order:
 * 1. Permanently closed → not a cafe
 * 2. Strong coffee signal → is a cafe (overrides denylist)
 * 3. General coffee signal + not on denylist → is a cafe
 * 4. Otherwise → not a cafe
 */
export function classifyCafeIdentity(place: PlaceForIdentity): boolean {
  // 1. Permanently closed — exclude
  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    return false;
  }

  // 2. Strong coffee signal — always include (e.g., KEEP Coffee Roastery)
  if (hasStrongCoffeeSignal(place)) {
    return true;
  }

  // 3. General coffee signal + not on denylist
  if (hasGeneralCoffeeSignal(place)) {
    const primary = place.primaryType || '';
    if (!PRIMARY_TYPE_DENYLIST.includes(primary)) {
      return true;
    }
    // On denylist but has general signal — excluded (e.g., 7-Eleven with cafe type)
    return false;
  }

  // 4. No coffee signal — exclude
  return false;
}
