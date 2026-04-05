import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { signIn as googleSignIn, signOut as googleSignOut, silentSignIn } from '../services/auth';
import { isGoogleConfigured } from '../config/google';
import type { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  isSignedIn: boolean;
  isLoading: boolean;
  isConfigured: boolean;
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

  // Try silent sign-in on mount
  useEffect(() => {
    if (!configured) {
      // No Google credentials — auto-enter demo mode
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    silentSignIn()
      .then((result) => {
        if (result) {
          setUser(result.user);
        }
      })
      .catch(() => {
        // Silent sign-in failed — that's fine
      })
      .finally(() => setIsLoading(false));
  }, [configured]);

  const signIn = useCallback(async () => {
    if (!configured) {
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
