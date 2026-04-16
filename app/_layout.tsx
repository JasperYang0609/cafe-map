import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, FontSize, Spacing } from '../src/constants/theme';
import { HistoryProvider } from '../src/context/HistoryContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { I18nProvider } from '../src/context/I18nContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';

function StartupOverlay() {
  const { loading: authLoading, user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(8);
  const [locationReady, setLocationReady] = useState(false);
  const beanGoBrand = require('../assets/beango-character.png');

  useEffect(() => {
    let cancelled = false;

    const warmLocation = async () => {
      try {
        const current = await Location.getForegroundPermissionsAsync();

        if (current.status === 'undetermined') {
          await Location.requestForegroundPermissionsAsync();
        }
      } catch (error) {
        console.log('[Startup] Location warmup skipped:', error);
      } finally {
        if (!cancelled) setLocationReady(true);
      }
    };

    warmLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const authTarget = authLoading ? 55 : 82;
        const locationTarget = locationReady ? 100 : authTarget;
        if (prev >= locationTarget) return prev;
        return Math.min(prev + (locationReady ? 8 : 5), locationTarget);
      });
    }, 140);

    const adTimer = setTimeout(() => {
      if (cancelled || authLoading || user?.isSubscribed) return;

      import('../src/lib/ads').then(({ initAds }) => initAds()).catch(() => {
        console.log('[Ads] Failed to load ads module');
      });
    }, 700);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(adTimer);
    };
  }, [authLoading, locationReady, user?.isSubscribed]);

  useEffect(() => {
    if (authLoading || !locationReady || progress < 100) return;

    const timer = setTimeout(() => setVisible(false), 260);
    return () => clearTimeout(timer);
  }, [authLoading, locationReady, progress]);

  const statusText = useMemo(() => {
    if (progress < 28) return '正在喚醒 BeanGo⋯';
    if (progress < 55) return '正在同步帳號與咖啡地圖⋯';
    if (!locationReady) return '正在確認定位權限⋯';
    if (progress < 90) return '正在準備探索功能與資料⋯';
    return '準備完成';
  }, [progress, locationReady]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Image source={beanGoBrand} style={styles.brandImage} />
      <Text style={styles.brandTitle}>BeanGo 跑咖</Text>
      <Text style={styles.brandSubtitle}>{statusText}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );
}

function AppShell() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cafe/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="pages/privacy" options={{ headerShown: false }} />
      </Stack>
      <StartupOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <FavoritesProvider>
          <HistoryProvider>
            <AppShell />
          </HistoryProvider>
        </FavoritesProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 999,
  },
  brandImage: {
    width: 132,
    height: 132,
    resizeMode: 'contain',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  brandSubtitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  progressTrack: {
    width: '82%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E8E0D8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  progressText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
});
