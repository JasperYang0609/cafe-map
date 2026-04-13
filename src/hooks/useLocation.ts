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
        const permission = await Location.getForegroundPermissionsAsync();
        let status = permission.status;

        if (status === 'undetermined') {
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }

        if (status !== 'granted') {
          setLocation((prev) => ({
            ...prev,
            loading: false,
            error: '需要位置權限才能顯示附近咖啡廳',
          }));
          return;
        }

        // Fast path: use last known position first for instant UI
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            loading: false,
            error: null,
          });
        }

        // Then get accurate position in background
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
