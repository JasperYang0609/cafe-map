import { latLngToCell } from 'h3-js';
import { H3_RESOLUTION, CACHE_TTL_DAYS } from '../constants/config';
import { supabase } from './supabase';
import { searchNearbyCafes } from './places';
import { Cafe, H3CacheEntry } from '../types/cafe';

/**
 * Get cafes for a location, using H3 cache when available
 * 1. Convert lat/lng to H3 index
 * 2. Check cache (Supabase h3_cache table)
 * 3. If cache miss or expired → call Google Places API → save to cache
 * 4. Return cafes
 */
export async function getCafesWithCache(
  latitude: number,
  longitude: number
): Promise<Cafe[]> {
  const h3Index = latLngToCell(latitude, longitude, H3_RESOLUTION);

  // Check cache
  const cached = await getCachedCafes(h3Index);
  if (cached) {
    console.log(`[H3 Cache] HIT for ${h3Index}`);
    return cached;
  }

  // Cache miss → fetch from Google Places API
  console.log(`[H3 Cache] MISS for ${h3Index}, fetching from API...`);
  const cafes = await searchNearbyCafes(latitude, longitude);

  // Save to cache (fire and forget)
  saveCafeCache(h3Index, cafes).catch(console.error);

  return cafes;
}

/**
 * Get cached cafes for an H3 index
 * Returns null if cache miss or expired
 */
async function getCachedCafes(h3Index: string): Promise<Cafe[] | null> {
  try {
    const { data, error } = await supabase
      .from('h3_cache')
      .select('cafes, expires_at')
      .eq('h3_index', h3Index)
      .single();

    if (error || !data) return null;

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.log(`[H3 Cache] EXPIRED for ${h3Index}`);
      return null;
    }

    return data.cafes as Cafe[];
  } catch {
    return null;
  }
}

/**
 * Save cafes to H3 cache
 */
async function saveCafeCache(h3Index: string, cafes: Cafe[]): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const { error } = await supabase
    .from('h3_cache')
    .upsert({
      h3_index: h3Index,
      cafes: cafes,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('[H3 Cache] Save error:', error);
  } else {
    console.log(`[H3 Cache] Saved ${cafes.length} cafes for ${h3Index}`);
  }
}

/**
 * Get the H3 index for a location
 */
export function getH3Index(latitude: number, longitude: number): string {
  return latLngToCell(latitude, longitude, H3_RESOLUTION);
}
