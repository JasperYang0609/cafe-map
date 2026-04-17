import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { AD_UNIT_IDS, initAds, getAdRequestOptions } from '../lib/ads';
import { useAuth } from '../context/AuthContext';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/**
 * Banner ad component - shows Google AdMob banner for free users.
 * Waits for AdMob init (which gates on iOS ATT) before mounting BannerAd
 * so the very first banner request carries the correct ATT-derived NPA flag.
 */
export default function BannerAdPlaceholder() {
  const { user } = useAuth();
  const isSubscribed = !!user?.isSubscribed;
  const [initReady, setInitReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Wait for AdMob init (incl. ATT on iOS) before mounting the banner.
  useEffect(() => {
    if (isSubscribed) return;
    setInitReady(false);
    setLoaded(false);
    setFailCount(0);
    let cancelled = false;
    initAds().then((ok) => {
      if (cancelled || !mountedRef.current) return;
      if (ok) {
        setInitReady(true);
        setAdKey((k) => k + 1);
      } else {
        console.log('[Banner] init failed; banner will not render');
      }
    });
    return () => { cancelled = true; };
  }, [isSubscribed]);

  // Retry after failure with delay
  useEffect(() => {
    if (failCount > 0 && failCount <= MAX_RETRIES) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          console.log(`[Banner] retry attempt ${failCount}/${MAX_RETRIES}`);
          setAdKey((k) => k + 1);
        }
      }, RETRY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [failCount]);

  if (isSubscribed || !initReady) return null;

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
          requestOptions={getAdRequestOptions()}
          onAdLoaded={() => {
            if (mountedRef.current) {
              setLoaded(true);
              setFailCount(0);
            }
          }}
          onAdFailedToLoad={(err: any) => {
            console.log('[Banner] failed to load code=', err?.code, 'message=', err?.message);
            if (mountedRef.current) {
              setLoaded(false);
              setFailCount((c) => c + 1);
            }
          }}
        />
      );
    }
  } catch (e) {
    console.log('[Banner] module unavailable:', e);
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
