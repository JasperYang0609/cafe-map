/**
 * Ad manager - Google AdMob integration
 *
 * Free users: 3 free picks per day, then watch a rewarded ad for each additional pick.
 * Subscribers: unlimited picks, no ads.
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
let rewardedLoaded = false;
let rewardedAd: any = null;
let rewardedListeners: Array<() => void> = [];
let initStarted = false;
let adsInitialized = false;
let isShowingRewarded = false;
let isLoadingRewarded = false;

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyPickCount = 0;
    lastResetDate = today;
  }
}

function removePreloadListeners() {
  rewardedListeners.forEach((unsubscribe) => unsubscribe());
  rewardedListeners = [];
}

function clearRewardedRuntime() {
  removePreloadListeners();
  rewardedLoaded = false;
  rewardedAd = null;
  isShowingRewarded = false;
  isLoadingRewarded = false;
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
    setTimeout(() => preloadRewarded(), 2500);
  } catch (e) {
    console.log('[Ads] AdMob not available (Expo Go?), using fallback');
  }
}

function preloadRewarded() {
  if (isSubscribed || isShowingRewarded || rewardedLoaded || isLoadingRewarded) return;

  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = AD_UNIT_IDS.rewarded;

    clearRewardedRuntime();
    isLoadingRewarded = true;

    rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedListeners.push(
      rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewardedLoaded = true;
        isLoadingRewarded = false;
        console.log('[Ads] Rewarded ad loaded');
      })
    );

    rewardedListeners.push(
      rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        rewardedLoaded = false;
        isShowingRewarded = false;
        isLoadingRewarded = false;
        console.log('[Ads] Rewarded ad load error:', error);
        setTimeout(preloadRewarded, 30000);
      })
    );

    rewardedListeners.push(
      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        rewardedLoaded = false;
        isShowingRewarded = false;
        isLoadingRewarded = false;
        setTimeout(preloadRewarded, 500);
      })
    );

    rewardedAd.load();
  } catch (e) {
    isLoadingRewarded = false;
    console.log('[Ads] Cannot preload rewarded ad (Expo Go?)');
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

export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;
  if (isShowingRewarded) return false;

  if (!adsInitialized) {
    await initAds();
  }

  if (rewardedLoaded && rewardedAd) {
    // CRITICAL: Remove preload-time listeners before showing.
    // Otherwise the preload CLOSED listener fires alongside the show
    // CLOSED listener and resets state before reward is captured.
    removePreloadListeners();

    const adRef = rewardedAd;
    return new Promise((resolve) => {
      try {
        const { RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');
        isShowingRewarded = true;
        let didEarnReward = false;
        let resolved = false;
        const localListeners: Array<() => void> = [];

        const cleanup = () => {
          localListeners.forEach((unsub) => unsub());
          localListeners.length = 0;
        };

        const doResolve = (value: boolean) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          isShowingRewarded = false;
          rewardedLoaded = false;
          rewardedAd = null;
          resolve(value);
          // Preload next ad after resolve
          setTimeout(preloadRewarded, 500);
        };

        localListeners.push(
          adRef.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            console.log('[Ads] Earned reward');
            didEarnReward = true;
          })
        );

        localListeners.push(
          adRef.addAdEventListener(AdEventType.CLOSED, () => {
            console.log('[Ads] Ad closed, reward:', didEarnReward);
            doResolve(didEarnReward);
          })
        );

        localListeners.push(
          adRef.addAdEventListener(AdEventType.ERROR, (err: any) => {
            console.log('[Ads] Ad error during show:', err);
            doResolve(false);
          })
        );

        adRef.show();
      } catch (e) {
        console.log('[Ads] Failed to show rewarded ad:', e);
        isShowingRewarded = false;
        resolve(false);
      }
    });
  }

  // Ad not ready — kick off preload and return false
  if (!isLoadingRewarded) {
    preloadRewarded();
  }
  console.log('[Ads] Rewarded ad not ready yet');
  return false;
}

export function setSubscriptionStatus(subscribed: boolean) {
  isSubscribed = subscribed;
  if (subscribed) {
    clearRewardedRuntime();
  } else if (adsInitialized) {
    setTimeout(() => preloadRewarded(), 500);
  }
}

export function resetAdsState() {
  isSubscribed = false;
  clearRewardedRuntime();
}

export function getSubscriptionStatus(): boolean {
  return isSubscribed;
}
