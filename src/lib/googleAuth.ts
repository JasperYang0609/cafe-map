import { supabase } from './supabase';

const WEB_CLIENT_ID = '884465277657-3fv8s27aiaejgbnr8s911jon85anjh3m.apps.googleusercontent.com';
const IOS_CLIENT_ID = '884465277657-h3ulofb2q17hift5gjb269osq7jl0cn6.apps.googleusercontent.com';

let GoogleSigninModule: any = null;
let configured = false;

function getGoogleSignin() {
  if (!GoogleSigninModule) {
    try {
      GoogleSigninModule = require('@react-native-google-signin/google-signin');
    } catch {
      return null;
    }
  }
  return GoogleSigninModule;
}

export function isGoogleAuthAvailable(): boolean {
  return getGoogleSignin() !== null;
}

function ensureConfigured() {
  const mod = getGoogleSignin();
  if (!mod || configured) return;
  mod.GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['email', 'profile'],
  });
  configured = true;
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const mod = getGoogleSignin();
  if (!mod) {
    return { error: 'Google Sign In is not available in this build' };
  }

  try {
    ensureConfigured();

    await mod.GoogleSignin.hasPlayServices();
    const response = await mod.GoogleSignin.signIn();

    if (!mod.isSuccessResponse(response)) {
      return { error: 'CANCELLED' };
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      return { error: 'No ID token received' };
    }

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
    if (err?.code === 'SIGN_IN_CANCELLED' || err?.code === '12501') {
      return { error: 'CANCELLED' };
    }
    console.log('Google sign in error:', err);
    return { error: err?.message || 'Google 登入失敗' };
  }
}
