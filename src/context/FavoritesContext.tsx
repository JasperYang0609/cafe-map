import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Cafe } from '../types/cafe';

interface FavoritesContextType {
  favorites: Cafe[];
  addFavorite: (cafe: Cafe) => boolean;
  removeFavorite: (placeId: string) => void;
  isFavorited: (placeId: string) => boolean;
  favCount: number;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => false,
  removeFavorite: () => {},
  isFavorited: () => false,
  favCount: 0,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Cafe[]>([]);

  const addFavorite = useCallback((cafe: Cafe): boolean => {
    let added = false;
    setFavorites((prev) => {
      if (prev.some((f) => f.place_id === cafe.place_id)) return prev;
      added = true;
      return [cafe, ...prev];
    });
    return added;
  }, []);

  const removeFavorite = useCallback((placeId: string) => {
    setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));
  }, []);

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
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
