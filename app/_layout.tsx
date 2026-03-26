import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';
import { HistoryProvider } from '../src/context/HistoryContext';
import { AuthProvider } from '../src/context/AuthContext';
import { I18nProvider } from '../src/context/I18nContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';

export default function RootLayout() {
  useEffect(() => {
    // Lazy import to avoid crash in Expo Go
    import('../src/lib/ads').then(({ initAds }) => {
      initAds();
    }).catch(() => {
      console.log('[Ads] Failed to load ads module');
    });
  }, []);
  return (
    <I18nProvider>
      <AuthProvider>
        <FavoritesProvider>
        <HistoryProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="cafe/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="pages/privacy"
              options={{ headerShown: false }}
            />
          </Stack>
        </HistoryProvider>
        </FavoritesProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
