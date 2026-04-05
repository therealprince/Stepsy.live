// Google Sign-In service using Google Identity Services (GIS)
// Handles OAuth 2.0 token flow, session persistence, and token refresh
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, SCOPES } from '../config/google';
import type { UserProfile } from '../types';

// Session storage keys for persistence across page refreshes
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

// ---- Session Persistence Helpers ----

function saveSession(token: string, user: UserProfile, expiresIn?: number): void {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiryTime));
    }
  } catch {
    // sessionStorage might be blocked in some browsers
  }
}

function loadSession(): { token: string; user: UserProfile } | null {
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const userJson = sessionStorage.getItem(SESSION_USER_KEY);
    const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);

    if (!token || !userJson) return null;

    // Check if token has expired
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
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
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // ignore
  }
}

// Parse a JWT ID token to get user info
function parseJwt(token: string): Record<string, string> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
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
    // Timeout after 10s
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
  await waitForGapi();
  return new Promise((resolve) => {
    window.gapi!.load('client', async () => {
      await window.gapi!.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      // If we have a stored token, set it
      if (accessToken) {
        window.gapi!.client.setToken({ access_token: accessToken });
      }
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

/** Try to restore a session from sessionStorage (no popup, instant) */
export async function restoreSession(): Promise<{ user: UserProfile; token: string } | null> {
  const session = loadSession();
  if (!session) return null;

  // Validate the token is still working by making a lightweight API call
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!resp.ok) {
      clearSession();
      return null;
    }

    accessToken = session.token;

    // Initialize gapi with the restored token
    await waitForGapi();
    await initGapiClient();

    return session;
  } catch {
    clearSession();
    return null;
  }
}

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
        window.gapi!.client.setToken({ access_token: accessToken });

        // Fetch user profile
        try {
          const user = await fetchUserProfile(accessToken);

          // Save session for persistence
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
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export async function silentSignIn(): Promise<{ user: UserProfile; token: string } | null> {
  // First try to restore from session storage (instant, no popup)
  const restored = await restoreSession();
  if (restored) return restored;

  // Otherwise try GIS silent sign-in (may show popup briefly)
  await waitForGis();
  await initGapiClient();

  return new Promise((resolve) => {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES + ' openid profile email',
      callback: async (response) => {
        if (response.error) {
          resolve(null);
          return;
        }
        accessToken = response.access_token!;
        window.gapi!.client.setToken({ access_token: accessToken });

        try {
          const user = await fetchUserProfile(accessToken);
          saveSession(accessToken, user, response.expires_in);
          resolve({ user, token: accessToken });
        } catch {
          resolve(null);
        }
      },
      error_callback: () => {
        resolve(null);
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function signOut(): void {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      window.gapi?.client.setToken(null);
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
  if (window.gapi?.client) {
    window.gapi.client.setToken({ access_token: token });
  }
}
