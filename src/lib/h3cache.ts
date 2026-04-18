import { RULES_VERSION, CACHE_TTL_DAYS, MAP_SEARCH_RADIUS } from '../constants/cafeDiscoveryRules';
import { GRID_CELL_SIZE_METERS, GRID_NEIGHBOR_RING } from '../constants/config';
import { supabase } from './supabase';
import { isCurrentlyOpen } from './places';
import { buildCandidatePool } from './cafeDiscovery';
import { Cafe } from '../types/cafe';

/**
 * Geo-cell cache (pure JS, Hermes-safe).
 *
 * Uses a latitude-corrected uniform grid so each cell is ~1km × 1km anywhere
 * on Earth (longitude spacing scales with cos(lat) to fight polar distortion).
 *
 * On lookup we check the current cell PLUS its 8 ring-1 neighbors (3x3 grid).
 * Any non-expired hit serves the request; this dramatically reduces cache
 * misses when users move around a city.
 *
 * Table is still called `h3_cache` and column `h3_index` for backwards
 * compatibility — RULES_VERSION namespace keeps new entries isolated from
 * any stale data.
 */

const METERS_PER_LAT_DEGREE = 111320;

interface Cell {
  latIdx: number;
  lngIdx: number;
  /** reference latitude used to compute lng spacing (cell center latitude) */
  refLat: number;
}

function latLngToCell(lat: number, lng: number): Cell {
  const latStep = GRID_CELL_SIZE_METERS / METERS_PER_LAT_DEGREE;
  const lngStep = GRID_CELL_SIZE_METERS / (METERS_PER_LAT_DEGREE * Math.cos(lat * Math.PI / 180));
  const latIdx = Math.round(lat / latStep);
  const lngIdx = Math.round(lng / lngStep);
  return { latIdx, lngIdx, refLat: lat };
}

function cellKey(cell: Cell): string {
  return `${RULES_VERSION}:${cell.latIdx},${cell.lngIdx}`;
}

function neighborCells(center: Cell, ring: number): Cell[] {
  const cells: Cell[] = [];
  for (let dLat = -ring; dLat <= ring; dLat++) {
    for (let dLng = -ring; dLng <= ring; dLng++) {
      cells.push({
        latIdx: center.latIdx + dLat,
        lngIdx: center.lngIdx + dLng,
        refLat: center.refLat,
      });
    }
  }
  return cells;
}

export async function getCafesWithCache(
  latitude: number,
  longitude: number,
  radius: number = MAP_SEARCH_RADIUS
): Promise<Cafe[]> {
  const currentCell = latLngToCell(latitude, longitude);
  const candidates = neighborCells(currentCell, GRID_NEIGHBOR_RING);
  const keys = candidates.map(cellKey);
  const currentKey = cellKey(currentCell);

  // Single round-trip: fetch any matching cache entries
  const { data, error } = await supabase
    .from('h3_cache')
    .select('h3_index, cafes, expires_at')
    .in('h3_index', keys);

  if (!error && data && data.length > 0) {
    const now = new Date();
    const fresh = data.filter(row => new Date(row.expires_at) >= now);

    // Only use union cache when the user's own cell is already cached.
    // Otherwise, trigger a fresh fetch centered on the user so we don't
    // show a half-covered result built purely from neighbor caches.
    const currentHit = fresh.find(row => row.h3_index === currentKey);

    if (currentHit) {
      // Merge cafes from all fresh cells (current + any neighbors), deduped.
      // This gives maximum coverage — overlapping neighbor cells contribute
      // cafes that the current cell's 3km search may have missed at its edge.
      const merged = new Map<string, Cafe>();
      for (const row of fresh) {
        for (const cafe of row.cafes as Cafe[]) {
          if (!merged.has(cafe.place_id)) {
            merged.set(cafe.place_id, cafe);
          }
        }
      }
      console.log(
        `[Cache] HIT merged from ${fresh.length} cell(s) → ${merged.size} unique cafes`
      );
      return Array.from(merged.values()).map(cafe => ({
        ...cafe,
        is_open: isCurrentlyOpen(cafe.opening_hours),
      }));
    }
  }

  // Cache miss → fetch fresh, save under current cell
  console.log(`[Cache] MISS for ${currentKey} (checked ${keys.length} cells), fetching...`);
  const cafes = await buildCandidatePool(latitude, longitude, radius);

  const cafesForCache = cafes.map(({ is_open, ...rest }) => rest);
  saveCafeCache(currentKey, cafesForCache).catch(console.error);

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
 * For debugging / reference — returns the cache key for the user's position.
 */
export function getGridIndex(latitude: number, longitude: number): string {
  return cellKey(latLngToCell(latitude, longitude));
}
