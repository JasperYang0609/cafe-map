/**
 * BeanGo Cafe Selectors — V40
 *
 * Shared selectors for Map and Explore pages.
 * Both pages MUST use these to ensure consistent rules.
 */

import { Cafe } from '../types/cafe';
import { MAP_SEARCH_RADIUS } from '../constants/cafeDiscoveryRules';
import { buildCandidatePool, enrichWithDistance } from './cafeDiscovery';
import { calculateDistance } from './places';

/**
 * Get eligible cafes for the Map page.
 * Always uses 5km radius. Sorted by distance.
 */
export async function getEligibleCafesForMap(
  latitude: number,
  longitude: number
): Promise<Cafe[]> {
  const pool = await buildCandidatePool(latitude, longitude, MAP_SEARCH_RADIUS);
  const enriched = enrichWithDistance(pool, latitude, longitude);

  // Filter to 5km and sort by distance
  return enriched
    .filter(c => (c.distance || 0) <= MAP_SEARCH_RADIUS)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Get eligible cafes for the Explore page.
 * Uses the same candidate pool as Map, filtered by user-selected radius.
 */
export async function getEligibleCafesForExplore(
  latitude: number,
  longitude: number,
  activeRadiusKm: number = 5
): Promise<Cafe[]> {
  const searchRadius = Math.max(activeRadiusKm * 1000, MAP_SEARCH_RADIUS);
  const pool = await buildCandidatePool(latitude, longitude, searchRadius);
  const enriched = enrichWithDistance(pool, latitude, longitude);

  // Filter to active radius and sort by distance
  const activeRadiusM = activeRadiusKm * 1000;
  return enriched
    .filter(c => (c.distance || 0) <= activeRadiusM)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
