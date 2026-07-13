'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { getSupabaseClient, persistAuthSession } from '@/lib/supabase-client';
import type { AuthSessionResult, Profile, SignUpResult } from '@/types/auth';

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = useCallback(async () => {
    const next = await api.get<Profile>('/auth/me');
    setProfile(next);
  }, []);

  const signOut = useCallback(async () => {
    try { await getSupabaseClient().auth.signOut(); } catch { /* local config may be unavailable */ }
    setProfile(null);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data } = await getSupabaseClient().auth.getSession();
        if (data.session) {
          const next = await api.get<Profile>('/auth/me', { token: data.session.access_token });
          if (alive) setProfile(next);
        }
      } catch {
        if (alive) setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const unauthorized = () => { void signOut().finally(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`)); };
    window.addEventListener('satoori:unauthorized', unauthorized);
    return () => { alive = false; window.removeEventListener('satoori:unauthorized', unauthorized); };
  }, [pathname, router, signOut]);

  const value = useMemo<AuthContextValue>(() => ({
    profile,
    loading,
    async signIn(email, password) {
      const result = await api.post<AuthSessionResult>('/auth/sign-in', { email, password }, { token: null });
      await persistAuthSession(result.accessToken, result.refreshToken);
      await refreshProfile();
    },
    async signUp(email, password, displayName) {
      const result = await api.post<SignUpResult>('/auth/sign-up', { email, password, displayName }, { token: null });
      await persistAuthSession(result.accessToken, result.refreshToken);
      setProfile(result.profile);
    },
    signOut,
    refreshProfile
  }), [loading, profile, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (!loading && !profile) router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [loading, pathname, profile, router]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-noir-950 text-parchment-100">인증 상태를 확인하는 중...</main>;
  if (!profile) return null;
  return children;
}
