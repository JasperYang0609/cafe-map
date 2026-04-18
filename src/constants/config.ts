// Google Maps API
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCtAEBCtlmo5zDXYj0ZS5FevJcP9be70I8';

// Map defaults (Taipei)
export const DEFAULT_REGION = {
  latitude: 25.033,
  longitude: 121.5654,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// H3 cache
// Resolution 7 = ~1.22km edge / ~5.16 km² hex area — matches 3km search radius well
export const H3_RESOLUTION = 7;
export const H3_RING_SIZE = 1; // query current cell + 6 neighbors for cache hit
export const CACHE_TTL_DAYS = 45; // cafe data refresh interval

// Google Places
export const PLACES_SEARCH_RADIUS = 3000; // meters (3km) — cost-optimized cap
export const PLACES_TYPE = 'cafe';
