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
  photo_url?: string;
  is_open?: boolean;
  price_level?: number;
  distance?: number; // calculated client-side
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
