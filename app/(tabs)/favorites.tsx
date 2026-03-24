import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const isLoggedIn = !!user;
  const isSubscribed = false; // TODO: Check subscription

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
      </View>

      {!isLoggedIn ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('favorites.login_title')}</Text>
          <Text style={styles.emptyText}>{t('favorites.login_text')}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.loginText}>{t('favorites.login_button')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('favorites.empty_title')}</Text>
          <Text style={styles.emptyText}>{t('favorites.empty_text')}</Text>

          {!isSubscribed && (
            <View style={styles.subscribeCard}>
              <Ionicons name="star" size={20} color={Colors.primary} />
              <Text style={styles.subscribeCardText}>{t('favorites.subscribe_hint')}</Text>
              <TouchableOpacity style={styles.subscribeBtn}>
                <Text style={styles.subscribeBtnText}>{t('favorites.subscribe_button')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl + 20, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  loginText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },
  subscribeCard: {
    alignItems: 'center', padding: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, width: '100%',
  },
  subscribeCardText: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
    marginTop: Spacing.sm, marginBottom: Spacing.md, lineHeight: 20,
  },
  subscribeBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  subscribeBtnText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: '600' },
});
