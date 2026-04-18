/**
 * BeanGo Cafe Discovery Module — V40
 *
 * High-recall candidate pool builder:
 * 1. Nearby Search (cafe + coffee_shop merged in one call)
 * 2. Recursive circle splitting when results hit 20 (API limit)
 * 3. Deduplication by place_id
 * 4. Cafe identity classification
 */

import { GOOGLE_MAPS_API_KEY } from '../constants/config';
import {
  SEARCH_INCLUDED_TYPES,
  MIN_RECURSIVE_RADIUS,
} from '../constants/cafeDiscoveryRules';
import { classifyCafeIdentity } from './cafeIdentity';
import { calculateDistance, isCurrentlyOpen } from './places';
import { Cafe } from '../types/cafe';

const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const MAX_RESULTS_PER_CALL = 20;

// Field mask for all searches — includes V40 identity fields
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
  'places.priceLevel',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.types',
  'places.primaryType',
  'places.businessStatus',
].join(',');

/**
 * Parse a Google Places API result into a Cafe object
 */
function parsePlaceResult(place: any): Cafe {
  return {
    id: place.id,
    place_id: place.id,
    name: place.displayName?.text || 'Unknown',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    rating: place.rating || 0,
    total_ratings: place.userRatingCount || 0,
    photo_reference: place.photos?.[0]?.name || null,
    photo_references: place.photos?.map((p: any) => p.name).slice(0, 5) || [],
    phone: place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
    is_open: place.currentOpeningHours?.openNow ?? null,
    opening_hours: parseOpeningPeriods(place.regularOpeningHours),
    price_level: place.priceLevel ? parsePriceLevel(place.priceLevel) : null,
    // V40 identity fields
    types: place.types || [],
    primaryType: place.primaryType || '',
    businessStatus: place.businessStatus || '',
  };
}

/**
 * Single Nearby Search call (one includedType at a time — multi-type
 * merging triggered Google 400s in the field, so we keep calls separate
 * even though it means 2x baseline requests)
 */
async function nearbySearch(
  latitude: number,
  longitude: number,
  radius: number,
  includedType: string
): Promise<Cafe[]> {
  try {
    const response = await fetch(PLACES_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: [includedType],
        maxResultCount: MAX_RESULTS_PER_CALL,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: Math.min(radius, 50000),
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[NearbySearch] ${response.status} for type=${includedType} r=${radius}m: ${body.slice(0, 200)}`);
      return [];
    }
    const data = await response.json();
    if (!data.places) return [];
    return data.places.map(parsePlaceResult);
  } catch (err) {
    console.warn('[NearbySearch] fetch error:', err);
    return [];
  }
}

/**
 * Recursive Nearby Search — splits circle when results hit 20 (saturated)
 */
async function recursiveNearbySearch(
  latitude: number,
  longitude: number,
  radius: number,
  includedType: string
): Promise<Cafe[]> {
  const results = await nearbySearch(latitude, longitude, radius, includedType);

  // Not saturated or at minimum radius — return as-is
  if (results.length < MAX_RESULTS_PER_CALL || radius <= MIN_RECURSIVE_RADIUS) {
    return results;
  }

  // Saturated — split into 4 sub-circles and recurse
  console.log(`[Discovery] Saturated (${results.length}) at radius ${radius}m type=${includedType}, splitting...`);
  const subRadius = radius * 0.6;
  const offset = radius * 0.35;
  const latDeg = offset / 111320;
  const lngDeg = offset / (111320 * Math.cos(latitude * Math.PI / 180));

  const subSearches = [
    recursiveNearbySearch(latitude + latDeg, longitude + lngDeg, subRadius, includedType),
    recursiveNearbySearch(latitude + latDeg, longitude - lngDeg, subRadius, includedType),
    recursiveNearbySearch(latitude - latDeg, longitude + lngDeg, subRadius, includedType),
    recursiveNearbySearch(latitude - latDeg, longitude - lngDeg, subRadius, includedType),
  ];

  const subResults = await Promise.all(subSearches);

  // Merge original + sub results
  const all = [...results, ...subResults.flat()];
  return all;
}

/**
 * Build complete candidate pool using high-recall strategy
 *
 * 1. Nearby Search per type (cafe, coffee_shop) — separate calls to avoid
 *    Google 400 errors observed when sending multiple types in a single request
 * 2. Recursive split when saturated (20 results)
 * 3. Deduplicate by place_id
 * 4. Apply cafe identity classification
 */
export async function buildCandidatePool(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Cafe[]> {
  console.log(`[Discovery] Building candidate pool at (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) r=${radius}m`);

  // One recursive search per type, in parallel
  const perTypeResults = await Promise.all(
    SEARCH_INCLUDED_TYPES.map(type =>
      recursiveNearbySearch(latitude, longitude, radius, type),
    ),
  );
  const rawResults = perTypeResults.flat();

  // Deduplicate by place_id
  const cafeMap = new Map<string, Cafe>();
  for (const cafe of rawResults) {
    if (!cafeMap.has(cafe.place_id)) {
      cafeMap.set(cafe.place_id, cafe);
    }
  }

  const rawCount = rawResults.length;
  const uniqueCount = cafeMap.size;

  // Apply cafe identity classification
  const eligible: Cafe[] = [];
  for (const cafe of cafeMap.values()) {
    if (classifyCafeIdentity(cafe)) {
      eligible.push(cafe);
    }
  }

  console.log(`[Discovery] Raw: ${rawCount}, Unique: ${uniqueCount}, Eligible: ${eligible.length}`);

  return eligible;
}

/**
 * Add distance and sort cafes relative to user position
 */
export function enrichWithDistance(
  cafes: Cafe[],
  userLat: number,
  userLng: number
): Cafe[] {
  return cafes.map(cafe => ({
    ...cafe,
    distance: calculateDistance(userLat, userLng, cafe.latitude, cafe.longitude),
    is_open: isCurrentlyOpen(cafe.opening_hours),
  }));
}

// --- Helpers (moved from places.ts) ---

function parsePriceLevel(level: string): number {
  const levels: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return levels[level] ?? 0;
}

interface OpeningPeriod {
  openDay: number;
  openTime: string;
  closeDay: number;
  closeTime: string;
}

function parseOpeningPeriods(regularOpeningHours: any): OpeningPeriod[] | undefined {
  if (!regularOpeningHours?.periods) return undefined;
  return regularOpeningHours.periods.map((p: any) => ({
    openDay: p.open?.day ?? 0,
    openTime: `${String(p.open?.hour ?? 0).padStart(2, '0')}${String(p.open?.minute ?? 0).padStart(2, '0')}`,
    closeDay: p.close?.day ?? p.open?.day ?? 0,
    closeTime: p.close
      ? `${String(p.close.hour ?? 0).padStart(2, '0')}${String(p.close.minute ?? 0).padStart(2, '0')}`
      : '2359',
  }));
}
