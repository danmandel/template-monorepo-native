import type { AuthError, Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from './client';

export type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false
      });
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep link for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Extract tokens from URL and set session
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
        }
      }
    };

    // Get initial URL (in case app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { full_name?: string }
    ): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { error };
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      // Create the redirect URL for the app
      const redirectUrl = Linking.createURL('/');

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });

      if (error) return { error };
      if (!data.url) return { error: { message: 'No OAuth URL returned' } as AuthError };

      // Open the browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Handle the callback URL
        const params = new URLSearchParams(
          result.url.split('#')[1] || result.url.split('?')[1] || ''
        );
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          return { error: sessionError };
        }
      }

      return { error: null };
    } catch (err) {
      return {
        error: {
          message: err instanceof Error ? err.message : 'Google sign-in failed'
        } as AuthError
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword
  };
};
