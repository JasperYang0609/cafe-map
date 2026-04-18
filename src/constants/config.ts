// Google Maps API
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCtAEBCtlmo5zDXYj0ZS5FevJcP9be70I8';

// Map defaults (Taipei)
export const DEFAULT_REGION = {
  latitude: 25.033,
  longitude: 121.5654,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Geo cache
// 1km cells with latitude-corrected longitude spacing (works globally)
// Matches 3km search radius when combined with 3x3 neighbor lookup (~9 km² coverage)
export const GRID_CELL_SIZE_METERS = 1000;
export const GRID_NEIGHBOR_RING = 1; // 1 = 3x3 grid (9 cells), 2 = 5x5 grid
export const CACHE_TTL_DAYS = 45; // cafe data refresh interval

// Google Places
export const PLACES_SEARCH_RADIUS = 3000; // meters (3km) — cost-optimized cap
export const PLACES_TYPE = 'cafe';
