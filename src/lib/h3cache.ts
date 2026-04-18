import { RULES_VERSION, CACHE_TTL_DAYS, MAP_SEARCH_RADIUS } from '../constants/cafeDiscoveryRules';
import { supabase } from './supabase';
import { isCurrentlyOpen } from './places';
import { buildCandidatePool, enrichWithDistance } from './cafeDiscovery';
import { Cafe } from '../types/cafe';

/**
 * Simple grid-based cache with rules versioning.
 * Cache key includes RULES_VERSION to auto-invalidate when rules change.
 */
function getGridKey(latitude: number, longitude: number): string {
  const latKey = (Math.round(latitude * 200) / 200).toFixed(3);
  const lngKey = (Math.round(longitude * 200) / 200).toFixed(3);
  return `${RULES_VERSION}:${latKey},${lngKey}`;
}

/**
 * Get cafes using V40 discovery pipeline with cache.
 * Uses buildCandidatePool for high-recall search + identity classification.
 */
export async function getCafesWithCache(
  latitude: number,
  longitude: number,
  radius: number = MAP_SEARCH_RADIUS
): Promise<Cafe[]> {
  const gridKey = getGridKey(latitude, longitude);

  // Try cache first
  const cached = await getCachedCafes(gridKey);
  if (cached) {
    console.log(`[Cache] HIT for ${gridKey} (${cached.length} cafes)`);
    return cached.map(cafe => ({
      ...cafe,
      is_open: isCurrentlyOpen(cafe.opening_hours),
    }));
  }

  // Cache miss → run V40 discovery pipeline
  console.log(`[Cache] MISS for ${gridKey}, running discovery pipeline...`);
  const cafes = await buildCandidatePool(latitude, longitude, radius);

  // Save to cache (strip is_open since it's point-in-time)
  const cafesForCache = cafes.map(({ is_open, ...rest }) => rest);
  saveCafeCache(gridKey, cafesForCache).catch(console.error);

  return cafes;
}

async function getCachedCafes(gridKey: string): Promise<Cafe[] | null> {
  try {
    const { data, error } = await supabase
      .from('h3_cache')
      .select('cafes, expires_at')
      .eq('h3_index', gridKey)
      .single();

    if (error || !data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.log(`[Cache] EXPIRED for ${gridKey}`);
      return null;
    }

    return data.cafes as Cafe[];
  } catch {
    return null;
  }
}

async function saveCafeCache(gridKey: string, cafes: Cafe[]): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const { error } = await supabase
    .from('h3_cache')
    .upsert({
      h3_index: gridKey,
      cafes: cafes,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('[Cache] Save error:', error);
  } else {
    console.log(`[Cache] Saved ${cafes.length} eligible cafes for ${gridKey}`);
  }
}

export function getGridIndex(latitude: number, longitude: number): string {
  return getGridKey(latitude, longitude);
}
