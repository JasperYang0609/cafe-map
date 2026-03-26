import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';
import { getSubscriptionStatus } from '../lib/ads';

/**
 * Banner ad component - shows Google AdMob banner for free users
 * In Expo Go (no native module), shows placeholder text
 * Real AdMob banner only works in EAS Dev Client / Production build
 */
export default function BannerAdPlaceholder() {
  if (getSubscriptionStatus()) return null;

  // Always show placeholder - real AdMob banner only in production build
  // AdMob BannerAd component crashes Expo Go even inside try/catch
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Ad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 50,
    backgroundColor: '#F0EBE3',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
