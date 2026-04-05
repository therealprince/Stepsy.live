// Google Sign-In service using Google Identity Services (GIS)
import { GOOGLE_CLIENT_ID, SCOPES } from '../config/google';
import type { UserProfile } from '../types';

// Extend window for Google APIs
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
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
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
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

export async function signIn(): Promise<{ user: UserProfile; token: string }> {
  await waitForGis();
  await initGapiClient();

  return new Promise((resolve, reject) => {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES + ' openid profile email',
      callback: async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        accessToken = response.access_token!;
        window.gapi!.client.setToken({ access_token: accessToken });

        // Fetch user profile
        try {
          const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profile = await profileResp.json();
          const user: UserProfile = {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
          };
          resolve({ user, token: accessToken });
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (error) => {
        reject(new Error(error.type));
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export async function silentSignIn(): Promise<{ user: UserProfile; token: string } | null> {
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
          const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profile = await profileResp.json();
          const user: UserProfile = {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
          };
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
