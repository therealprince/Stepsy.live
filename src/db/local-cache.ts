// Local IndexedDB cache for offline speed
// Mirrors Drive data locally so the app feels instant
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

export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

// ---- Typed Accessors ----

export async function getCachedSteps(): Promise<CacheEntry<StepsData> | undefined> {
  return getCached<StepsData>('steps');
}

export async function setCachedSteps(data: StepsData, driveFileId: string | null): Promise<void> {
  return setCache('steps', data, driveFileId);
}

export async function getCachedTrips(): Promise<CacheEntry<TripsData> | undefined> {
  return getCached<TripsData>('trips');
}

export async function setCachedTrips(data: TripsData, driveFileId: string | null): Promise<void> {
  return setCache('trips', data, driveFileId);
}

export async function getCachedSettings(): Promise<CacheEntry<AppSettings> | undefined> {
  return getCached<AppSettings>('settings');
}

export async function setCachedSettings(data: AppSettings, driveFileId: string | null): Promise<void> {
  return setCache('settings', data, driveFileId);
}

// Check if cache is fresh (less than 5 minutes old)
export function isCacheFresh(entry: CacheEntry | undefined, maxAgeMs: number = 5 * 60 * 1000): boolean {
  if (!entry) return false;
  return Date.now() - entry.updatedAt < maxAgeMs;
}
