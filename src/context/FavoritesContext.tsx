import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { supabase } from '../lib/supabase';
import { Cafe } from '../types/cafe';
import { useAuth } from './AuthContext';
import { rollGardenItem } from '../lib/garden';

interface FavoritesContextType {
  favorites: Cafe[];
  addFavorite: (cafe: Cafe) => Promise<void>;
  removeFavorite: (placeId: string) => Promise<void>;
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
  addFavorite: async () => {},
  removeFavorite: async () => {},
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
  const cafeIdCacheRef = useRef<Record<string, string>>({});
  const pendingFavoriteOpsRef = useRef<Set<string>>(new Set());

  // Load favorites from Supabase when user logs in
  useEffect(() => {
    if (user) {
      const task = InteractionManager.runAfterInteractions(() => {
        loadFavorites(user.id);
      });
      return () => task.cancel();
    }

    cafeIdCacheRef.current = {};
    pendingFavoriteOpsRef.current.clear();
    setFavorites([]);
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
          .map((d: any) => {
            cafeIdCacheRef.current[d.cafes.place_id] = d.cafes.id;
            return {
              ...d.cafes,
              gardenEmoji: d.garden_emoji || '🌳',
              gardenItemId: d.garden_item_id || 'tree',
            } as Cafe;
          });
        setFavorites(cafes);
      }
    } catch (err) {
      console.error('[Favorites] Load error:', err);
    }
    setLoading(false);
  };

  const [lastRolled, setLastRolled] = useState<{ emoji: string; rarity: string } | null>(null);

  const ensureCafeId = useCallback(async (cafe: Cafe): Promise<string | null> => {
    const cachedId = cafeIdCacheRef.current[cafe.place_id];
    if (cachedId) return cachedId;

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

    const { data: cafeData } = await supabase
      .from('cafes')
      .select('id')
      .eq('place_id', cafe.place_id)
      .single();

    if (cafeData?.id) {
      cafeIdCacheRef.current[cafe.place_id] = cafeData.id;
      return cafeData.id;
    }

    return null;
  }, []);

  const lastToggleRef = useRef<Record<string, number>>({});

  const addFavorite = useCallback(async (cafe: Cafe) => {
    if (!user) return;
    if (pendingFavoriteOpsRef.current.has(cafe.place_id)) return;

    // Debounce: ignore if toggled within 500ms
    const now = Date.now();
    const lastToggle = lastToggleRef.current[cafe.place_id] || 0;
    if (now - lastToggle < 500) return;
    lastToggleRef.current[cafe.place_id] = now;

    pendingFavoriteOpsRef.current.add(cafe.place_id);

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
      const cafeId = await ensureCafeId(cafe);

      if (cafeId) {
        await supabase.from('favorites').upsert({
          user_id: user.id,
          cafe_id: cafeId,
          garden_emoji: gardenItem.emoji,
          garden_item_id: gardenItem.id,
        }, { onConflict: 'user_id,cafe_id' });
      }
    } catch (err) {
      console.error('[Favorites] Add error:', err);
      // Rollback optimistic update
      setFavorites((prev) => prev.filter((f) => f.place_id !== cafe.place_id));
    } finally {
      pendingFavoriteOpsRef.current.delete(cafe.place_id);
    }
  }, [ensureCafeId, user]);

  const removeFavorite = useCallback(async (placeId: string) => {
    if (!user) return;
    if (pendingFavoriteOpsRef.current.has(placeId)) return;

    // Debounce: ignore if toggled within 500ms
    const now = Date.now();
    const lastToggle = lastToggleRef.current[placeId] || 0;
    if (now - lastToggle < 500) return;
    lastToggleRef.current[placeId] = now;

    pendingFavoriteOpsRef.current.add(placeId);

    // Optimistic update
    const removed = favorites.find((f) => f.place_id === placeId);
    setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));

    try {
      const cafeId = cafeIdCacheRef.current[placeId];
      if (cafeId) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('cafe_id', cafeId);
      } else {
        const { data: cafeData } = await supabase
          .from('cafes')
          .select('id')
          .eq('place_id', placeId)
          .single();

        if (cafeData?.id) {
          cafeIdCacheRef.current[placeId] = cafeData.id;
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('cafe_id', cafeData.id);
        }
      }
    } catch (err) {
      console.error('[Favorites] Remove error:', err);
      if (removed) {
        setFavorites((prev) => [removed, ...prev]);
      }
    } finally {
      pendingFavoriteOpsRef.current.delete(placeId);
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
