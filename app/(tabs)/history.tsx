import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import CafeCard from '../../src/components/CafeCard';
import { Cafe } from '../../src/types/cafe';

// TODO: Replace with real data from Supabase
const MOCK_HISTORY: (Cafe & { viewed_at: string })[] = [];

export default function HistoryScreen() {
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Fetch from Supabase
    setRefreshing(false);
  }, []);

  const handleClear = () => {
    Alert.alert(
      '清除紀錄',
      '確定要清除所有搜尋紀錄嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear from Supabase
            setHistory([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>搜尋紀錄</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>清除全部</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>還沒有紀錄</Text>
          <Text style={styles.emptyText}>
            每次探索的咖啡廳都會記錄在這裡{'\n'}方便你回顧和收藏
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => `${item.id}-${item.viewed_at}`}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <Text style={styles.dateText}>
                {new Date(item.viewed_at).toLocaleDateString('zh-TW')}
              </Text>
              <CafeCard
                cafe={item}
                showFavoriteButton={true}
                onFavorite={() => {
                  // TODO: Handle favorite (check subscription)
                }}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.error,
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
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardContainer: {
    marginBottom: Spacing.md,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
