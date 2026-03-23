import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useLocation } from '../../src/hooks/useLocation';
import { useCafes } from '../../src/hooks/useCafes';
import CafeCard from '../../src/components/CafeCard';
import { useHistory } from '../../src/context/HistoryContext';
import { showRewardedAd, shouldShowAd } from '../../src/lib/ads';

const { width } = Dimensions.get('window');

const SEEDS = [
  { id: 1, emoji: '🫘', label: '深焙' },
  { id: 2, emoji: '🌿', label: '淺焙' },
  { id: 3, emoji: '🍫', label: '特調' },
];

export default function ExploreScreen() {
  const location = useLocation();
  const { cafes, loading: cafesLoading, fetchCafes, getRandomCafe } = useCafes();
  const { addToHistory } = useHistory();

  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [isGrowing, setIsGrowing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultCafe, setResultCafe] = useState<any>(null);
  const [isFirstSeed, setIsFirstSeed] = useState(true);
  const [adLoading, setAdLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const treeScale = useRef(new Animated.Value(0)).current;

  // Fetch cafes when location is ready
  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchCafes(location.latitude, location.longitude);
    }
  }, [location.loading, location.error, location.latitude, location.longitude]);

  const handleSeedPress = (seedId: number) => {
    if (isGrowing || cafesLoading) return;

    setSelectedSeed(seedId);
    setIsGrowing(true);
    setShowResult(false);

    // Get random cafe
    const cafe = getRandomCafe();
    setResultCafe(cafe);

    // Record to history
    if (cafe) {
      addToHistory(cafe);
    }

    // Animation sequence
    Animated.sequence([
      // Seed shrinks (planted)
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Tree grows
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

  const handleReset = async () => {
    // Show ad before resetting (except first seed is free)
    if (shouldShowAd()) {
      setAdLoading(true);
      const adWatched = await showRewardedAd();
      setAdLoading(false);
      if (!adWatched) return; // Ad cancelled
    }

    setSelectedSeed(null);
    setIsGrowing(false);
    setShowResult(false);
    setResultCafe(null);
    setIsFirstSeed(false);
    scaleAnim.setValue(1);
    fadeAnim.setValue(0);
    treeScale.setValue(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>種一顆咖啡豆</Text>
        <Text style={styles.subtitle}>
          {location.loading
            ? '定位中...'
            : cafesLoading
            ? '搜尋附近咖啡廳...'
            : `附近找到 ${cafes.length} 家咖啡廳`}
        </Text>
      </View>

      <View style={styles.seedArea}>
        {(location.loading || cafesLoading) && !isGrowing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {location.loading ? '正在定位...' : '搜尋附近咖啡廳...'}
            </Text>
          </View>
        ) : !isGrowing ? (
          <View style={styles.seedRow}>
            {SEEDS.map((seed) => (
              <TouchableOpacity
                key={seed.id}
                style={[
                  styles.seedButton,
                  cafes.length === 0 && styles.seedButtonDisabled,
                ]}
                onPress={() => handleSeedPress(seed.id)}
                activeOpacity={0.7}
                disabled={cafes.length === 0}
              >
                <Text style={styles.seedEmoji}>{seed.emoji}</Text>
                <Text style={styles.seedLabel}>{seed.label}</Text>
              </TouchableOpacity>
            ))}
            {cafes.length === 0 && !cafesLoading && (
              <Text style={styles.noCafeText}>
                附近沒有找到咖啡廳{'\n'}試試換個地方？
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.growArea}>
            {/* Growing tree animation */}
            <Animated.View
              style={[
                styles.treeContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: treeScale }],
                },
              ]}
            >
              <Text style={styles.treeEmoji}>🌳</Text>
            </Animated.View>

            {/* Result card */}
            {showResult && resultCafe && (
              <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                <CafeCard
                  cafe={resultCafe}
                  showFavoriteButton={true}
                  onFavorite={() => {
                    Alert.alert(
                      '訂閱後可收藏 ☕',
                      '訂閱後即可收藏咖啡廳，收藏的店會在地圖上長成一棵樹 🌳',
                      [
                        { text: '之後再說', style: 'cancel' },
                        { text: '了解訂閱方案', onPress: () => {} },
                      ]
                    );
                  }}
                />
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleReset}
                  disabled={adLoading}
                >
                  {adLoading ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.retryText}>載入中...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
                      <Text style={styles.retryText}>再種一顆</Text>
                      {shouldShowAd() && (
                        <View style={styles.adBadge}>
                          <Ionicons name="play-circle-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.adBadgeText}>看廣告</Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {showResult && !resultCafe && (
              <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                <Text style={styles.noResultText}>
                  附近沒有找到咖啡廳 ☕{'\n'}試試換個地方？
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                  <Text style={styles.retryText}>再試一次</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  seedArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  seedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  seedButton: {
    width: 100,
    height: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  seedButtonDisabled: {
    opacity: 0.4,
  },
  seedEmoji: {
    fontSize: 40,
  },
  seedLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  noCafeText: {
    width: '100%',
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  growArea: {
    alignItems: 'center',
    width: '100%',
  },
  treeContainer: {
    marginBottom: Spacing.lg,
  },
  treeEmoji: {
    fontSize: 80,
  },
  resultContainer: {
    width: width - Spacing.lg * 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  adBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  adBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  noResultText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
