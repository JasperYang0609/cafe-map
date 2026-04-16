import { useState, useCallback } from 'react';
import { getCafesWithCache } from '../lib/h3cache';
import { enrichWithDistance } from '../lib/cafeDiscovery';
import { Cafe } from '../types/cafe';

interface UseCafesReturn {
  cafes: Cafe[];
  loading: boolean;
  error: string | null;
  fetchCafes: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  getRandomCafe: () => Cafe | null;
}

export function useCafes(): UseCafesReturn {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCafes = useCallback(async (lat: number, lng: number, radiusKm?: number) => {
    setLoading(true);
    setError(null);

    try {
      const radiusMeters = radiusKm ? radiusKm * 1000 : 5000;
      const results = await getCafesWithCache(lat, lng, radiusMeters);

      // Add distance and recompute is_open
      const enriched = enrichWithDistance(results, lat, lng);

      // Sort by distance
      enriched.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setCafes(enriched);
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
