import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Platform, Linking,
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
import { getPhotoUrl } from '../../src/lib/places';
import { Cafe } from '../../src/types/cafe';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { favorites, removeFavorite, favCount } = useFavorites();
  const location = useLocation();
  const isLoggedIn = !!user;
  const isSubscribed = getSubscriptionStatus();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

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

  // No favorites
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

  const avgLat = favorites.reduce((sum, f) => sum + f.latitude, 0) / favorites.length;
  const avgLng = favorites.reduce((sum, f) => sum + f.longitude, 0) / favorites.length;
  const latSpread = Math.max(...favorites.map(f => f.latitude)) - Math.min(...favorites.map(f => f.latitude));
  const lngSpread = Math.max(...favorites.map(f => f.longitude)) - Math.min(...favorites.map(f => f.longitude));
  const latDelta = Math.max(0.015, latSpread * 1.5);
  const lngDelta = Math.max(0.015, lngSpread * 1.5);

  const handleNavigate = async (cafe: Cafe) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}&destination_place_id=${cafe.place_id}`;
    const canOpen = await Linking.canOpenURL('comgooglemaps://');
    if (canOpen) {
      Linking.openURL(`comgooglemaps://?daddr=${cafe.latitude},${cafe.longitude}&directionsmode=driving`);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.countText}>❤️ {favCount}</Text>
      </View>

      {/* Forest Map */}
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
          onPress={() => setSelectedCafe(null)}
        >
          {favorites.map((cafe) => (
            <Marker
              key={cafe.place_id}
              coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
              onSelect={() => isSubscribed && setSelectedCafe(cafe)}
              onPress={() => isSubscribed && setSelectedCafe(cafe)}
              tracksViewChanges={true}
            >
              <View style={[
                styles.treeMarker,
                selectedCafe?.place_id === cafe.place_id && styles.treeMarkerSelected,
              ]}>
                <Text style={[
                  styles.treeEmoji,
                  selectedCafe?.place_id === cafe.place_id && styles.treeEmojiSelected,
                ]}>{cafe.gardenEmoji || '🌳'}</Text>
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

        {/* Selected cafe card (subscribers only) */}
        {selectedCafe && isSubscribed && (
          <View style={styles.cafeCard}>
            <TouchableOpacity
              style={styles.cafeCardRow}
              onPress={() => router.push({
                pathname: '/cafe/[id]',
                params: {
                  id: selectedCafe.place_id,
                  place_id: selectedCafe.place_id,
                  name: selectedCafe.name,
                  address: selectedCafe.address || '',
                  latitude: String(selectedCafe.latitude),
                  longitude: String(selectedCafe.longitude),
                  rating: String(selectedCafe.rating),
                  total_ratings: String(selectedCafe.total_ratings),
                  photo_reference: selectedCafe.photo_reference || '',
                  photo_references: JSON.stringify(selectedCafe.photo_references || []),
                  phone: selectedCafe.phone || '',
                  website: selectedCafe.website || '',
                  distance: selectedCafe.distance ? String(selectedCafe.distance) : '',
                },
              })}
              activeOpacity={0.8}
            >
              {selectedCafe.photo_reference ? (
                <Image
                  source={{ uri: getPhotoUrl(selectedCafe.photo_reference, 200) }}
                  style={styles.cafePhoto}
                />
              ) : (
                <View style={[styles.cafePhoto, styles.cafePhotoPlaceholder]}>
                  <Ionicons name="cafe-outline" size={24} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.cafeInfo}>
                <Text style={styles.cafeName} numberOfLines={1}>{selectedCafe.name}</Text>
                <View style={styles.cafeRating}>
                  <Ionicons name="star" size={12} color={Colors.star} />
                  <Text style={styles.cafeRatingText}>
                    {selectedCafe.rating > 0 ? selectedCafe.rating.toFixed(1) : '-'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cafeNavBtn}
              onPress={() => handleNavigate(selectedCafe)}
            >
              <Ionicons name="navigate" size={16} color={Colors.surface} />
            </TouchableOpacity>
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

  mapContainer: {
    flex: 1, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  map: { flex: 1 },
  treeMarker: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  treeMarkerSelected: {
    width: 48, height: 48,
    backgroundColor: 'rgba(111, 78, 55, 0.15)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  treeEmoji: { fontSize: 22 },
  treeEmojiSelected: { fontSize: 30 },

  // Blur
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
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99,
  },
  unlockText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },

  // Cafe card on map
  cafeCard: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  cafeCardRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
  },
  cafePhoto: {
    width: 50, height: 50, borderRadius: BorderRadius.sm,
  },
  cafePhotoPlaceholder: {
    backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  cafeInfo: {
    flex: 1, marginLeft: Spacing.sm,
  },
  cafeName: {
    fontSize: FontSize.md, fontWeight: '600', color: Colors.text,
  },
  cafeRating: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  cafeRatingText: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
  },
  cafeNavBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginLeft: Spacing.sm,
  },

  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  loginText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },
});
