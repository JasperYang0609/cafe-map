import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export function isFacebookAuthAvailable(): boolean {
  return true;
}

export async function signInWithFacebook(): Promise<{ error?: string }> {
  try {
    const redirectTo = Linking.createURL('/');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.url) {
      return { error: 'No OAuth URL returned' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      // Extract tokens from the redirect URL and set the session
      const url = new URL(result.url);
      // Supabase puts tokens in the hash fragment
      const fragment = url.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return {};
      }

      // Sometimes tokens come as query params instead
      const queryAccessToken = url.searchParams.get('access_token');
      const queryRefreshToken = url.searchParams.get('refresh_token');

      if (queryAccessToken && queryRefreshToken) {
        await supabase.auth.setSession({
          access_token: queryAccessToken,
          refresh_token: queryRefreshToken,
        });
        return {};
      }

      // Auth state listener in AuthContext will pick up the session
      return {};
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: 'CANCELLED' };
    }

    return { error: 'Facebook 登入失敗' };
  } catch (err: any) {
    console.log('Facebook sign in error:', err);
    return { error: err?.message || 'Facebook 登入失敗' };
  }
}
