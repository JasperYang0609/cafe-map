import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// Placeholder seed data
const SEEDS = [
  { id: 1, emoji: '🫘', label: '深焙' },
  { id: 2, emoji: '🌿', label: '淺焙' },
  { id: 3, emoji: '🍫', label: '特調' },
];

export default function ExploreScreen() {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [isGrowing, setIsGrowing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const treeScale = useRef(new Animated.Value(0)).current;

  const handleSeedPress = (seedId: number) => {
    if (isGrowing) return;

    setSelectedSeed(seedId);
    setIsGrowing(true);
    setShowResult(false);

    // Seed press animation
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

  const handleReset = () => {
    setSelectedSeed(null);
    setIsGrowing(false);
    setShowResult(false);
    scaleAnim.setValue(1);
    fadeAnim.setValue(0);
    treeScale.setValue(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>種一顆咖啡豆</Text>
        <Text style={styles.subtitle}>選一顆種子，看看今天命運推薦哪家咖啡廳</Text>
      </View>

      <View style={styles.seedArea}>
        {!isGrowing ? (
          <View style={styles.seedRow}>
            {SEEDS.map((seed) => (
              <TouchableOpacity
                key={seed.id}
                style={styles.seedButton}
                onPress={() => handleSeedPress(seed.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.seedEmoji}>{seed.emoji}</Text>
                <Text style={styles.seedLabel}>{seed.label}</Text>
              </TouchableOpacity>
            ))}
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
            {showResult && (
              <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
                <Text style={styles.resultTitle}>☕ 推薦咖啡廳</Text>
                <Text style={styles.resultPlaceholder}>
                  連接 Google Places API 後{'\n'}這裡會顯示真實的咖啡廳資訊
                </Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="navigate-outline" size={20} color={Colors.surface} />
                    <Text style={styles.actionText}>導航</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={20} color={Colors.surface} />
                    <Text style={styles.actionText}>收藏</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                  <Text style={styles.retryText}>再種一顆</Text>
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
  seedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
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
  seedEmoji: {
    fontSize: 40,
  },
  seedLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  growArea: {
    alignItems: 'center',
  },
  treeContainer: {
    marginBottom: Spacing.xl,
  },
  treeEmoji: {
    fontSize: 80,
  },
  resultCard: {
    width: width - Spacing.lg * 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  resultTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  resultPlaceholder: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  actionText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  retryText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
