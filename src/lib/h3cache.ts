import { CACHE_TTL_DAYS } from '../constants/config';
import { supabase } from './supabase';
import { searchNearbyCafes } from './places';
import { Cafe } from '../types/cafe';

/**
 * Simple grid-based cache (replaces h3-js which doesn't work in RN)
 * Rounds lat/lng to ~500m grid cells
 */
function getGridKey(latitude: number, longitude: number): string {
  // Round to 3 decimal places ≈ ~111m precision
  // Use 2.5 decimal places ≈ ~500m grid cells
  const latKey = (Math.round(latitude * 200) / 200).toFixed(3);
  const lngKey = (Math.round(longitude * 200) / 200).toFixed(3);
  return `${latKey},${lngKey}`;
}

/**
 * Get cafes for a location, using grid cache when available
 */
export async function getCafesWithCache(
  latitude: number,
  longitude: number
): Promise<Cafe[]> {
  const gridKey = getGridKey(latitude, longitude);

  // Check cache
  const cached = await getCachedCafes(gridKey);
  if (cached) {
    console.log(`[Cache] HIT for ${gridKey}`);
    return cached;
  }

  // Cache miss → fetch from Google Places API
  console.log(`[Cache] MISS for ${gridKey}, fetching from API...`);
  const cafes = await searchNearbyCafes(latitude, longitude);

  // Save to cache (fire and forget)
  saveCafeCache(gridKey, cafes).catch(console.error);

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
    console.log(`[Cache] Saved ${cafes.length} cafes for ${gridKey}`);
  }
}

export function getGridIndex(latitude: number, longitude: number): string {
  return getGridKey(latitude, longitude);
}
