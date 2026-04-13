/**
 * Ad manager - Google AdMob integration (V19 — on-demand architecture)
 *
 * ARCHITECTURE CHANGE: No more preloading.
 * Each showRewardedAd() creates a fresh ad → loads → shows → captures reward.
 * This eliminates ALL preload/show lifecycle conflicts that caused reward loss
 * in V14/V16/V18.
 *
 * Tradeoff: user waits 2-5s while ad loads. Acceptable vs broken rewards.
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
let isShowing = false;

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyPickCount = 0;
    lastResetDate = today;
  }
}

export async function initAds() {
  if (initStarted || adsInitialized || isSubscribed) return;
  initStarted = true;

  try {
    const ads = require('react-native-google-mobile-ads');
    const mobileAds = ads.default;
    await mobileAds().initialize();
    adsInitialized = true;
    console.log(`[Ads] AdMob initialized (${IS_DEV ? 'TEST' : 'PROD'})`);
  } catch (e) {
    console.log('[Ads] AdMob not available:', e);
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
 * Create → Load → Show → Capture reward, all in one call.
 * No preloading, no stale state, no listener conflicts.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;
  if (isShowing) return false;

  if (!adsInitialized) {
    await initAds();
  }
  if (!adsInitialized) return false;

  isShowing = true;

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    let earned = false;
    const unsubs: Array<() => void> = [];

    const finish = (result: boolean) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      unsubs.forEach((u) => { try { u(); } catch {} });
      unsubs.length = 0;
      isShowing = false;
      resolve(result);
    };

    // 30s timeout for the entire load+show cycle
    const timer = setTimeout(() => {
      console.log('[Ads] Timeout — ad took too long');
      finish(false);
    }, 30000);

    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');

      const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded!, {
        requestNonPersonalizedAdsOnly: true,
      });

      // LOADED → immediately show the ad
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          console.log('[Ads] Ad loaded, showing...');
          try {
            ad.show();
          } catch (e) {
            console.log('[Ads] Show failed:', e);
            finish(false);
          }
        })
      );

      // EARNED_REWARD → mark reward
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
          earned = true;
          console.log('[Ads] ✅ EARNED_REWARD:', reward?.type, reward?.amount);
        })
      );

      // CLOSED → resolve with reward status
      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[Ads] CLOSED, earned:', earned);
          finish(earned);
        })
      );

      // ERROR → resolve false
      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
          console.log('[Ads] ERROR:', err?.message || err);
          finish(false);
        })
      );

      // Start loading
      console.log('[Ads] Creating and loading ad...');
      ad.load();

    } catch (e) {
      console.log('[Ads] Fatal error:', e);
      finish(false);
    }
  });
}

export function setSubscriptionStatus(subscribed: boolean) {
  isSubscribed = subscribed;
}

export function resetAdsState() {
  isSubscribed = false;
  isShowing = false;
}

export function getSubscriptionStatus(): boolean {
  return isSubscribed;
}
