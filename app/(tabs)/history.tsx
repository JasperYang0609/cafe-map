import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import CafeCard from '../../src/components/CafeCard';
import { useHistory } from '../../src/context/HistoryContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';

export default function HistoryScreen() {
  const { t } = useI18n();
  const { history, clearHistory } = useHistory();
  const { addFavorite, isFavorited } = useFavorites();

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
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item.cafe.place_id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <Text style={styles.dateText}>{formatDate(item.viewed_at)}</Text>
              <CafeCard
                cafe={item.cafe}
                showFavoriteButton={true}
                isFavorited={isFavorited(item.cafe.place_id)}
                onFavorite={() => addFavorite(item.cafe)}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
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
  list: { padding: Spacing.lg },
  cardContainer: { marginBottom: Spacing.lg },
  dateText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
});
