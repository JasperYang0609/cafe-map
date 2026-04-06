import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { setSubscriptionStatus } from '../lib/ads';
import { initPurchases, loginPurchases, logoutPurchases, checkSubscription } from '../lib/purchases';

interface User {
  id: string;
  email: string;
  displayName?: string;
  isSubscribed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshSubscription: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  deleteAccount: async () => ({}),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile and check subscription from both Supabase and RevenueCat
  const fetchProfile = async (userId: string, email: string, displayName?: string) => {
    // Initialize RevenueCat and login
    await initPurchases(userId);
    await loginPurchases(userId);

    // Check RevenueCat subscription first
    let isSubscribed = await checkSubscription();

    // Fallback: check Supabase profiles (for manual grants or webhook updates)
    if (!isSubscribed) {
      const { data } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_expires_at')
        .eq('id', userId)
        .single();

      if (data?.is_subscribed) {
        if (data.subscription_expires_at) {
          isSubscribed = new Date(data.subscription_expires_at) > new Date();
        } else {
          isSubscribed = true;
        }
      }
    }

    // Sync to ads module
    setSubscriptionStatus(isSubscribed);

    setUser({
      id: userId,
      email,
      displayName,
      isSubscribed,
    });
  };

  // Refresh subscription status (call after purchase)
  const refreshSubscription = async () => {
    if (!user) return;
    const isSubscribed = await checkSubscription();

    // Also check Supabase fallback
    let finalStatus = isSubscribed;
    if (!finalStatus) {
      const { data } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (data?.is_subscribed) {
        if (data.subscription_expires_at) {
          finalStatus = new Date(data.subscription_expires_at) > new Date();
        } else {
          finalStatus = true;
        }
      }
    }

    setSubscriptionStatus(finalStatus);
    setUser(prev => prev ? { ...prev, isSubscribed: finalStatus } : null);
  };

  useEffect(() => {
    // Initialize RevenueCat (anonymous mode for non-logged-in users)
    initPurchases();

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name
        );
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name
        );
      } else {
        setUser(null);
        setSubscriptionStatus(false);
        logoutPurchases();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) {
        return { error: 'Email 或密碼錯誤' };
      }
      return { error: error.message };
    }
    return {};
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://jasperyang0609.github.io/cafe-map/',
      },
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: '此 Email 已註冊' };
      }
      return { error: error.message };
    }
    return {};
  };

  const signOut = async () => {
    await logoutPurchases();
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptionStatus(false);
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'Not logged in' };
    try {
      // Delete user data from Supabase tables
      await supabase.from('favorites').delete().eq('user_id', user.id);
      await supabase.from('search_history').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Sign out from RevenueCat
      await logoutPurchases();

      // Delete auth user via Supabase Edge Function (client can't delete own auth record)
      // For now, sign out and mark for deletion — Supabase admin can clean up
      // Or use the RPC function if available
      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) {
        console.log('[Auth] RPC delete_own_account not available, signing out only:', rpcError.message);
      }

      await supabase.auth.signOut();
      setUser(null);
      setSubscriptionStatus(false);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to delete account' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshSubscription, signIn, signUp, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
