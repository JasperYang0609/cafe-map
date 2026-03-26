import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, FontSize } from '../constants/theme';
import { getSubscriptionStatus, AD_UNIT_IDS } from '../lib/ads';

/**
 * Banner ad component - shows Google AdMob banner for free users
 * Falls back to placeholder in Expo Go (no native module)
 */
export default function BannerAdPlaceholder() {
  const [useRealAd, setUseRealAd] = useState(false);
  const [BannerAd, setBannerAd] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);

  useEffect(() => {
    try {
      const ads = require('react-native-google-mobile-ads');
      setBannerAd(() => ads.BannerAd);
      setBannerAdSize(ads.BannerAdSize);
      setUseRealAd(true);
    } catch (e) {
      // Expo Go - no native module available
      setUseRealAd(false);
    }
  }, []);

  if (getSubscriptionStatus()) return null;

  // Real AdMob banner
  if (useRealAd && BannerAd && BannerAdSize) {
    return (
      <View style={styles.container}>
        <BannerAd
          unitId={AD_UNIT_IDS.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error: any) => {
            console.log('[Ads] Banner failed to load:', error);
          }}
        />
      </View>
    );
  }

  // Fallback placeholder (Expo Go)
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Ad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFF8F0',
  },
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
