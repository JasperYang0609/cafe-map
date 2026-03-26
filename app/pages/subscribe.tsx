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
  isPurchasesAvailable, checkSubscription,
} from '../../src/lib/purchases';
import { setSubscriptionStatus } from '../../src/lib/ads';

type PlanType = 'monthly' | 'yearly' | 'lifetime';

const FEATURES = [
  { icon: 'ban-outline' as const, key: 'no_ads' },
  { icon: 'heart-outline' as const, key: 'favorites' },
  { icon: 'leaf-outline' as const, key: 'garden' },
  { icon: 'infinite-outline' as const, key: 'unlimited' },
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    if (!isPurchasesAvailable()) {
      setLoading(false);
      return;
    }
    const pkgs = await getOfferings();
    setPackages(pkgs);
    setLoading(false);
  };

  const getPackageByType = (type: PlanType) => {
    const identifierMap: Record<PlanType, string[]> = {
      monthly: ['$rc_monthly', 'monthly'],
      yearly: ['$rc_annual', 'yearly', 'annual'],
      lifetime: ['$rc_lifetime', 'lifetime'],
    };
    return packages.find(p =>
      identifierMap[type].some(id =>
        p.identifier?.toLowerCase().includes(id) ||
        p.packageType?.toLowerCase().includes(id)
      )
    );
  };

  const getPriceText = (type: PlanType): string => {
    const pkg = getPackageByType(type);
    if (pkg?.product?.priceString) return pkg.product.priceString;
    // Fallback placeholder prices
    switch (type) {
      case 'monthly': return 'NT$50';
      case 'yearly': return 'NT$390';
      case 'lifetime': return 'NT$990';
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert(t('profile.error'), '請先登入');
      return;
    }

    const pkg = getPackageByType(selectedPlan);
    if (!pkg) {
      // No real package yet (App Store Connect not configured)
      Alert.alert('提示', '訂閱商品尚未在 App Store 設定，請稍後再試');
      return;
    }

    setPurchasing(true);
    const result = await purchasePackage(pkg);
    setPurchasing(false);

    if (result.success) {
      setSubscriptionStatus(true);
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
      Alert.alert(t('subscribe.restore_success'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert(t('subscribe.restore_fail'));
    }
  };

  const plans: { type: PlanType; badge?: string }[] = [
    { type: 'yearly', badge: t('subscribe.best_value') },
    { type: 'monthly', badge: t('subscribe.popular') },
    { type: 'lifetime' },
  ];

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

        {/* Plans */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>{t('subscribe.loading')}</Text>
          </View>
        ) : (
          <View style={styles.plans}>
            {plans.map(({ type, badge }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.planCard,
                  selectedPlan === type && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(type)}
              >
                {badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
                <View style={styles.planRadio}>
                  <View style={[
                    styles.radioOuter,
                    selectedPlan === type && styles.radioOuterSelected,
                  ]}>
                    {selectedPlan === type && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.planInfo}>
                  <Text style={[
                    styles.planName,
                    selectedPlan === type && styles.planNameSelected,
                  ]}>
                    {t(`subscribe.${type}`)}
                  </Text>
                  <Text style={styles.planPrice}>
                    {getPriceText(type)}
                    <Text style={styles.planPeriod}>
                      {type === 'monthly' ? t('subscribe.per_month') :
                       type === 'yearly' ? t('subscribe.per_year') :
                       ` (${t('subscribe.one_time')})`}
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeBtn, purchasing && styles.subscribeBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
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

        {/* Terms */}
        <Text style={styles.terms}>{t('subscribe.terms')}</Text>
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
    backgroundColor: Colors.primaryLight || '#F0E6D3',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  loadingContainer: { alignItems: 'center', padding: Spacing.xl },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },

  plans: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  planCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.md,
    position: 'relative', overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || '#FFF8F0',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },

  planRadio: { marginRight: Spacing.md },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  planInfo: { flex: 1 },
  planName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  planNameSelected: { color: Colors.primary },
  planPrice: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: 2 },
  planPeriod: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.textSecondary },

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
    paddingVertical: Spacing.lg,
  },
});
