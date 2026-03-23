import { supabase } from './supabase';

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Accept privacy policy
 */
export async function acceptPrivacy(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      privacy_accepted: true,
      privacy_accepted_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return !error;
}

/**
 * Check if user has accepted privacy policy
 */
export async function hasAcceptedPrivacy(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('privacy_accepted')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.privacy_accepted || false;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
