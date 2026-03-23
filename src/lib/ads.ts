/**
 * Ad manager - placeholder for Google AdMob integration
 * 
 * Flow: "再種一顆" → showRewardedAd() → onComplete → reset seeds
 * Subscribed users skip ads entirely
 * 
 * TODO: Replace with actual AdMob when doing native build
 * - npm install react-native-google-mobile-ads
 * - Configure app.json with AdMob app ID
 * - Replace showRewardedAd with real implementation
 */

let isSubscribed = false; // TODO: Connect to real subscription state

/**
 * Check if user should see ads
 */
export function shouldShowAd(): boolean {
  return !isSubscribed;
}

/**
 * Show a rewarded interstitial ad
 * Returns true if ad was watched (or skipped for subscribers)
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) {
    // Subscribers skip ads
    return true;
  }

  // TODO: Replace this with actual AdMob rewarded ad
  // For now, simulate ad with a delay
  return new Promise((resolve) => {
    // Simulate 2-second ad loading + viewing
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });
}

/**
 * Set subscription status (called when user subscribes/unsubscribes)
 */
export function setSubscriptionStatus(subscribed: boolean) {
  isSubscribed = subscribed;
}
