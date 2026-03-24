import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import CafeCard from '../../src/components/CafeCard';
import { getSubscriptionStatus } from '../../src/lib/ads';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { favorites, removeFavorite } = useFavorites();
  const isLoggedIn = !!user;
  const isSubscribed = getSubscriptionStatus();

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

  // Logged in with favorites
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        {favorites.length > 0 && (
          <Text style={styles.countText}>🌳 {favorites.length}</Text>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('favorites.empty_title')}</Text>
          <Text style={styles.emptyText}>{t('favorites.empty_text')}</Text>
        </View>
      ) : (
        <>
          {!isSubscribed && (
            <View style={styles.subscribeBanner}>
              <Ionicons name="star" size={16} color={Colors.primary} />
              <Text style={styles.subscribeBannerText}>{t('favorites.subscribe_hint')}</Text>
            </View>
          )}

          <FlatList
            data={favorites}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <View style={[styles.cardContainer, !isSubscribed && styles.cardBlurred]}>
                <CafeCard
                  cafe={item}
                  showFavoriteButton={true}
                  isFavorited={true}
                  onFavorite={() => {
                    Alert.alert(
                      '🗑️',
                      t('favorites.remove_confirm'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('favorites.remove'),
                          style: 'destructive',
                          onPress: () => removeFavorite(item.place_id),
                        },
                      ]
                    );
                  }}
                />
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        </>
      )}
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
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  loginText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },
  subscribeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  subscribeBannerText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  list: { padding: Spacing.lg },
  cardContainer: { marginBottom: Spacing.lg },
  cardBlurred: { opacity: 0.7 },
});
