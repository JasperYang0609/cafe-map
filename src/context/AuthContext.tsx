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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshSubscription: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
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
    const { error } = await supabase.auth.signUp({ email, password });
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

  return (
    <AuthContext.Provider value={{ user, loading, refreshSubscription, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
