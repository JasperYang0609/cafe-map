import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Cafe } from '../types/cafe';
import { useAuth } from './AuthContext';
import { rollGardenItem } from '../lib/garden';

interface FavoritesContextType {
  favorites: Cafe[];
  addFavorite: (cafe: Cafe) => void;
  removeFavorite: (placeId: string) => void;
  isFavorited: (placeId: string) => boolean;
  favCount: number;
  loading: boolean;
  lastRolled: { emoji: string; rarity: string } | null;
  clearLastRolled: () => void;
  setRating: (placeId: string, rating: number) => void;
  getRating: (placeId: string) => number;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorited: () => false,
  favCount: 0,
  loading: false,
  lastRolled: null,
  clearLastRolled: () => {},
  setRating: () => {},
  getRating: () => 0,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Load favorites from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadFavorites(user.id);
    } else {
      setFavorites([]);
    }
  }, [user?.id]);

  const loadFavorites = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          cafe_id, garden_emoji, garden_item_id,
          cafes (
            id, place_id, name, address, latitude, longitude,
            rating, total_ratings, photo_reference, price_level
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const cafes = data
          .filter((d: any) => d.cafes)
          .map((d: any) => ({
            ...d.cafes,
            gardenEmoji: d.garden_emoji || '🌳',
            gardenItemId: d.garden_item_id || 'tree',
          } as Cafe));
        setFavorites(cafes);
      }
    } catch (err) {
      console.error('[Favorites] Load error:', err);
    }
    setLoading(false);
  };

  const [lastRolled, setLastRolled] = useState<{ emoji: string; rarity: string } | null>(null);

  const addFavorite = useCallback(async (cafe: Cafe) => {
    if (!user) return;

    // Roll garden item
    const gardenItem = rollGardenItem();
    const cafeWithGarden = {
      ...cafe,
      gardenItemId: gardenItem.id,
      gardenEmoji: gardenItem.emoji,
    };

    setLastRolled({ emoji: gardenItem.emoji, rarity: gardenItem.rarity });

    // Optimistic update
    setFavorites((prev) => {
      if (prev.some((f) => f.place_id === cafe.place_id)) return prev;
      return [cafeWithGarden, ...prev];
    });

    try {
      // Upsert cafe to cafes table first
      await supabase.from('cafes').upsert({
        place_id: cafe.place_id,
        name: cafe.name,
        address: cafe.address || '',
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        rating: cafe.rating,
        total_ratings: cafe.total_ratings,
        photo_reference: cafe.photo_reference || null,
        price_level: cafe.price_level || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'place_id' });

      // Get the cafe's UUID from DB
      const { data: cafeData } = await supabase
        .from('cafes')
        .select('id')
        .eq('place_id', cafe.place_id)
        .single();

      if (cafeData) {
        // Insert favorite with garden item
        await supabase.from('favorites').upsert({
          user_id: user.id,
          cafe_id: cafeData.id,
          garden_emoji: gardenItem.emoji,
          garden_item_id: gardenItem.id,
        }, { onConflict: 'user_id,cafe_id' });
      }
    } catch (err) {
      console.error('[Favorites] Add error:', err);
      // Rollback optimistic update
      setFavorites((prev) => prev.filter((f) => f.place_id !== cafe.place_id));
    }
  }, [user]);

  const removeFavorite = useCallback(async (placeId: string) => {
    if (!user) return;

    // Optimistic update
    const removed = favorites.find((f) => f.place_id === placeId);
    setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));

    try {
      // Get cafe UUID
      const { data: cafeData } = await supabase
        .from('cafes')
        .select('id')
        .eq('place_id', placeId)
        .single();

      if (cafeData) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('cafe_id', cafeData.id);
      }
    } catch (err) {
      console.error('[Favorites] Remove error:', err);
      // Rollback
      if (removed) {
        setFavorites((prev) => [removed, ...prev]);
      }
    }
  }, [user, favorites]);

  const isFavorited = useCallback((placeId: string): boolean => {
    return favorites.some((f) => f.place_id === placeId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorited,
      favCount: favorites.length,
      loading,
      lastRolled,
      clearLastRolled: () => setLastRolled(null),
      setRating: async (placeId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [placeId]: rating }));
        setFavorites(prev => prev.map(f =>
          f.place_id === placeId ? { ...f, heartRating: rating } : f
        ));
        // Also persist to search_history
        if (user) {
          try {
            const { data: cafeData } = await supabase
              .from('cafes')
              .select('id')
              .eq('place_id', placeId)
              .single();
            if (cafeData) {
              await supabase
                .from('search_history')
                .update({ user_rating: rating })
                .eq('user_id', user.id)
                .eq('cafe_id', cafeData.id);
            }
          } catch (err) {
            console.log('[Favorites] Rating sync error:', err);
          }
        }
      },
      getRating: (placeId: string) => ratings[placeId] || 0,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
