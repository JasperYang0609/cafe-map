import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_REGION } from '../constants/config';

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation((prev) => ({
            ...prev,
            loading: false,
            error: '需要位置權限才能顯示附近咖啡廳',
          }));
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          loading: false,
          error: null,
        });
      } catch (err) {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: '無法取得位置',
        }));
      }
    })();
  }, []);

  return location;
}
