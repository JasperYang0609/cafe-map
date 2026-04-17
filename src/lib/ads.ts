/**
 * Ad manager - Google AdMob integration.
 *
 * On-demand rewarded architecture: no preload; each showRewardedAd()
 * creates → loads → shows → captures reward in one flow.
 *
 * iOS: ATT prompt before AdMob init. NPA flag derived from ATT result.
 * Shared initPromise prevents concurrent init races across banner + rewarded.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
let initPromise: Promise<boolean> | null = null;
let adsInitialized = false;
let isShowing = false;
let pickCountLoaded = false;
let attGranted = false;

const PICK_COUNT_KEY = '@beango_daily_pick_count';
const PICK_DATE_KEY = '@beango_daily_pick_date';

async function loadPickCount() {
  if (pickCountLoaded) return;
  try {
    const [countStr, dateStr] = await Promise.all([
      AsyncStorage.getItem(PICK_COUNT_KEY),
      AsyncStorage.getItem(PICK_DATE_KEY),
    ]);
    const today = new Date().toDateString();
    if (dateStr === today && countStr) {
      dailyPickCount = parseInt(countStr, 10) || 0;
      lastResetDate = today;
    } else {
      dailyPickCount = 0;
      lastResetDate = today;
    }
  } catch (e) {
    console.log('[Ads] Failed to load pick count:', e);
  }
  pickCountLoaded = true;
}

async function savePickCount() {
  try {
    await Promise.all([
      AsyncStorage.setItem(PICK_COUNT_KEY, String(dailyPickCount)),
      AsyncStorage.setItem(PICK_DATE_KEY, lastResetDate),
    ]);
  } catch (e) {
    console.log('[Ads] Failed to save pick count:', e);
  }
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyPickCount = 0;
    lastResetDate = today;
    savePickCount();
  }
}

// Load persisted count on module init
loadPickCount();

async function requestATT(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;
  try {
    const tt = require('expo-tracking-transparency');
    const current = await tt.getTrackingPermissionsAsync();
    if (current.status === 'undetermined') {
      const result = await tt.requestTrackingPermissionsAsync();
      console.log('[Ads] ATT requested →', result.status);
      return result.status === 'granted';
    }
    console.log('[Ads] ATT already', current.status);
    return current.status === 'granted';
  } catch (e) {
    console.log('[Ads] ATT unavailable:', e);
    return false;
  }
}

export function initAds(): Promise<boolean> {
  if (adsInitialized) return Promise.resolve(true);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      attGranted = await requestATT();
      const ads = require('react-native-google-mobile-ads');
      const mobileAds = ads.default;
      await mobileAds().initialize();
      adsInitialized = true;
      console.log(`[Ads] AdMob initialized (${IS_DEV ? 'TEST' : 'PROD'}) ATT=${attGranted ? 'granted' : 'denied'}`);
      return true;
    } catch (e) {
      console.log('[Ads] AdMob init failed:', e);
      initPromise = null; // allow retry
      return false;
    }
  })();
  return initPromise;
}

export function getAdRequestOptions() {
  return {
    requestNonPersonalizedAdsOnly: !attGranted,
  };
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
  savePickCount();
}

/**
 * Create → Load → Show → Capture reward, all in one call.
 * No preloading, no stale state, no listener conflicts.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;
  if (isShowing) return false;

  const ok = await initAds();
  if (!ok || !adsInitialized) return false;

  isShowing = true;

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    let earned = false;
    let shown = false;
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

      const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded!, getAdRequestOptions());

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

      // OPENED → track that ad was actually displayed to user
      unsubs.push(
        ad.addAdEventListener(AdEventType.OPENED, () => {
          shown = true;
          console.log('[Ads] Ad OPENED (displayed to user)');
        })
      );

      // CLOSED → resolve with reward status
      // Fallback: if ad was shown but EARNED_REWARD didn't fire,
      // grant reward — user shouldn't be penalized for SDK quirks
      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[Ads] CLOSED, earned:', earned, 'shown:', shown);
          finish(earned || shown);
        })
      );

      // ERROR → resolve false (with full diagnostics)
      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
          console.log('[Ads] ERROR code=', err?.code, 'message=', err?.message, 'raw=', err);
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
