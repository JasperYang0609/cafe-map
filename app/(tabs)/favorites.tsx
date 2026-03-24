import BannerAdPlaceholder from '../../src/components/BannerAdPlaceholder';
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useLocation } from '../../src/hooks/useLocation';
import { getSubscriptionStatus } from '../../src/lib/ads';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { favorites, favCount } = useFavorites();
  const location = useLocation();
  const isLoggedIn = !!user;
  const isSubscribed = getSubscriptionStatus();

  // Not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('favorites.login_title')}</Text>
          <Text style={styles.emptyText}>{t('favorites.login_text')}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.loginText}>{t('favorites.login_button')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No favorites yet
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('favorites.empty_title')}</Text>
          <Text style={styles.emptyText}>{t('favorites.empty_text')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Find the densest cluster center for map focus
  // Use average of all favorites (shows the cluster center)
  const avgLat = favorites.reduce((sum, f) => sum + f.latitude, 0) / favorites.length;
  const avgLng = favorites.reduce((sum, f) => sum + f.longitude, 0) / favorites.length;

  // Tight zoom to show density (closer = more impactful)
  const latSpread = Math.max(...favorites.map(f => f.latitude)) - Math.min(...favorites.map(f => f.latitude));
  const lngSpread = Math.max(...favorites.map(f => f.longitude)) - Math.min(...favorites.map(f => f.longitude));
  const latDelta = Math.max(0.015, latSpread * 1.3);
  const lngDelta = Math.max(0.015, lngSpread * 1.3);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.countText}>🌳 × {favCount}</Text>
      </View>

      {/* Full-page Forest Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          scrollEnabled={isSubscribed}
          zoomEnabled={isSubscribed}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {favorites.map((cafe) => (
            <Marker
              key={cafe.place_id}
              coordinate={{
                latitude: cafe.latitude,
                longitude: cafe.longitude,
              }}
            >
              <View style={styles.treeMarker}>
                <Text style={styles.treeEmoji}>🌳</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Blur overlay for free users */}
        {!isSubscribed && (
          <View style={styles.blurOverlay}>
            <View style={styles.lockCard}>
              <Ionicons name="lock-closed" size={28} color={Colors.primary} />
              <Text style={styles.lockTitle}>{t('favorites.forest_title')}</Text>
              <Text style={styles.lockDesc}>{t('favorites.subscribe_hint')}</Text>
              <TouchableOpacity style={styles.unlockButton}>
                <Ionicons name="star" size={16} color={Colors.surface} />
                <Text style={styles.unlockText}>{t('favorites.subscribe_button')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl + 20, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  countText: { fontSize: FontSize.md, color: Colors.accent, fontWeight: '600' },

  // Full-page map
  mapContainer: {
    flex: 1, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  map: { flex: 1 },
  treeMarker: { padding: 2 },
  treeEmoji: { fontSize: 28 },

  // Blur overlay
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 240, 0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  lockCard: {
    alignItems: 'center', backgroundColor: Colors.surface,
    padding: Spacing.xl, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  lockTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  lockDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg,
  },
  unlockButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 99,
  },
  unlockText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },

  // Tree count badge
  treeCountBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  treeCountText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.accent },

  // Empty states
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  loginText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },
});
