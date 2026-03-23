import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isSubscribed = false; // TODO: Check subscription status

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的收藏</Text>
      </View>

      {!isLoggedIn ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>登入後即可收藏</Text>
          <Text style={styles.emptyText}>
            登入帳號並訂閱後{'\n'}就能收藏喜愛的咖啡廳
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.loginText}>登入 / 註冊</Text>
          </TouchableOpacity>
        </View>
      ) : !isSubscribed ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>培養你的專屬咖啡森林</Text>
          <Text style={styles.emptyText}>
            每收藏一家咖啡廳{'\n'}地圖上就會長出一棵樹{'\n'}去越多店，森林越茂密 🌿
          </Text>
          <TouchableOpacity style={styles.subscribeButton}>
            <Ionicons name="star" size={18} color={Colors.surface} />
            <Text style={styles.subscribeText}>了解訂閱方案</Text>
          </TouchableOpacity>
          <View style={styles.benefitList}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
              <Text style={styles.benefitText}>無限收藏你愛的咖啡廳</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
              <Text style={styles.benefitText}>培養你的專屬咖啡森林 🌳</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
              <Text style={styles.benefitText}>享受無廣告體驗</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>還沒有收藏</Text>
          <Text style={styles.emptyText}>
            去探索頁種一顆咖啡豆{'\n'}收藏的咖啡廳會在地圖上長成一棵樹
          </Text>
        </View>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
  },
  loginText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  subscribeText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  benefitList: {
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
