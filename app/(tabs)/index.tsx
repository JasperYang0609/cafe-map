import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useLocation } from '../../src/hooks/useLocation';
import { useCafes } from '../../src/hooks/useCafes';
import CafeCard from '../../src/components/CafeCard';
import FilterSheet, { FilterOptions, DEFAULT_FILTERS } from '../../src/components/FilterSheet';
import { useHistory } from '../../src/context/HistoryContext';
import { useI18n } from '../../src/context/I18nContext';
import { showRewardedAd, needsAd, recordPick, getFreePicks, getSubscriptionStatus } from '../../src/lib/ads';
import { useFavorites } from '../../src/context/FavoritesContext';
import { getRarityColor } from '../../src/lib/garden';
import BannerAdPlaceholder from '../../src/components/BannerAdPlaceholder';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const { t } = useI18n();
  const location = useLocation();
  const { cafes, loading: cafesLoading, fetchCafes, getRandomCafe } = useCafes();
  const { addToHistory } = useHistory();
  const { addFavorite, isFavorited, lastRolled, clearLastRolled } = useFavorites();

  // Show garden roll result when favoriting
  useEffect(() => {
    if (lastRolled) {
      const rarityMsg = lastRolled.rarity === 'legendary' ? '🎉 Legendary!'
        : lastRolled.rarity === 'epic' ? '✨ Epic!'
        : lastRolled.rarity === 'rare' ? '💎 Rare!'
        : '';
      Alert.alert(lastRolled.emoji, rarityMsg || undefined);
      clearLastRolled();
    }
  }, [lastRolled]);

  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [isGrowing, setIsGrowing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultCafe, setResultCafe] = useState<any>(null);
  const [isFirstSeed, setIsFirstSeed] = useState(true);
  const [adLoading, setAdLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const filteredCafes = cafes.filter((cafe) => {
    if (filters.minRating > 0 && cafe.rating < filters.minRating) return false;
    if (filters.openNow && cafe.is_open !== true) return false;
    if (cafe.distance && cafe.distance > filters.maxDistance * 1000) return false;
    return true;
  });

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const treeScale = useRef(new Animated.Value(0)).current;

  // 日曬 Natural / 水洗 Washed / 蜜處理 Honey — no labels, let 跑咖仔 figure it out
  const SEEDS = [
    { id: 1, image: require('../../src/assets/images/seed-natural-tarot.png') },
    { id: 2, image: require('../../src/assets/images/seed-washed-tarot.png') },
    { id: 3, image: require('../../src/assets/images/seed-honey-tarot.png') },
  ];

  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchCafes(location.latitude, location.longitude);
    }
  }, [location.loading, location.error, location.latitude, location.longitude]);

  const handleSeedPress = async (seedId: number) => {
    if (isGrowing || cafesLoading) return;

    // Check if ad needed (after daily free picks)
    if (needsAd()) {
      setAdLoading(true);
      const watched = await showRewardedAd();
      setAdLoading(false);
      if (!watched) return;
    }

    recordPick();
    setSelectedSeed(seedId);
    setIsGrowing(true);
    setShowResult(false);

    const cafe = filteredCafes.length > 0
      ? filteredCafes[Math.floor(Math.random() * filteredCafes.length)]
      : getRandomCafe();
    setResultCafe(cafe);

    if (cafe) {
      addToHistory(cafe);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(treeScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowResult(true);
    });
  };

  const handleReset = () => {
    setSelectedSeed(null);
    setIsGrowing(false);
    setShowResult(false);
    setResultCafe(null);
    setIsFirstSeed(false);
    scaleAnim.setValue(1);
    fadeAnim.setValue(0);
    treeScale.setValue(0);
  };

  const freePicks = getFreePicks();
  const isSub = getSubscriptionStatus();

  const getSubtitle = () => {
    if (location.loading) return t('explore.subtitle_loading');
    if (cafesLoading) return t('explore.subtitle_searching');
    const cafeCount = filteredCafes.length < cafes.length
      ? t('explore.subtitle_filtered', { filtered: filteredCafes.length, total: cafes.length })
      : t('explore.subtitle_found', { count: cafes.length });

    if (isSub) return cafeCount;
    if (freePicks > 0) return `${cafeCount}\n${t('explore.free_picks', { count: freePicks })}`;
    return `${cafeCount}\n${t('explore.no_free_picks')}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('explore.title')}</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
      </View>

      <View style={styles.seedArea}>
        {adLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('explore.loading_ad')}</Text>
          </View>
        ) : (location.loading || cafesLoading) && !isGrowing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {location.loading ? t('explore.subtitle_loading') : t('explore.subtitle_searching')}
            </Text>
          </View>
        ) : !isGrowing ? (
          <View style={styles.seedRow}>
            {SEEDS.map((seed) => (
              <TouchableOpacity
                key={seed.id}
                style={[styles.seedButton, filteredCafes.length === 0 && styles.seedButtonDisabled]}
                onPress={() => handleSeedPress(seed.id)}
                activeOpacity={0.7}
                disabled={filteredCafes.length === 0}
              >
                <Image source={seed.image} style={styles.seedImage} />
              </TouchableOpacity>
            ))}
            {filteredCafes.length === 0 && !cafesLoading && (
              <Text style={styles.noCafeText}>{t('explore.no_cafe')}</Text>
            )}
          </View>
        ) : (
          <ScrollView style={styles.growArea} contentContainerStyle={styles.growAreaContent} showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[styles.treeContainer, { opacity: fadeAnim, transform: [{ scale: treeScale }] }]}
            >
              <Text style={styles.treeEmoji}>🌳</Text>
            </Animated.View>

            {showResult && resultCafe && (
              <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                <CafeCard
                  cafe={resultCafe}
                  showFavoriteButton={true}
                  isFavorited={isFavorited(resultCafe.place_id)}
                  onFavorite={() => {
                    if (!isFavorited(resultCafe.place_id)) {
                      addFavorite(resultCafe);
                    }
                  }}
                />
                <TouchableOpacity style={styles.retryButton} onPress={handleReset} disabled={adLoading}>
                  {adLoading ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.retryText}>{t('explore.loading_ad')}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
                      <Text style={styles.retryText}>{t('explore.retry')}</Text>
                      {needsAd() && (
                        <View style={styles.adBadge}>
                          <Ionicons name="play-circle-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.adBadgeText}>{t('explore.watch_ad_to_pick')}</Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {showResult && !resultCafe && (
              <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                <Text style={styles.noResultText}>{t('explore.no_cafe')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                  <Text style={styles.retryText}>{t('explore.retry')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        )}
      </View>

      <FilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(f) => setFilters(f)}
        currentFilters={filters}
      />
      </SafeAreaView>
      <BannerAdPlaceholder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  filterButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  seedArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg, overflow: 'hidden' },
  loadingContainer: { alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.textSecondary },
  seedRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, flexWrap: 'wrap' },
  seedButton: {
    width: 95, height: 130, borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  seedButtonDisabled: { opacity: 0.4 },
  seedImage: { width: '100%', height: '100%', borderRadius: BorderRadius.lg },
  seedLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  noCafeText: { width: '100%', textAlign: 'center', marginTop: Spacing.lg, fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  growArea: { flex: 1, width: '100%' },
  growAreaContent: { alignItems: 'center', paddingBottom: Spacing.md },
  treeContainer: { marginBottom: Spacing.sm },
  treeEmoji: { fontSize: 40 },
  resultContainer: { width: width - Spacing.lg * 2 },
  retryButton: {
    flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  retryText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  adBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 4,
  },
  adBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  bannerContainer: { flexShrink: 0 },
  noResultText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
