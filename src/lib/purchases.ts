/**
 * RevenueCat purchases manager
 * 
 * Handles subscription initialization, purchase flow, and status checks.
 * API Key: test mode (switch to production before release)
 */
import { Platform } from 'react-native';

// Lazy import to avoid crash in Expo Go
let Purchases: any = null;
let purchasesAvailable = false;

try {
  Purchases = require('react-native-purchases').default;
  purchasesAvailable = true;
} catch {
  console.log('[Purchases] react-native-purchases not available (Expo Go?)');
}

const REVENUECAT_API_KEY = Platform.OS === 'android'
  ? 'goog_oZkKAVpqLehmlNAwgwYObNCtHoH'
  : 'appl_gRoXqbZikpsRMiVnMyXdwKXflbi';
const ENTITLEMENT_ID = 'BeanGo Pro';

let initialized = false;

async function invalidatePurchasesCacheSafe() {
  if (!purchasesAvailable || !initialized) return;
  try {
    await Purchases.invalidateCustomerInfoCache();
  } catch (e) {
    console.log('[Purchases] Cache invalidate skipped:', e);
  }
}

/**
 * Initialize RevenueCat SDK
 * Call once at app startup after auth
 */
export async function initPurchases(userId?: string): Promise<void> {
  if (!purchasesAvailable || initialized) return;

  try {
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });
    initialized = true;
    console.log('[Purchases] Initialized', userId ? `for user ${userId}` : 'anonymous');
  } catch (e) {
    console.error('[Purchases] Init failed:', e);
  }
}

/**
 * Log in user to RevenueCat (call after Supabase auth)
 */
export async function loginPurchases(userId: string): Promise<void> {
  if (!purchasesAvailable || !initialized) return;
  try {
    const currentUserId = await Purchases.getAppUserID().catch(() => null);
    if (currentUserId !== userId) {
      await Purchases.logIn(userId);
      console.log('[Purchases] Logged in:', userId);
    }
    await invalidatePurchasesCacheSafe();
  } catch (e) {
    console.error('[Purchases] Login failed:', e);
  }
}

/**
 * Log out from RevenueCat (call on sign out)
 */
export async function logoutPurchases(): Promise<void> {
  if (!purchasesAvailable || !initialized) return;
  try {
    await Purchases.logOut();
    await invalidatePurchasesCacheSafe();
    console.log('[Purchases] Logged out');
  } catch (e) {
    console.error('[Purchases] Logout failed:', e);
  }
}

/**
 * Check if user has active "BeanGo Pro" entitlement
 */
export async function checkSubscription(): Promise<boolean> {
  if (!purchasesAvailable || !initialized) return false;

  try {
    await invalidatePurchasesCacheSafe();
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return !!entitlement;
  } catch (e) {
    console.error('[Purchases] Check subscription failed:', e);
    return false;
  }
}

/**
 * Get available packages (monthly, yearly, lifetime)
 */
export async function getOfferings(): Promise<any[]> {
  if (!purchasesAvailable || !initialized) return [];

  try {
    const offerings = await Purchases.getOfferings();
    console.log('[Purchases] Offerings loaded:', {
      current: offerings.current?.identifier,
      packageCount: offerings.current?.availablePackages?.length || 0,
      all: Object.keys(offerings.all || {}),
    });
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.error('[Purchases] Get offerings failed:', e);
    return [];
  }
}

export function isPurchasesInitialized(): boolean {
  return initialized;
}

/**
 * Purchase a package
 * Returns true if purchase was successful
 */
export async function purchasePackage(pkg: any): Promise<{ success: boolean; error?: string }> {
  if (!purchasesAvailable || !initialized) {
    return { success: false, error: 'Purchases not available' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: isActive };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, error: 'CANCELLED' };
    }
    return { success: false, error: e.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable || !initialized) return false;

  try {
    const customerInfo = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch (e) {
    console.error('[Purchases] Restore failed:', e);
    return false;
  }
}

/**
 * Check if RevenueCat SDK is available
 */
export function isPurchasesAvailable(): boolean {
  return purchasesAvailable;
}
