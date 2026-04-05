import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  signIn as googleSignIn,
  signOut as googleSignOut,
  silentSignIn,
  onSessionChange,
} from '../services/auth';
import { isGoogleConfigured } from '../config/google';
import type { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  isSignedIn: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const DEMO_USER: UserProfile = {
  id: 'demo',
  name: 'Demo User',
  email: 'demo@stepsy.app',
  picture: '',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const configured = isGoogleConfigured();

  // Auto-sign-in attempt on mount (only if Google API is configured)
  useEffect(() => {
    if (!configured) {
      // No Google credentials configured — don't auto-enter demo mode,
      // just stop loading so the login screen shows.
      setIsLoading(false);
      return;
    }

    // Try silent sign-in with existing token from localStorage
    silentSignIn()
      .then((result) => {
        if (result) {
          console.log('[Stepsy] Auto-signed in as', result.user.email);
          setUser(result.user);
          setIsDemoMode(false);
        }
      })
      .catch(() => {
        // Silent sign-in failed — user will need to click button
      })
      .finally(() => setIsLoading(false));
  }, [configured]);

  // Listen for cross-tab session changes (sign-in/sign-out in another tab)
  useEffect(() => {
    if (!configured) return;

    const unsubscribe = onSessionChange((session) => {
      if (session) {
        console.log('[Stepsy] Cross-tab sign-in detected for', session.user.email);
        setUser(session.user);
        setIsDemoMode(false);
        setIsLoading(false);
      } else {
        console.log('[Stepsy] Cross-tab sign-out detected');
        setUser(null);
        setIsDemoMode(false);
      }
    });

    return unsubscribe;
  }, [configured]);

  const signIn = useCallback(async () => {
    if (!configured) {
      // If Google isn't configured, clicking "Sign in" enters demo mode
      setUser(DEMO_USER);
      setIsDemoMode(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setIsDemoMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, [configured]);

  const signOut = useCallback(() => {
    if (!isDemoMode) {
      googleSignOut();
    }
    setUser(null);
    setIsDemoMode(false);
  }, [isDemoMode]);

  const enterDemoMode = useCallback(() => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoading,
        isConfigured: configured,
        isDemoMode,
        error,
        signIn,
        signOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
