import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Platform, Linking, Animated, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BannerAdPlaceholder from '../../src/components/BannerAdPlaceholder';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { GARDEN_ITEMS, getRarityColor } from '../../src/lib/garden';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useLocation } from '../../src/hooks/useLocation';
import { getSubscriptionStatus } from '../../src/lib/ads';
import { getGardenEmojiImage } from '../../src/lib/gardenImages';
import { getPhotoUrl } from '../../src/lib/places';
import { Cafe } from '../../src/types/cafe';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { favorites, removeFavorite, favCount, setRating, getRating } = useFavorites();
  const location = useLocation();
  const isLoggedIn = !!user;
  const isSubscribed = getSubscriptionStatus();
  const showAds = !isSubscribed;
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [heartFilter, setHeartFilter] = useState<number | null>(null); // null=all, 0=no rating, 1-3=hearts
  const [showRarityGuide, setShowRarityGuide] = useState(false);
  const beanGoBrand = require('../../assets/beango-character.png');

  // Collected emoji set for rarity guide
  const collectedEmojis = new Set(favorites.map(f => f.gardenEmoji || '🌳'));

  // Rarity order for sorting (legendary first)
  const RARITY_ORDER: Record<string, number> = {
    legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
  };

  // Rarity label map
  const RARITY_LABELS: Record<string, string> = {
    common: 'C', uncommon: 'N', rare: 'R', epic: 'SR', legendary: 'SSR',
  };

  const filteredFavorites = heartFilter === null
    ? favorites
    : favorites.filter(f => (f.heartRating || 0) === heartFilter);

  const beanImg = require('../../src/assets/images/coffee-bean-nobg.png');
  const beanGrayImg = require('../../src/assets/images/coffee-bean-gray.png');
  const bounceAnim = useRef(new Animated.Value(0)).current;
  // Allow tracksViewChanges briefly so Android renders emoji bitmaps
  // Reset when favorites load or filter changes
  const [markersReady, setMarkersReady] = useState(false);
  useEffect(() => {
    setMarkersReady(false);
    const timer = setTimeout(() => setMarkersReady(true), 500);
    return () => clearTimeout(timer);
  }, [heartFilter, favorites.length, user?.id]);

  // Track recently deselected marker so it can refresh its bitmap
  const [recentlyDeselectedId, setRecentlyDeselectedId] = useState<string | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prevId = prevSelectedIdRef.current;
    const currId = selectedCafe?.place_id || null;
    prevSelectedIdRef.current = currId;
    if (prevId && prevId !== currId) {
      setRecentlyDeselectedId(prevId);
      const timer = setTimeout(() => setRecentlyDeselectedId(null), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCafe?.place_id]);

  const triggerBounce = () => {
    bounceAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -5, duration: 120, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: -3, duration: 80, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

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

  const ff = filteredFavorites.length > 0 ? filteredFavorites : favorites;
  const avgLat = ff.reduce((sum, f) => sum + f.latitude, 0) / ff.length;
  const avgLng = ff.reduce((sum, f) => sum + f.longitude, 0) / ff.length;
  const latSpread = Math.max(...ff.map(f => f.latitude)) - Math.min(...ff.map(f => f.latitude));
  const lngSpread = Math.max(...ff.map(f => f.longitude)) - Math.min(...ff.map(f => f.longitude));
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
    <View style={styles.screen}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <View style={styles.headerBrandGroup}>
          <Image source={beanGoBrand} style={styles.headerBrandIcon} />
          <Image source={beanGoBrand} style={styles.headerBrandIcon} />
          <Image source={beanGoBrand} style={styles.headerBrandIcon} />
        </View>
      </View>

      {/* Bean rating filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.allButton, heartFilter === null && styles.allButtonActive]}
          onPress={() => setHeartFilter(null)}
        >
          <Text style={[styles.allButtonText, heartFilter === null && styles.allButtonTextActive]}>ALL</Text>
        </TouchableOpacity>
        <View style={styles.filterBeans}>
          {[1, 2, 3, 4].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setHeartFilter(heartFilter === level ? null : level)}
            >
              <Image
                source={(heartFilter !== null && heartFilter >= level) ? beanImg : beanGrayImg}
                style={styles.filterBeanIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterCount}>
          × {heartFilter === null ? favorites.length : filteredFavorites.length}
        </Text>
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
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          onPress={() => setSelectedCafe(null)}
        >
          {filteredFavorites.map((cafe) => (
            <Marker
              key={cafe.place_id}
              coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
              onSelect={() => {
                setSelectedCafe(cafe); triggerBounce();
              }}
              onPress={() => {
                setSelectedCafe(cafe); triggerBounce();
              }}
              tracksViewChanges={!markersReady || selectedCafe?.place_id === cafe.place_id || cafe.place_id === recentlyDeselectedId}
            >
              {selectedCafe?.place_id === cafe.place_id ? (
                <Animated.View style={[styles.treeMarker, { transform: [{ translateY: bounceAnim }] }]}>
                  {getGardenEmojiImage(cafe.gardenEmoji || '🌳') ? (
                    <Image source={getGardenEmojiImage(cafe.gardenEmoji || '🌳')!} style={styles.treeEmojiImage} />
                  ) : (
                    <Text style={styles.treeEmoji}>{cafe.gardenEmoji || '🌳'}</Text>
                  )}
                </Animated.View>
              ) : (
                <View style={styles.treeMarker}>
                  {getGardenEmojiImage(cafe.gardenEmoji || '🌳') ? (
                    <Image source={getGardenEmojiImage(cafe.gardenEmoji || '🌳')!} style={styles.treeEmojiImage} />
                  ) : (
                    <Text style={styles.treeEmoji}>{cafe.gardenEmoji || '🌳'}</Text>
                  )}
                </View>
              )}
            </Marker>
          ))}
        </MapView>

        {/* Selected cafe card */}
        {selectedCafe && (
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
                <View style={styles.cafeRatingRow}>
                  <View style={styles.cafeRating}>
                    <Ionicons name="star" size={12} color={Colors.star} />
                    <Text style={styles.cafeRatingText}>
                      {selectedCafe.rating > 0 ? selectedCafe.rating.toFixed(1) : '-'}
                    </Text>
                  </View>
                  <View style={styles.cafeBeanRating}>
                    {[1, 2, 3, 4].map((level) => (
                      <TouchableOpacity key={level} onPress={() => setRating(selectedCafe.place_id, getRating(selectedCafe.place_id) === level ? 0 : level)}>
                        <Image
                          source={getRating(selectedCafe.place_id) >= level ? beanImg : beanGrayImg}
                          style={styles.cafeBeanIcon}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
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

      {/* Emoji collection counts — sorted by rarity */}
      <View style={styles.emojiCountsBar}>
        {Object.entries(
          favorites.reduce((acc: Record<string, number>, f) => {
            const e = f.gardenEmoji || '🌳';
            acc[e] = (acc[e] || 0) + 1;
            return acc;
          }, {})
        )
          .sort(([emojiA], [emojiB]) => {
            const itemA = GARDEN_ITEMS.find(g => g.emoji === emojiA);
            const itemB = GARDEN_ITEMS.find(g => g.emoji === emojiB);
            return (RARITY_ORDER[itemA?.rarity || 'common'] ?? 99)
              - (RARITY_ORDER[itemB?.rarity || 'common'] ?? 99)
              || (itemA?.weight ?? 99) - (itemB?.weight ?? 99);
          })
          .map(([emoji, count]) => {
            const item = GARDEN_ITEMS.find(g => g.emoji === emoji);
            return (
              <Text key={emoji} style={[styles.emojiCount, item && { color: getRarityColor(item.rarity) }]}>
                {emoji}×{count}
              </Text>
            );
          })}
        <TouchableOpacity style={styles.rarityGuideBtn} onPress={() => setShowRarityGuide(true)}>
          <Ionicons name="help-circle-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Rarity Guide Modal */}
      <Modal visible={showRarityGuide} transparent animationType="fade" onRequestClose={() => setShowRarityGuide(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRarityGuide(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌳 花園圖鑑</Text>
              <TouchableOpacity onPress={() => setShowRarityGuide(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {[...GARDEN_ITEMS]
              .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99) || a.weight - b.weight)
              .map((item) => {
                const owned = collectedEmojis.has(item.emoji);
                const count = favorites.filter(f => (f.gardenEmoji || '🌳') === item.emoji).length;
                return (
                  <View key={item.id} style={[styles.guideRow, !owned && styles.guideRowLocked]}>
                    <Text style={[styles.guideEmoji, !owned && styles.guideEmojiLocked]}>
                      {owned ? item.emoji : '❓'}
                    </Text>
                    <View style={styles.guideInfo}>
                      <View style={styles.guideNameRow}>
                        <Text style={[styles.guideBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
                          {RARITY_LABELS[item.rarity] || 'C'}
                        </Text>
                        <Text style={[styles.guideName, !owned && styles.guideNameLocked]}>
                          {owned ? item.id.charAt(0).toUpperCase() + item.id.slice(1) : '???'}
                        </Text>
                      </View>
                      <Text style={styles.guideRate}>
                        {item.weight}% {owned ? `· ×${count}` : '· 未收集'}
                      </Text>
                    </View>
                    {owned && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                  </View>
                );
              })}
            <Text style={styles.guideFooter}>
              已收集 {collectedEmojis.size} / {GARDEN_ITEMS.length} 種
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    {showAds && <BannerAdPlaceholder />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl + 20, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  headerBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerBrandIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  filterRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
  allButton: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  allButtonActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  allButtonText: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
  },
  allButtonTextActive: {
    color: '#fff',
  },
  filterBeans: {
    flexDirection: 'row', gap: 6,
  },
  filterBeanIcon: {
    width: 28, height: 28, resizeMode: 'contain',
  },
  filterCount: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginLeft: 4,
  },
  emojiCountsBar: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
  emojiCount: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
  rarityGuideBtn: { marginLeft: 4, padding: 2 },

  // Rarity Guide Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, width: '85%', maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  guideRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  guideRowLocked: { opacity: 0.5 },
  guideEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  guideEmojiLocked: { fontSize: 22 },
  guideInfo: { flex: 1, marginLeft: Spacing.sm },
  guideNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guideBadge: {
    fontSize: 10, fontWeight: '800', color: '#fff',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden',
  },
  guideName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  guideNameLocked: { color: Colors.textSecondary },
  guideRate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  guideFooter: {
    textAlign: 'center', fontSize: FontSize.sm, color: Colors.textSecondary,
    marginTop: Spacing.md, fontWeight: '600',
  },

  mapContainer: {
    flex: 1, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  map: { flex: 1 },
  treeMarker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeEmoji: { fontSize: 24 },
  treeEmojiImage: { width: 28, height: 28, resizeMode: 'contain' as const },

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
  cafeRatingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
  },
  cafeRating: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  cafeBeanRating: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  cafeBeanIcon: {
    width: 14, height: 14, resizeMode: 'contain',
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
