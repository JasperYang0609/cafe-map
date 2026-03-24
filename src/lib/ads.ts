/**
 * Ad manager - Daily free picks + rewarded ads
 * 
 * Free users: 3 free picks per day, then watch ad for each additional pick
 * Subscribers: unlimited picks, no ads
 * 
 * TODO: Replace showRewardedAd with actual AdMob
 */

const DAILY_FREE_PICKS = 3;

let isSubscribed = false;
let dailyPickCount = 0;
let lastResetDate = new Date().toDateString();

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
 * Show a rewarded ad
 * Returns true if ad was watched (or skipped for subscribers)
 */
export async function showRewardedAd(): Promise<boolean> {
  if (isSubscribed) return true;

  // TODO: Replace with actual AdMob rewarded ad
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
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
