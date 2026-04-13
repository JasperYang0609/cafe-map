import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { InteractionManager } from 'react-native';
import { Cafe } from '../types/cafe';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface HistoryEntry {
  cafe: Cafe;
  viewed_at: string;
  user_rating: number;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addToHistory: (cafe: Cafe) => void;
  clearHistory: () => void;
  setHistoryRating: (placeId: string, rating: number) => void;
  getHistoryRating: (placeId: string) => number;
}

const HistoryContext = createContext<HistoryContextType>({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
  setHistoryRating: () => {},
  getHistoryRating: () => 0,
});

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from Supabase when user logs in
  useEffect(() => {
    if (user) {
      const task = InteractionManager.runAfterInteractions(() => {
        loadHistory(user.id);
      });
      return () => task.cancel();
    }

    setHistory([]);
  }, [user?.id]);

  const loadHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select(`
          viewed_at, user_rating,
          cafes (
            id, place_id, name, address, latitude, longitude,
            rating, total_ratings, photo_reference, price_level
          )
        `)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false });

      if (!error && data) {
        const entries: HistoryEntry[] = data
          .filter((d: any) => d.cafes)
          .map((d: any) => ({
            cafe: d.cafes as Cafe,
            viewed_at: d.viewed_at,
            user_rating: d.user_rating || 0,
          }));
        setHistory(entries);
      }
    } catch (err) {
      console.log('[History] Load error:', err);
    }
  };

  const addToHistory = useCallback(async (cafe: Cafe) => {
    const now = new Date().toISOString();

    // Optimistic update (move to top if exists, else add)
    setHistory((prev) => {
      const existing = prev.find((h) => h.cafe.place_id === cafe.place_id);
      const filtered = prev.filter((h) => h.cafe.place_id !== cafe.place_id);
      return [
        { cafe, viewed_at: now, user_rating: existing?.user_rating || 0 },
        ...filtered,
      ];
    });

    // Persist to Supabase if logged in
    if (user) {
      try {
        // Upsert cafe first
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
          updated_at: now,
        }, { onConflict: 'place_id' });

        // Get cafe UUID
        const { data: cafeData } = await supabase
          .from('cafes')
          .select('id')
          .eq('place_id', cafe.place_id)
          .single();

        if (cafeData) {
          // Upsert search history (update viewed_at if exists)
          await supabase.from('search_history').upsert({
            user_id: user.id,
            cafe_id: cafeData.id,
            viewed_at: now,
          }, { onConflict: 'user_id,cafe_id' });
        }
      } catch (err) {
        console.log('[History] Save error:', err);
      }
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    if (user) {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.log('[History] Clear error:', err);
      }
    }
  }, [user]);

  const setHistoryRating = useCallback(async (placeId: string, rating: number) => {
    // Optimistic update
    setHistory((prev) =>
      prev.map((h) =>
        h.cafe.place_id === placeId ? { ...h, user_rating: rating } : h
      )
    );

    // Persist to Supabase
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
        console.log('[History] Rating save error:', err);
      }
    }
  }, [user]);

  const getHistoryRating = useCallback((placeId: string): number => {
    const entry = history.find((h) => h.cafe.place_id === placeId);
    return entry?.user_rating || 0;
  }, [history]);

  return (
    <HistoryContext.Provider value={{
      history,
      addToHistory,
      clearHistory,
      setHistoryRating,
      getHistoryRating,
    }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
