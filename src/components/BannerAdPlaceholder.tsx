import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';
import { AD_UNIT_IDS, initAds } from '../lib/ads';
import { useAuth } from '../context/AuthContext';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/**
 * Banner ad component - shows Google AdMob banner for free users.
 * Handles initialization, loading, and retry on failure.
 */
export default function BannerAdPlaceholder() {
  const { user } = useAuth();
  const isSubscribed = !!user?.isSubscribed;
  const [loaded, setLoaded] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Initialize AdMob when banner needs to show
  useEffect(() => {
    if (!isSubscribed) {
      initAds();
    }
    // Reset state when subscription status changes
    setLoaded(false);
    setFailCount(0);
    setAdKey(k => k + 1);
  }, [isSubscribed]);

  // Retry after failure with delay
  useEffect(() => {
    if (failCount > 0 && failCount <= MAX_RETRIES) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setAdKey(k => k + 1);
        }
      }, RETRY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [failCount]);

  if (isSubscribed) return null;

  let bannerContent = null;
  try {
    const ads = require('react-native-google-mobile-ads');
    const BannerAd = ads.BannerAd;
    const BannerAdSize = ads.BannerAdSize;

    if (BannerAd && BannerAdSize) {
      bannerContent = (
        <BannerAd
          key={adKey}
          unitId={AD_UNIT_IDS.banner!}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            if (mountedRef.current) {
              setLoaded(true);
              setFailCount(0);
            }
          }}
          onAdFailedToLoad={() => {
            if (mountedRef.current) {
              setLoaded(false);
              setFailCount(c => c + 1);
            }
          }}
        />
      );
    }
  } catch (e) {
    return null;
  }

  if (!bannerContent) return null;

  return (
    <View style={[styles.container, !loaded && styles.hidden]} pointerEvents={loaded ? 'auto' : 'none'}>
      <View style={styles.bannerWrap}>
        {bannerContent}
      </View>
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
});
