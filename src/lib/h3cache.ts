import { latLngToCell, gridDisk } from 'h3-js';
import { RULES_VERSION, CACHE_TTL_DAYS, MAP_SEARCH_RADIUS } from '../constants/cafeDiscoveryRules';
import { H3_RESOLUTION, H3_RING_SIZE } from '../constants/config';
import { supabase } from './supabase';
import { isCurrentlyOpen } from './places';
import { buildCandidatePool } from './cafeDiscovery';
import { Cafe } from '../types/cafe';

/**
 * H3-based grid cache.
 *
 * Uses Uber's H3 hexagonal geospatial indexing for globally-uniform cells.
 * Resolution 7 hex ≈ 1.22km edge / 5.16 km² area — pairs well with 3km search radius.
 *
 * On lookup we check the current cell PLUS its 6 ring-1 neighbors (gridDisk).
 * Any non-expired hit serves the request; this dramatically reduces cache
 * misses when a user moves around a city.
 *
 * Cache keys are namespaced by RULES_VERSION so identity/logic changes
 * invalidate all entries at once.
 */

function cacheKey(h3Index: string): string {
  return `${RULES_VERSION}:${h3Index}`;
}

export async function getCafesWithCache(
  latitude: number,
  longitude: number,
  radius: number = MAP_SEARCH_RADIUS
): Promise<Cafe[]> {
  const currentCell = latLngToCell(latitude, longitude, H3_RESOLUTION);
  const cells = gridDisk(currentCell, H3_RING_SIZE); // current + 6 neighbors
  const keys = cells.map(cacheKey);

  // Single round-trip: fetch any matching cache entries
  const { data, error } = await supabase
    .from('h3_cache')
    .select('h3_index, cafes, expires_at')
    .in('h3_index', keys);

  if (!error && data && data.length > 0) {
    const now = new Date();
    const fresh = data.filter(row => new Date(row.expires_at) >= now);

    if (fresh.length > 0) {
      // Prefer current-cell hit for best spatial match, then any neighbor
      const currentKey = cacheKey(currentCell);
      const preferred = fresh.find(row => row.h3_index === currentKey) ?? fresh[0];
      const cafes = preferred.cafes as Cafe[];
      console.log(`[Cache] HIT on ${preferred.h3_index} (${cafes.length} cafes)`);
      return cafes.map(cafe => ({
        ...cafe,
        is_open: isCurrentlyOpen(cafe.opening_hours),
      }));
    }
  }

  // Cache miss → fetch fresh, save under current cell
  console.log(`[Cache] MISS for ${currentCell} (checked ${keys.length} cells), fetching...`);
  const cafes = await buildCandidatePool(latitude, longitude, radius);

  const cafesForCache = cafes.map(({ is_open, ...rest }) => rest);
  saveCafeCache(cacheKey(currentCell), cafesForCache).catch(console.error);

  return cafes;
}

async function saveCafeCache(key: string, cafes: Cafe[]): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const { error } = await supabase
    .from('h3_cache')
    .upsert({
      h3_index: key,
      cafes,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('[Cache] Save error:', error);
  } else {
    console.log(`[Cache] Saved ${cafes.length} cafes for ${key}`);
  }
}

/**
 * For debugging / reference — returns the H3 cell at the user's position.
 */
export function getGridIndex(latitude: number, longitude: number): string {
  return cacheKey(latLngToCell(latitude, longitude, H3_RESOLUTION));
}
