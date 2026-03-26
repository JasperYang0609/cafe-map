import { supabase } from './supabase';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '884465277657-3fv8s27aiaejgbnr8s911jon85anjh3m.apps.googleusercontent.com';
const IOS_CLIENT_ID = '884465277657-h3ulofb2q17hift5gjb269osq7jl0cn6.apps.googleusercontent.com';

let configured = false;

function ensureConfigured() {
  if (!configured) {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      scopes: ['email', 'profile'],
    });
    configured = true;
  }
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    ensureConfigured();

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { error: 'CANCELLED' };
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      return { error: 'No ID token received' };
    }

    // Sign in to Supabase with the Google ID token
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.log('Supabase Google sign in error:', error.message);
      return { error: error.message };
    }

    return {};
  } catch (err: any) {
    // User cancelled
    if (err?.code === 'SIGN_IN_CANCELLED' || err?.code === '12501') {
      return { error: 'CANCELLED' };
    }
    console.log('Google sign in error:', err);
    return { error: err?.message || 'Google 登入失敗' };
  }
}
