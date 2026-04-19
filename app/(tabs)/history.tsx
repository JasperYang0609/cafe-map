import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import CafeCard from '../../src/components/CafeCard';
import GardenRollModal from '../../src/components/GardenRollModal';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useHistory } from '../../src/context/HistoryContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useAuth } from '../../src/context/AuthContext';
import { showRewardedAd } from '../../src/lib/ads';
import BannerAdPlaceholder from '../../src/components/BannerAdPlaceholder';

export default function HistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { history, clearHistory } = useHistory();
  const { addFavorite, removeFavorite, isFavorited, getRating, lastRolled, clearLastRolled } = useFavorites();
  const { user } = useAuth();
  const [beanFilter, setBeanFilter] = useState<number | null>(null);
  const [showRollModal, setShowRollModal] = useState(false);
  const [rollDisplay, setRollDisplay] = useState({ emoji: '', rarity: '' });

  const beanImg = require('../../src/assets/images/coffee-bean-nobg.png');
  const beanGrayImg = require('../../src/assets/images/coffee-bean-gray.png');

  const filteredHistory = beanFilter === null
    ? history
    : history.filter(h => (getRating(h.cafe.place_id) || 0) === beanFilter);

  useEffect(() => {
    if (lastRolled && isFocused) {
      setRollDisplay(lastRolled);
      setShowRollModal(true);
      clearLastRolled();
    }
  }, [lastRolled, isFocused]);

  const handleFavorite = async (cafe: any) => {
    if (isFavorited(cafe.place_id)) {
      await removeFavorite(cafe.place_id);
      return;
    }

    if (!user) {
      Alert.alert(
        t('favorites.login_required_title'),
        t('favorites.login_required_msg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.login'), onPress: () => router.push('/(tabs)/profile') },
        ]
      );
      return;
    }

    if (user?.isSubscribed) {
      await addFavorite(cafe);
      return;
    }

    Alert.alert(
      t('favorites.add_title'),
      t('favorites.add_free_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('subscription.upgrade'), onPress: () => router.push('/pages/subscribe') },
        {
          text: t('favorites.watch_ad_to_fav'),
          onPress: async () => {
            const watched = await showRewardedAd();
            if (watched) {
              await addFavorite(cafe);
            } else {
              Alert.alert(t('ad.not_ready_title'), t('ad.not_ready_msg'));
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
            <TouchableOpacity
              style={[styles.allButton, beanFilter === null && styles.allButtonActive]}
              onPress={() => setBeanFilter(null)}
            >
              <Text style={[styles.allButtonText, beanFilter === null && styles.allButtonTextActive]}>ALL</Text>
            </TouchableOpacity>
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
                  showPhoto={false}
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
      <GardenRollModal
        visible={showRollModal}
        emoji={rollDisplay.emoji}
        rarity={rollDisplay.rarity}
        onClose={() => setShowRollModal(false)}
      />
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
  emptyFilter: {
    alignItems: 'center', paddingVertical: Spacing.xl,
  },
  emptyFilterText: {
    fontSize: FontSize.md, color: Colors.textSecondary,
  },
  list: { padding: Spacing.lg, paddingBottom: Spacing.md },
  cardContainer: { marginBottom: Spacing.lg },
  dateText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
});
