import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';
import { getSubscriptionStatus } from '../lib/ads';

/**
 * Banner ad placeholder - shows a mock ad banner for free users
 * TODO: Replace with actual Google AdMob BannerAd component
 * 
 * Usage: Place at bottom of screen, above tab bar
 * AdMob banner size: 320x50 (standard) or adaptive
 */
export default function BannerAdPlaceholder() {
  if (getSubscriptionStatus()) return null; // Subscribers don't see ads

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
