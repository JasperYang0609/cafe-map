import { useState, useCallback } from 'react';
import { getCafesWithCache } from '../lib/h3cache';
import { calculateDistance } from '../lib/places';
import { Cafe } from '../types/cafe';

interface UseCafesReturn {
  cafes: Cafe[];
  loading: boolean;
  error: string | null;
  fetchCafes: (lat: number, lng: number) => Promise<void>;
  getRandomCafe: () => Cafe | null;
}

export function useCafes(): UseCafesReturn {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);

  const fetchCafes = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    setUserLat(lat);
    setUserLng(lng);

    try {
      const results = await getCafesWithCache(lat, lng);

      // Add distance to each cafe
      const withDistance = results.map((cafe) => ({
        ...cafe,
        distance: calculateDistance(lat, lng, cafe.latitude, cafe.longitude),
      }));

      // Sort by distance
      withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setCafes(withDistance);
    } catch (err: any) {
      setError(err.message || '搜尋咖啡廳時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRandomCafe = useCallback((): Cafe | null => {
    if (cafes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * cafes.length);
    return cafes[randomIndex];
  }, [cafes]);

  return { cafes, loading, error, fetchCafes, getRandomCafe };
}
