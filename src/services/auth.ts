// Google Sign-In service using Google Identity Services (GIS)
// Handles OAuth 2.0 token flow, session persistence, and token refresh
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, SCOPES } from '../config/google';
import type { UserProfile } from '../types';

// localStorage keys for persistence across tabs AND page refreshes
const SESSION_TOKEN_KEY = 'stepsy_access_token';
const SESSION_USER_KEY = 'stepsy_user_profile';
const SESSION_EXPIRY_KEY = 'stepsy_token_expiry';

// Extend window for Google APIs
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (error: { type: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, callback?: () => void) => void;
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: { access_token: string } | null) => void;
        request: (args: {
          path: string;
          method?: string;
          params?: Record<string, string>;
          headers?: Record<string, string>;
          body?: string;
        }) => Promise<{ result: Record<string, unknown>; body: string; status: number }>;
      };
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;
let gapiInitialized = false;

// Callback for cross-tab session changes
type SessionChangeCallback = (session: { user: UserProfile; token: string } | null) => void;
let sessionChangeCallback: SessionChangeCallback | null = null;

/**
 * Register a callback to be notified when the session changes in another tab.
 * Used by AuthContext to auto-restore sessions.
 */
export function onSessionChange(callback: SessionChangeCallback): () => void {
  sessionChangeCallback = callback;

  // Listen for storage events (fired when another tab changes localStorage)
  const handler = (event: StorageEvent) => {
    if (event.key === SESSION_TOKEN_KEY) {
      if (event.newValue) {
        // Another tab signed in — restore the session
        const session = loadSession();
        if (session) {
          accessToken = session.token;
          _syncGapiToken();
          callback(session);
        }
      } else {
        // Another tab signed out
        accessToken = null;
        _syncGapiToken();
        callback(null);
      }
    }
  };

  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('storage', handler);
    sessionChangeCallback = null;
  };
}

// ---- Session Persistence Helpers (localStorage for cross-tab support) ----

function saveSession(token: string, user: UserProfile, expiresIn?: number): void {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(SESSION_EXPIRY_KEY, String(expiryTime));
    }
    console.log('[Stepsy] Session saved to localStorage for', user.email);
  } catch {
    // localStorage might be blocked in some browsers (incognito, etc.)
  }
}

function loadSession(): { token: string; user: UserProfile } | null {
  try {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const userJson = localStorage.getItem(SESSION_USER_KEY);
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);

    if (!token || !userJson) return null;

    // Check if token has expired
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        console.log('[Stepsy] Stored token has expired, clearing session');
        clearSession();
        return null;
      }
    }

    const user = JSON.parse(userJson) as UserProfile;
    return { token, user };
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // ignore
  }
}

/** Sync the in-memory access token to gapi client */
function _syncGapiToken(): void {
  if (window.gapi?.client) {
    if (accessToken) {
      window.gapi.client.setToken({ access_token: accessToken });
    } else {
      window.gapi.client.setToken(null);
    }
  }
}

// Wait for the Google Identity Services script to load
function waitForGis(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 10000);
  });
}

// Wait for gapi to load
function waitForGapi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.gapi) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.gapi) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 10000);
  });
}

export async function initGapiClient(): Promise<void> {
  if (gapiInitialized) {
    // Already initialized, just sync the token
    _syncGapiToken();
    return;
  }

  await waitForGapi();
  return new Promise((resolve) => {
    window.gapi!.load('client', async () => {
      await window.gapi!.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      gapiInitialized = true;
      // If we have a stored token, set it
      _syncGapiToken();
      resolve();
    });
  });
}

/** Fetch user profile from Google using access token */
async function fetchUserProfile(token: string): Promise<UserProfile> {
  const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!profileResp.ok) {
    throw new Error(`Profile fetch failed: ${profileResp.status}`);
  }
  const profile = await profileResp.json();
  return {
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    picture: profile.picture,
  };
}

/** Try to restore a session from localStorage (no popup, instant, works across tabs) */
export async function restoreSession(): Promise<{ user: UserProfile; token: string } | null> {
  const session = loadSession();
  if (!session) return null;

  // Validate the token is still working by making a lightweight API call
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!resp.ok) {
      console.log('[Stepsy] Stored token is invalid (status', resp.status, '), clearing');
      clearSession();
      return null;
    }

    accessToken = session.token;

    // Initialize gapi with the restored token
    await initGapiClient();

    console.log('[Stepsy] Session restored from localStorage for', session.user.email);
    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Interactive sign-in. Uses prompt: '' to auto-select the previously
 * authorized Google account. Only shows consent on first-ever sign-in.
 */
export async function signIn(): Promise<{ user: UserProfile; token: string }> {
  await waitForGis();
  await initGapiClient();

  return new Promise((resolve, reject) => {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES + ' openid profile email',
      callback: async (response) => {
        if (response.error) {
          const errorMsg = response.error === 'access_denied'
            ? 'Access denied. Please allow the requested permissions to use Stepsy.'
            : response.error === 'popup_closed_by_user'
              ? 'Sign-in popup was closed. Please try again.'
              : `Sign-in failed: ${response.error}`;
          reject(new Error(errorMsg));
          return;
        }
        accessToken = response.access_token!;
        _syncGapiToken();

        // Fetch user profile
        try {
          const user = await fetchUserProfile(accessToken);

          // Save session for persistence across tabs and refreshes
          saveSession(accessToken, user, response.expires_in);

          resolve({ user, token: accessToken });
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (error) => {
        const errorMsg = error.type === 'popup_failed_to_open'
          ? 'Popup was blocked by your browser. Please allow popups for this site and try again.'
          : error.type === 'popup_closed'
            ? 'Sign-in popup was closed. Please try again.'
            : `Sign-in error: ${error.type}`;
        reject(new Error(errorMsg));
      },
    });

    // Use prompt: '' to auto-select previously authorized account.
    // This avoids forcing re-consent every time. Google will only show
    // the consent screen if the user hasn't previously authorized these scopes.
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export async function silentSignIn(): Promise<{ user: UserProfile; token: string } | null> {
  // Restore from localStorage — instant, no popup, works across tabs
  const restored = await restoreSession();
  if (restored) return restored;

  // If no stored session, we can't do a truly silent sign-in with GIS.
  // Return null and let the user click the sign-in button.
  console.log('[Stepsy] No stored session found, user must sign in interactively');
  return null;
}

export function signOut(): void {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      _syncGapiToken();
    });
  }
  clearSession();
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer);
    tokenExpiryTimer = null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  _syncGapiToken();
}

/**
 * Returns the current user's ID from localStorage (useful for cache scoping)
 * without requiring a full session restore.
 */
export function getStoredUserId(): string | null {
  try {
    const userJson = localStorage.getItem(SESSION_USER_KEY);
    if (!userJson) return null;
    const user = JSON.parse(userJson) as UserProfile;
    return user.id;
  } catch {
    return null;
  }
}
