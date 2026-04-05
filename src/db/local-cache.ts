// Local IndexedDB cache for offline speed
// Mirrors Drive data locally so the app feels instant
//
// Cache keys are scoped by userId to prevent demo data from leaking
// into authenticated user views. Demo mode uses unscoped keys ('demo_steps', etc.)
import { openDB, type IDBPDatabase } from 'idb';
import type { StepsData, TripsData, AppSettings } from '../types';

const DB_NAME = 'stepsy_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  driveFileId: string | null;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Key Scoping ----

/** Build a user-scoped cache key. Demo mode uses 'demo' prefix. */
function scopedKey(base: string, userId: string | null): string {
  const scope = userId || 'demo';
  return `${scope}_${base}`;
}

// ---- Generic Cache Operations ----

export async function getCached<T>(key: string): Promise<CacheEntry<T> | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}

export async function setCache<T>(key: string, data: T, driveFileId: string | null): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    key,
    data,
    driveFileId,
    updatedAt: Date.now(),
  });
}

export async function deleteKey(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, key);
}

export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Clear demo-mode cache entries so they don't leak into authenticated views.
 */
export async function clearDemoCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const allKeys = await store.getAllKeys();

  for (const key of allKeys) {
    const keyStr = String(key);
    // Delete old unscoped keys (legacy) and demo-scoped keys
    if (
      keyStr === 'steps' || keyStr === 'trips' || keyStr === 'settings' ||
      keyStr.startsWith('demo_')
    ) {
      await store.delete(key);
    }
  }
  await tx.done;
  console.log('[Stepsy] Demo cache cleared');
}

// ---- Typed Accessors (user-scoped) ----

export async function getCachedSteps(userId: string | null): Promise<CacheEntry<StepsData> | undefined> {
  return getCached<StepsData>(scopedKey('steps', userId));
}

export async function setCachedSteps(data: StepsData, driveFileId: string | null, userId: string | null): Promise<void> {
  return setCache(scopedKey('steps', userId), data, driveFileId);
}

export async function getCachedTrips(userId: string | null): Promise<CacheEntry<TripsData> | undefined> {
  return getCached<TripsData>(scopedKey('trips', userId));
}

export async function setCachedTrips(data: TripsData, driveFileId: string | null, userId: string | null): Promise<void> {
  return setCache(scopedKey('trips', userId), data, driveFileId);
}

export async function getCachedSettings(userId: string | null): Promise<CacheEntry<AppSettings> | undefined> {
  return getCached<AppSettings>(scopedKey('settings', userId));
}

export async function setCachedSettings(data: AppSettings, driveFileId: string | null, userId: string | null): Promise<void> {
  return setCache(scopedKey('settings', userId), data, driveFileId);
}

// Check if cache is fresh (less than 5 minutes old)
export function isCacheFresh(entry: CacheEntry | undefined, maxAgeMs: number = 5 * 60 * 1000): boolean {
  if (!entry) return false;
  return Date.now() - entry.updatedAt < maxAgeMs;
}
