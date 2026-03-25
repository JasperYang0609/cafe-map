export interface Cafe {
  id: string;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  total_ratings: number;
  photo_reference?: string;
  photo_references?: string[]; // multiple photos
  photo_url?: string;
  is_open?: boolean;
  price_level?: number;
  distance?: number;
  opening_hours?: string[];
  phone?: string;
  website?: string;
  gardenItemId?: string;
  gardenEmoji?: string;
  heartRating?: number; // user's personal rating (0-3 hearts)
}

export interface CafeDetail extends Cafe {
  phone?: string;
  website?: string;
  opening_hours?: string[];
  reviews?: Review[];
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  time: string;
}

export interface FavoriteCafe {
  id: string;
  user_id: string;
  cafe_id: string;
  created_at: string;
  cafe?: Cafe;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  cafe_id: string;
  visited_at: string;
  cafe?: Cafe;
}

export interface H3CacheEntry {
  h3_index: string;
  cafes: Cafe[];
  fetched_at: string;
  expires_at: string;
}
