/**
 * Ad manager - Google AdMob integration (V17 rewrite)
 *
 * Free users: 3 free picks per day, then watch a rewarded ad for each additional pick.
 * Subscribers: unlimited picks, no ads.
 *
 * KEY DESIGN: preload phase adds ONLY a LOADED listener (+ ERROR for retry).
 * NO CLOSED listener during preload — this prevents the preload CLOSED handler
 * from interfering with the show-time reward capture.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DAILY_FREE_PICKS = 3;
const IS_DEV = __DEV__ || Constants.executionEnvironment === 'storeClient';

const TEST_AD_UNIT_IDS = {
  rewarded: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }),
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }),
};

const PROD_AD_UNIT_IDS = {
  rewarded: Platform.select({
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

let isSubscribed = false;
let dailyPickCount = 0;
let lastResetDate = new Date().toDateString();
let initStarted = false;
let adsInitialized = false;

// Preload state
let preloadedAd: any = null;
let preloadReady = false;
let preloadListeners: Array<() => void> = [];
let isPreloading = false;

// Show state
let isShowing = false;

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyPickCount = 0;
    lastResetDate = today;
  }
}

function clearPreload() {
  preloadListeners.forEach((unsub) => unsub());
  preloadListeners = [];
  preloadedAd = null;
  preloadReady = false;
  isPreloading = false;
}

export async function initAds() {
  if (initStarted || adsInitialized || isSubscribed) return;
  initStarted = true;

  try {
    const ads = require('react-native-google-mobile-ads');
    const mobileAds = ads.default;
    await mobileAds().initialize();
    adsInitialized = true;
    console.log(`[Ads] AdMob initialized (${IS_DEV ? 'TEST ADS' : 'PROD ADS'})`);
    setTimeout(() => preloadRewarded(), 2000);
  } catch (e) {
    console.log('[Ads] AdMob not available (Expo Go?), using fallback');
  }
}

/**
 * Preload a rewarded ad. ONLY adds LOADED + ERROR listeners.
 * NO CLOSED listener — that's only added during show().
 */
function preloadRewarded() {
  if (isSubscribed || isShowing || preloadReady || isPreloading) return;

  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');

    clearPreload();
    isPreloading = true;

    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded!, {
      requestNonPersonalizedAdsOnly: true,
    });

    preloadListeners.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        preloadReady = true;
        isPreloading = false;
        preloadedAd = ad;
        console.log('[Ads] Rewarded ad preloaded');
      })
    );

    preloadListeners.push(
      ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
        preloadReady = false;
        isPreloading = false;
        preloadedAd = null;
        console.log('[Ads] Preload error:', error?.message || error);
        setTimeout(preloadRewarded, 30000);
      })
    );

    ad.load();
    console.log('[Ads] Preloading rewarded ad...');
  } catch (e) {
    isPreloading = false;
    console.log('[Ads] Cannot preload:', e);
  }
}

export function getFreePicks(): number {
  checkDailyReset();
  return Math.max(0, DAILY_FREE_PICKS - dailyPickCount);
}

export function needsAd(): boolean {
  if (isSubscribed) return false;
  checkDailyReset();
  return dailyPickCount >= DAILY_FREE_PICKS;
}

export function recordPick() {
  checkDailyReset();
  dailyPickCount++;
}

/**
 * Show a preloaded rewarded ad.
 * Returns true if the user earned the reward.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;
  if (isShowing) return false;

  if (!adsInitialized) {
    await initAds();
  }

  if (!preloadReady || !preloadedAd) {
    if (!isPreloading) preloadRewarded();
    console.log('[Ads] Ad not ready');
    return false;
  }

  // Take ownership of the preloaded ad
  const ad = preloadedAd;
  preloadListeners.forEach((unsub) => unsub());
  preloadListeners = [];
  preloadedAd = null;
  preloadReady = false;
  isPreloading = false;
  isShowing = true;

  return new Promise<boolean>((resolve) => {
    try {
      const { RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');
      let earned = false;
      let done = false;
      const unsubs: Array<() => void> = [];

      const finish = (result: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        unsubs.forEach((u) => u());
        unsubs.length = 0;
        isShowing = false;
        resolve(result);
        setTimeout(preloadRewarded, 500);
      };

      // Safety timeout
      const timer = setTimeout(() => finish(false), 60000);

      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
          earned = true;
          console.log('[Ads] EARNED_REWARD:', reward?.type, reward?.amount);
        })
      );

      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[Ads] CLOSED, earned:', earned);
          finish(earned);
        })
      );

      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
          console.log('[Ads] ERROR during show:', err?.message || err);
          finish(false);
        })
      );

      ad.show();
      console.log('[Ads] Showing ad...');
    } catch (e) {
      console.log('[Ads] Show failed:', e);
      isShowing = false;
      resolve(false);
      setTimeout(preloadRewarded, 2000);
    }
  });
}

export function setSubscriptionStatus(subscribed: boolean) {
  isSubscribed = subscribed;
  if (subscribed) {
    clearPreload();
  } else if (adsInitialized && !isShowing) {
    setTimeout(preloadRewarded, 500);
  }
}

export function resetAdsState() {
  isSubscribed = false;
  clearPreload();
  isShowing = false;
}

export function getSubscriptionStatus(): boolean {
  return isSubscribed;
}
