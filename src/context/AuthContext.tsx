import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { setSubscriptionStatus } from '../lib/ads';

interface User {
  id: string;
  email: string;
  displayName?: string;
  isSubscribed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile (subscription status) from Supabase
  const fetchProfile = async (userId: string, email: string, displayName?: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_subscribed, subscription_expires_at')
      .eq('id', userId)
      .single();

    let isSubscribed = false;
    if (data?.is_subscribed) {
      // Check if subscription hasn't expired
      if (data.subscription_expires_at) {
        isSubscribed = new Date(data.subscription_expires_at) > new Date();
      } else {
        isSubscribed = true;
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

  useEffect(() => {
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
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptionStatus(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
