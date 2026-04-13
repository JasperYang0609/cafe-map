import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';
import { AD_UNIT_IDS } from '../lib/ads';
import { useAuth } from '../context/AuthContext';

/**
 * Banner ad component - shows Google AdMob banner for free users.
 * Falls back to nothing while loading so screens don't reserve blank space.
 */
export default function BannerAdPlaceholder() {
  const { user } = useAuth();
  const isSubscribed = !!user?.isSubscribed;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset loaded/failed state when subscription status changes
  React.useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [isSubscribed]);

  const banner = useMemo(() => {
    if (isSubscribed) return null;

    try {
      const ads = require('react-native-google-mobile-ads');
      const BannerAd = ads.BannerAd;
      const BannerAdSize = ads.BannerAdSize;

      if (BannerAd && BannerAdSize) {
        return (
          <View style={styles.bannerWrap}>
            <BannerAd
              unitId={AD_UNIT_IDS.banner!}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              onAdLoaded={() => {
                setLoaded(true);
                setFailed(false);
              }}
              onAdFailedToLoad={() => {
                setLoaded(false);
                setFailed(true);
              }}
            />
          </View>
        );
      }
    } catch (e) {
      return null;
    }

    return null;
  }, [isSubscribed]);

  if (isSubscribed) return null;
  if (!banner) return null;

  return (
    <View style={[styles.container, !loaded && styles.hidden]} pointerEvents={loaded ? 'auto' : 'none'}>
      {banner}
      {!loaded && failed ? (
        <View style={styles.fallbackHint}>
          <Text style={styles.text}>Ad</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0EBE3',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hidden: {
    height: 0,
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  bannerWrap: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackHint: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
