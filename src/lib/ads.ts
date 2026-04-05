/**
 * Ad manager - Google AdMob integration
 * 
 * Free users: 3 free picks per day, then watch interstitial ad for each additional pick
 * Subscribers: unlimited picks, no ads
 * 
 * Test Ad IDs (Google official):
 * - Interstitial iOS: ca-app-pub-3940256099942544/4411468910
 * - Interstitial Android: ca-app-pub-3940256099942544/1033173712
 * - Banner iOS: ca-app-pub-3940256099942544/2934735716
 * - Banner Android: ca-app-pub-3940256099942544/6300978111
 * 
 * TODO: Replace with real Ad Unit IDs from Jasper's AdMob account
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// --- Config ---
const DAILY_FREE_PICKS = 3;
const IS_DEV = __DEV__ || Constants.executionEnvironment === 'storeClient';

const TEST_AD_UNIT_IDS = {
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }),
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }),
};

const PROD_AD_UNIT_IDS = {
  interstitial: Platform.select({
    ios: 'ca-app-pub-7299866937396477/6951854171',
    android: 'ca-app-pub-7299866937396477/3433195775',
    default: 'ca-app-pub-7299866937396477/3433195775',
  }),
  banner: Platform.select({
    ios: 'ca-app-pub-7299866937396477/1891099182',
    android: 'ca-app-pub-7299866937396477/5356651534',
    default: 'ca-app-pub-7299866937396477/5356651534',
  }),
};

export const AD_UNIT_IDS = IS_DEV ? TEST_AD_UNIT_IDS : PROD_AD_UNIT_IDS;

// --- State ---
let isSubscribed = false;
let dailyPickCount = 0;
let lastResetDate = new Date().toDateString();
let interstitialLoaded = false;
let interstitialAd: any = null;

/**
 * Reset daily count if it's a new day
 */
function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyPickCount = 0;
    lastResetDate = today;
  }
}

/**
 * Initialize AdMob SDK (call once on app start)
 */
export async function initAds() {
  try {
    const ads = require('react-native-google-mobile-ads');
    const mobileAds = ads.default;
    await mobileAds().initialize();
    console.log(`[Ads] AdMob initialized (${IS_DEV ? 'TEST ADS' : 'PROD ADS'})`);
    preloadInterstitial();
  } catch (e) {
    console.log('[Ads] AdMob not available (Expo Go?), using fallback');
  }
}

/**
 * Preload an interstitial ad
 */
function preloadInterstitial() {
  try {
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = AD_UNIT_IDS.interstitial;
    
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
      console.log('[Ads] Interstitial loaded');
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      interstitialLoaded = false;
      console.log('[Ads] Interstitial load error:', error);
      // Retry after 30s
      setTimeout(preloadInterstitial, 30000);
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      // Preload next one
      preloadInterstitial();
    });

    interstitialAd.load();
  } catch (e) {
    console.log('[Ads] Cannot preload interstitial (Expo Go?)');
  }
}

/**
 * Get remaining free picks today
 */
export function getFreePicks(): number {
  checkDailyReset();
  return Math.max(0, DAILY_FREE_PICKS - dailyPickCount);
}

/**
 * Check if current pick needs an ad
 */
export function needsAd(): boolean {
  if (isSubscribed) return false;
  checkDailyReset();
  return dailyPickCount >= DAILY_FREE_PICKS;
}

/**
 * Record a pick (call after successful seed plant)
 */
export function recordPick() {
  checkDailyReset();
  dailyPickCount++;
}

/**
 * Show an interstitial ad
 * Returns true if ad was shown (or skipped for subscribers / Expo Go)
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;

  // Try to show real interstitial
  if (interstitialLoaded && interstitialAd) {
    return new Promise((resolve) => {
      try {
        const { AdEventType } = require('react-native-google-mobile-ads');
        
        const closeListener = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
          closeListener();
          resolve(true);
        });

        interstitialAd.show();
      } catch (e) {
        console.log('[Ads] Failed to show interstitial:', e);
        resolve(true); // Don't block user
      }
    });
  }

  // Fallback: 2 second wait (for Expo Go or if ad not loaded)
  console.log('[Ads] No interstitial ready, using fallback delay');
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 2000);
  });
}

/**
 * Set subscription status
 */
export function setSubscriptionStatus(subscribed: boolean) {
  isSubscribed = subscribed;
}

/**
 * Check if user is subscribed
 */
export function getSubscriptionStatus(): boolean {
  return isSubscribed;
}
