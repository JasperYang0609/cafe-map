import BannerAdPlaceholder from '../../src/components/BannerAdPlaceholder';
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import CafeCard from '../../src/components/CafeCard';
import { useRouter } from 'expo-router';
import { useHistory } from '../../src/context/HistoryContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useAuth } from '../../src/context/AuthContext';
import { showRewardedAd } from '../../src/lib/ads';

export default function HistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { history, clearHistory } = useHistory();
  const { addFavorite, isFavorited, getRating } = useFavorites();
  const { user } = useAuth();
  const [beanFilter, setBeanFilter] = useState<number | null>(null);

  const beanImg = require('../../src/assets/images/coffee-bean-nobg.png');
  const beanGrayImg = require('../../src/assets/images/coffee-bean-gray.png');

  const filteredHistory = beanFilter === null
    ? history
    : history.filter(h => (getRating(h.cafe.place_id) || 0) === beanFilter);

  const handleFavorite = (cafe: any) => {
    if (user?.isSubscribed) {
      addFavorite(cafe);
      return;
    }

    Alert.alert(
      '收藏這間咖啡廳',
      '免費用戶可觀看一則廣告後收藏，也可以直接升級 BeanGo Pro 享受無廣告收藏體驗。',
      [
        { text: t('common.cancel') || '取消', style: 'cancel' },
        { text: t('subscription.upgrade') || '了解訂閱', onPress: () => router.push('/pages/subscribe') },
        {
          text: '看廣告後收藏',
          onPress: async () => {
            const watched = await showRewardedAd();
            if (watched) {
              await addFavorite(cafe);
            }
          },
        },
      ]
    );
  };

  const handleClear = () => {
    Alert.alert(t('history.clear_confirm_title'), t('history.clear_confirm_msg'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('history.clear'), style: 'destructive', onPress: clearHistory },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('history.just_now');
    if (diffMins < 60) return t('history.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('history.hours_ago', { count: diffHours });
    if (diffDays < 7) return t('history.days_ago', { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <View style={{flex:1, backgroundColor: Colors.background}}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history.title')}</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>{t('history.clear_all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>{t('history.empty_title')}</Text>
          <Text style={styles.emptyText}>{t('history.empty_text')}</Text>
        </View>
      ) : (
        <>
          {/* Bean rating filter */}
          <View style={styles.filterRow}>
            <View style={styles.filterBeans}>
              {[1, 2, 3, 4].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setBeanFilter(beanFilter === level ? null : level)}
                >
                  <Image
                    source={(beanFilter !== null && beanFilter >= level) ? beanImg : beanGrayImg}
                    style={styles.filterBeanIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterCount}>
              × {beanFilter === null ? history.length : filteredHistory.length}
            </Text>
          </View>

          <FlatList
            data={filteredHistory}
            keyExtractor={(item, index) => `${item.cafe.place_id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <Text style={styles.dateText}>{formatDate(item.viewed_at)}</Text>
                <CafeCard
                  cafe={item.cafe}
                  showFavoriteButton={true}
                  isFavorited={isFavorited(item.cafe.place_id)}
                  onFavorite={() => handleFavorite(item.cafe)}
                />
              </View>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterText}>
                  {t('history.no_rated') || '沒有符合此評分的紀錄'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
    <BannerAdPlaceholder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  clearText: { fontSize: FontSize.sm, color: Colors.error },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  filterRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
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
  emptyFilter: {
    alignItems: 'center', paddingVertical: Spacing.xl,
  },
  emptyFilterText: {
    fontSize: FontSize.md, color: Colors.textSecondary,
  },
  list: { padding: Spacing.lg },
  cardContainer: { marginBottom: Spacing.lg },
  dateText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
});
