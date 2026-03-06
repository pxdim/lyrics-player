'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, AuthError } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { DESIGN_TOKENS } from 'shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  // Google 登入
  signIn: () => Promise<void>;
  // Email 登入
  signInWithEmail: (email: string, password: string) => Promise<void>;
  // Email 註冊
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  // 登出
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 檢查現有 session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 監聽 auth 變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message);
        throw error;
      }
    } catch (err) {
      const message = err instanceof AuthError ? err.message : '登入失敗';
      setError(message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        throw error;
      }
    } catch (err) {
      const message = err instanceof AuthError ? err.message : '登入失敗';
      setError(message);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        setError(error.message);
        throw error;
      }

      // 如果需要 email 驗證
      if (data.user && !data.session) {
        setError('請檢查您的信箱以確認帳號');
      }
    } catch (err) {
      const message = err instanceof AuthError ? err.message : '註冊失敗';
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        throw error;
      }
      setUser(null);
    } catch (err) {
      const message = err instanceof AuthError ? err.message : '登出失敗';
      setError(message);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
