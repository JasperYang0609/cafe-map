import { GOOGLE_MAPS_API_KEY, PLACES_SEARCH_RADIUS, PLACES_TYPE } from '../constants/config';
import { Cafe } from '../types/cafe';

const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PLACE_PHOTO_URL = 'https://places.googleapis.com/v1';

/**
 * Search nearby cafes using Google Places API (New)
 * Returns basic info (place_id, name, location, rating)
 */
export async function searchNearbyCafes(
  latitude: number,
  longitude: number,
  radius: number = PLACES_SEARCH_RADIUS
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
          'places.priceLevel',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: [PLACES_TYPE],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius,
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
      is_open: place.currentOpeningHours?.openNow ?? null,
      price_level: place.priceLevel ? parsePriceLevel(place.priceLevel) : null,
    }));
  } catch (error) {
    console.error('searchNearbyCafes error:', error);
    return [];
  }
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
