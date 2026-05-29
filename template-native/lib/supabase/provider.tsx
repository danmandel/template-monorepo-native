import type { AuthError } from '@supabase/supabase-js';
import { createContext, useContext, type ReactNode } from 'react';

import { useAuth, type AuthState } from './auth';
import { supabase, isSupabaseConfigured } from './client';
import type { Profile } from './types';

type SupabaseContextValue = AuthState & {
  supabase: typeof supabase;
  profile: Profile | null;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
};

const SupabaseContext = createContext<SupabaseContextValue>({
  supabase,
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isConfigured: false,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null })
});

export const useSupabaseContext = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const isConfigured = isSupabaseConfigured();

  // Profile is derived from auth user metadata
  const profile: Profile | null = auth.user
    ? {
        id: auth.user.id,
        email: auth.user.email ?? null,
        full_name: auth.user.user_metadata?.full_name ?? null,
        avatar_url: auth.user.user_metadata?.avatar_url ?? null,
        created_at: auth.user.created_at,
        updated_at: auth.user.updated_at ?? auth.user.created_at
      }
    : null;

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user: auth.user,
        session: auth.session,
        isLoading: auth.isLoading,
        profile,
        isConfigured,
        signInWithEmail: auth.signInWithEmail,
        signUpWithEmail: auth.signUpWithEmail,
        signInWithGoogle: auth.signInWithGoogle,
        signOut: auth.signOut,
        resetPassword: auth.resetPassword
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
