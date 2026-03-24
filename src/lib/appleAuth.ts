import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { Platform } from 'react-native';

/**
 * Check if Apple Sign In is available (iOS 13+)
 */
export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Sign in with Apple
 * Returns { success: true } or { success: false, error: string }
 */
export async function signInWithApple(): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate nonce
    const rawNonce = Crypto.getRandomBytes(32)
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    // Request Apple credential
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { success: false, error: 'Apple Sign In failed - no identity token' };
    }

    // Sign in with Supabase using the Apple token
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'CANCELLED' };
    }
    return { success: false, error: error.message || 'Apple Sign In failed' };
  }
}
