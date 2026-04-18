import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useI18n } from '../../src/context/I18nContext';
import { useAuth } from '../../src/context/AuthContext';
import {
  getOfferings, purchasePackage, restorePurchases,
  initPurchases, loginPurchases,
  isPurchasesAvailable, isPurchasesInitialized,
} from '../../src/lib/purchases';
import { setSubscriptionStatus } from '../../src/lib/ads';

const FEATURES = [
  { icon: 'ban-outline' as const, key: 'no_ads' },
  { icon: 'heart-outline' as const, key: 'favorites' },
  { icon: 'leaf-outline' as const, key: 'garden' },
  { icon: 'infinite-outline' as const, key: 'unlimited' },
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, refreshSubscription, loading: authLoading } = useAuth();
  const [monthlyPkg, setMonthlyPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      bootstrapSubscriptionScreen();
    }
  }, [authLoading, user?.id]);

  const bootstrapSubscriptionScreen = async () => {
    setSyncingSubscription(true);
    if (user) {
      await refreshSubscription();
    }
    await loadOfferings();
    setSyncingSubscription(false);
  };

  const loadOfferings = async () => {
    setLoading(true);

    if (!isPurchasesAvailable()) {
      setMonthlyPkg(null);
      setLoading(false);
      return;
    }

    if (!isPurchasesInitialized()) {
      await initPurchases(user?.id);
    }

    if (user?.id) {
      await loginPurchases(user.id);
    }

    const pkgs = await getOfferings();
    const monthly = pkgs.find(p =>
      p.identifier?.toLowerCase().includes('monthly') ||
      p.packageType?.toLowerCase().includes('monthly') ||
      p.identifier === '$rc_monthly'
    );

    setMonthlyPkg(monthly || null);
    setLoading(false);
  };

  const getFallbackLocalizedPrice = (): string => {
    if (locale.startsWith('en')) return '$0.99';
    if (locale.startsWith('ja')) return '¥150';
    if (locale.startsWith('ko')) return '₩1,500';
    if (locale.startsWith('th')) return '฿35';
    if (locale.startsWith('zh-CN')) return '¥7';
    return 'NT$30';
  };

  const getPriceText = (): string => {
    if (monthlyPkg?.product?.priceString) return monthlyPkg.product.priceString;
    if (monthlyPkg?.product?.localizedPriceString) return monthlyPkg.product.localizedPriceString;
    return getFallbackLocalizedPrice();
  };

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert(t('profile.error'), t('subscribe.login_first'));
      return;
    }

    if (!monthlyPkg) {
      Alert.alert('提示', t('subscribe.not_ready'));
      return;
    }

    setPurchasing(true);
    const result = await purchasePackage(monthlyPkg);
    setPurchasing(false);

    if (result.success) {
      setSubscriptionStatus(true);
      await refreshSubscription();
      Alert.alert(t('subscribe.purchase_success'), t('subscribe.purchase_success_msg'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else if (result.error !== 'CANCELLED') {
      Alert.alert(t('subscribe.purchase_fail'), result.error);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const restored = await restorePurchases();
    setPurchasing(false);

    if (restored) {
      setSubscriptionStatus(true);
      await refreshSubscription();
      Alert.alert(t('subscribe.restore_success'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert(t('subscribe.restore_fail'));
    }
  };

  if (authLoading || syncingSubscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingStateText}>正在同步訂閱狀態⋯</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Already subscribed
  if (user?.isSubscribed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.subscribedContainer}>
          <Text style={styles.subscribedIcon}>☕</Text>
          <Text style={styles.subscribedTitle}>{t('subscribe.already_pro')}</Text>
          <Text style={styles.subscribedText}>{t('subscribe.already_pro_msg')}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.proIcon}>☕</Text>
          <Text style={styles.title}>{t('subscribe.title')}</Text>
          <Text style={styles.subtitle}>{t('subscribe.subtitle')}</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {t(`subscribe.feature_${f.key}`)}
                </Text>
                <Text style={styles.featureDesc}>
                  {t(`subscribe.feature_${f.key}_desc`)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>{t('subscribe.monthly')}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>
              {loading ? '...' : getPriceText()}
            </Text>
            <Text style={styles.pricePeriod}>{t('subscribe.per_month')}</Text>
          </View>
        </View>

        {!loading && !monthlyPkg && (
          <TouchableOpacity style={styles.restoreBtn} onPress={loadOfferings}>
            <Text style={styles.restoreBtnText}>{t('common.retry') || '重新載入'}</Text>
          </TouchableOpacity>
        )}

        {/* Auto-renewal disclosure — shown adjacent to the buy button
            so Apple reviewers can see price + term + renewal at a glance */}
        <Text style={styles.autoRenewNotice}>
          {t('subscribe.auto_renew_notice').replace('{price}', loading ? '...' : getPriceText())}
        </Text>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeBtn, (purchasing || loading || !monthlyPkg) && styles.subscribeBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || loading || !monthlyPkg}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeBtnText}>{t('subscribe.subscribe_btn')}</Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreBtnText}>{t('subscribe.restore')}</Text>
        </TouchableOpacity>

        {/* Terms & Privacy Links */}
        <Text style={styles.terms}>{t('subscribe.terms')}</Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/pages/privacy')}>
            <Text style={styles.legalLink}>{t('profile.privacy')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => router.push('/pages/terms')}>
            <Text style={styles.legalLink}>{t('profile.terms')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.md },
  closeBtn: { padding: Spacing.xs },

  titleSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  proIcon: { fontSize: 48, marginBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },

  features: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  featureIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, justifyContent: 'center',
    alignItems: 'center', marginRight: Spacing.md,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  priceCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.primary,
    padding: Spacing.xl, alignItems: 'center',
  },
  priceLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary, marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: 36, fontWeight: '800', color: Colors.text },
  pricePeriod: { fontSize: FontSize.md, color: Colors.textSecondary, marginLeft: 4 },

  autoRenewNotice: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    textAlign: 'center', paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  subscribeBtn: {
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.full,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  restoreBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  terms: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    textAlign: 'center', paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  legalLinks: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingBottom: Spacing.lg, gap: 8,
  },
  legalLink: {
    fontSize: FontSize.xs, color: Colors.primary, textDecorationLine: 'underline',
  },
  legalSep: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingStateText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Already subscribed state
  subscribedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  subscribedIcon: { fontSize: 64, marginBottom: Spacing.lg },
  subscribedTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  subscribedText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  backBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2, borderRadius: BorderRadius.full,
  },
  backBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
