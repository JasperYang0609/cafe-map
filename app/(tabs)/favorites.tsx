import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { DEFAULT_REGION } from '../../src/constants/config';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useLocation } from '../../src/hooks/useLocation';
import CafeCard from '../../src/components/CafeCard';
import { getSubscriptionStatus } from '../../src/lib/ads';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { favorites, removeFavorite } = useFavorites();
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

  // Calculate map region to fit all favorites
  const lats = favorites.map(f => f.latitude);
  const lngs = favorites.map(f => f.longitude);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const latDelta = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 1.5);
  const lngDelta = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 1.5);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.countText}>🌳 {favorites.length}</Text>
      </View>

      {/* Forest Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: centerLat || location.latitude,
            longitude: centerLng || location.longitude,
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
              {...(Platform.OS === 'ios'
                ? { pinColor: '#2D5A27' }
                : { tracksViewChanges: false }
              )}
            >
              {Platform.OS === 'android' && (
                <View style={styles.treeMarker}>
                  <Text style={styles.treeEmoji}>🌳</Text>
                </View>
              )}
            </Marker>
          ))}
        </MapView>

        {/* Blur overlay for free users */}
        {!isSubscribed && (
          <View style={styles.blurOverlay}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={20} color={Colors.surface} />
              <Text style={styles.lockText}>{t('favorites.forest_title')}</Text>
            </View>
            <TouchableOpacity style={styles.unlockButton}>
              <Ionicons name="star" size={16} color={Colors.surface} />
              <Text style={styles.unlockText}>{t('favorites.subscribe_button')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Subscribe banner */}
      {!isSubscribed && (
        <View style={styles.subscribeBanner}>
          <Ionicons name="star" size={16} color={Colors.primary} />
          <Text style={styles.subscribeBannerText}>{t('favorites.subscribe_hint')}</Text>
        </View>
      )}

      {/* Cafe list */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <CafeCard
              cafe={item}
              showFavoriteButton={true}
              isFavorited={true}
              onFavorite={() => {
                Alert.alert('🗑️', t('favorites.remove_confirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('favorites.remove'), style: 'destructive', onPress: () => removeFavorite(item.place_id) },
                ]);
              }}
            />
          </View>
        )}
        contentContainerStyle={styles.list}
      />
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

  // Map
  mapContainer: {
    height: 200, marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  map: { flex: 1 },
  treeMarker: {
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 4,
  },
  treeEmoji: { fontSize: 20 },

  // Blur overlay
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 240, 0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 12,
  },
  lockText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: '600' },
  unlockButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  unlockText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: '600' },

  // Subscribe banner
  subscribeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  subscribeBannerText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },

  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  loginText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },

  // List
  list: { padding: Spacing.lg },
  cardContainer: { marginBottom: Spacing.lg },
});
