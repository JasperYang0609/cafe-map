import { GOOGLE_MAPS_API_KEY, PLACES_SEARCH_RADIUS, PLACES_TYPE } from '../constants/config';
import { Cafe } from '../types/cafe';

const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PLACE_PHOTO_URL = 'https://places.googleapis.com/v1';

// Google Places API (New) maxResultCount cap is 20
const MAX_RESULTS_PER_CALL = 20;

/**
 * Single-circle search (max 20 results due to Google API limit)
 */
async function searchSingleCircle(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Cafe[]> {
  try {
    const response = await fetch(PLACES_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': [
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
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: [PLACES_TYPE],
        maxResultCount: MAX_RESULTS_PER_CALL,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: Math.min(radius, 50000), // Google max 50km
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Places API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    if (!data.places) return [];

    return data.places.map((place: any) => ({
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
    }));
  } catch (error) {
    console.error('searchSingleCircle error:', error);
    return [];
  }
}

/**
 * Generate offset points around center to cover larger area
 * Uses a hex-like pattern: center + 6 surrounding points
 */
function getSearchPoints(
  latitude: number,
  longitude: number,
  radius: number
): Array<{ lat: number; lng: number; r: number }> {
  // For small radius (≤2km), single search is enough
  if (radius <= 2000) {
    return [{ lat: latitude, lng: longitude, r: radius }];
  }

  // For medium radius (≤5km), use center + 4 cardinal offsets
  // Each sub-circle uses radius/2 to overlap and cover gaps
  const subRadius = Math.ceil(radius * 0.6);
  const offsetDist = radius * 0.5;

  // Convert offset distance to degrees (approximate)
  const latOffset = offsetDist / 111320;
  const lngOffset = offsetDist / (111320 * Math.cos(latitude * Math.PI / 180));

  if (radius <= 5000) {
    return [
      { lat: latitude, lng: longitude, r: subRadius },
      { lat: latitude + latOffset, lng: longitude, r: subRadius },
      { lat: latitude - latOffset, lng: longitude, r: subRadius },
      { lat: latitude, lng: longitude + lngOffset, r: subRadius },
      { lat: latitude, lng: longitude - lngOffset, r: subRadius },
    ];
  }

  // For large radius (>5km), use center + 8 surrounding points
  return [
    { lat: latitude, lng: longitude, r: subRadius },
    { lat: latitude + latOffset, lng: longitude, r: subRadius },
    { lat: latitude - latOffset, lng: longitude, r: subRadius },
    { lat: latitude, lng: longitude + lngOffset, r: subRadius },
    { lat: latitude, lng: longitude - lngOffset, r: subRadius },
    { lat: latitude + latOffset, lng: longitude + lngOffset, r: subRadius },
    { lat: latitude + latOffset, lng: longitude - lngOffset, r: subRadius },
    { lat: latitude - latOffset, lng: longitude + lngOffset, r: subRadius },
    { lat: latitude - latOffset, lng: longitude - lngOffset, r: subRadius },
  ];
}

/**
 * Search nearby cafes using multi-circle strategy to overcome 20-result limit
 * Small radius: 1 API call → up to 20 cafes
 * Medium radius: 5 API calls → up to 100 cafes
 * Large radius: 9 API calls → up to 180 cafes
 * Results are deduplicated by place_id
 */
export async function searchNearbyCafes(
  latitude: number,
  longitude: number,
  radius: number = PLACES_SEARCH_RADIUS
): Promise<Cafe[]> {
  const searchPoints = getSearchPoints(latitude, longitude, radius);

  console.log(`[Places] Searching ${searchPoints.length} circles for radius ${radius}m`);

  // Run all searches in parallel
  const results = await Promise.all(
    searchPoints.map(p => searchSingleCircle(p.lat, p.lng, p.r))
  );

  // Flatten and deduplicate by place_id
  const cafeMap = new Map<string, Cafe>();
  for (const cafes of results) {
    for (const cafe of cafes) {
      if (!cafeMap.has(cafe.id)) {
        cafeMap.set(cafe.id, cafe);
      }
    }
  }

  const deduplicated = Array.from(cafeMap.values());
  console.log(`[Places] Found ${deduplicated.length} unique cafes (from ${results.flat().length} total)`);

  return deduplicated;
}

/**
 * Get a photo URL from a photo reference
 * Google Places API (New) requires fetching the photo URI
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!photoReference) return '';
  return `${PLACE_PHOTO_URL}/${photoReference}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

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

/**
 * Parse Google Places regularOpeningHours into cacheable periods
 * Each period has open/close day (0=Sun) and time (HHMM)
 */
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

/**
 * Calculate if a cafe is currently open based on cached opening_hours periods
 * Uses device local time (which matches Google's local business hours)
 */
export function isCurrentlyOpen(openingHours?: OpeningPeriod[]): boolean | null {
  if (!openingHours || openingHours.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ...
  const currentTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  for (const period of openingHours) {
    // Same-day period
    if (period.openDay === period.closeDay && period.openDay === currentDay) {
      if (currentTime >= period.openTime && currentTime < period.closeTime) {
        return true;
      }
    }
    // Cross-midnight period (e.g., open Fri 22:00 → close Sat 02:00)
    else if (period.openDay !== period.closeDay) {
      // Check if we're in the opening day after open time
      if (currentDay === period.openDay && currentTime >= period.openTime) {
        return true;
      }
      // Check if we're in the closing day before close time
      if (currentDay === period.closeDay && currentTime < period.closeTime) {
        return true;
      }
      // Handle wrapping (e.g., open day 6 close day 0 and we're on day 0)
      if (period.closeDay < period.openDay) {
        if (currentDay > period.openDay || currentDay < period.closeDay) {
          return true;
        }
        if (currentDay === period.closeDay && currentTime < period.closeTime) {
          return true;
        }
      }
    }
    // 24-hour (open 00:00 close 00:00 same day or period covers whole day)
    if (period.openTime === '0000' && period.closeTime === '2359' && period.openDay === currentDay) {
      return true;
    }
  }

  return false;
}
