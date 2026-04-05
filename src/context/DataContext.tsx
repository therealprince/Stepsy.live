import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { isGoogleConfigured } from '../config/google';
import * as drive from '../services/drive';
import * as cache from '../db/local-cache';
import type { StepsData, TripsData, AppSettings, StepRecord } from '../types';
import { DEFAULT_SETTINGS } from '../config/google';
import { generateDemoSteps, generateDemoTrips } from '../utils/demo-data';

interface DataState {
  stepsData: StepsData;
  tripsData: TripsData;
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  lastSynced: Date | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';

  // Actions
  importStepRecords: (records: StepRecord[]) => Promise<number>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  addStepsToday: (steps: number) => void;
  refreshFromDrive: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

const EMPTY_STEPS: StepsData = { version: 1, records: [] };
const EMPTY_TRIPS: TripsData = { version: 1, trips: [] };
const INITIAL_SETTINGS: AppSettings = { ...DEFAULT_SETTINGS } as AppSettings;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isDemoMode, user } = useAuth();
  const [stepsData, setStepsData] = useState<StepsData>(EMPTY_STEPS);
  const [tripsData, setTripsData] = useState<TripsData>(EMPTY_TRIPS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Store Drive file IDs for writes
  const fileIds = useRef<{ steps: string | null; trips: string | null; settings: string | null }>({
    steps: null,
    trips: null,
    settings: null,
  });

  // Track if Drive files have been initialized (to avoid race conditions)
  const driveInitialized = useRef(false);

  // Use a ref to always have the latest stepsData for import merging (fixes stale closure)
  const stepsDataRef = useRef(stepsData);
  stepsDataRef.current = stepsData;

  // User ID for cache scoping — null for demo mode, real ID for authenticated users
  const userId = isDemoMode ? null : user?.id ?? null;

  const useDrive = isGoogleConfigured() && isSignedIn && !isDemoMode;

  // Load data on sign-in
  useEffect(() => {
    if (!isSignedIn) {
      // Reset state on sign-out
      driveInitialized.current = false;
      fileIds.current = { steps: null, trips: null, settings: null };
      setStepsData(EMPTY_STEPS);
      setTripsData(EMPTY_TRIPS);
      setSettings(INITIAL_SETTINGS);
      return;
    }

    if (isDemoMode) {
      loadDemoData();
    } else {
      loadData();
    }
  }, [isSignedIn, isDemoMode, user?.id]);

  /** Load demo data — always generate fresh + overlay any cached settings */
  const loadDemoData = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      const demoSteps = generateDemoSteps();
      const demoTrips = generateDemoTrips();

      setStepsData(demoSteps);
      setTripsData(demoTrips);

      // Demo settings use demo-scoped cache (userId=null → 'demo_settings' key)
      const cachedSettings = await cache.getCachedSettings(null);
      if (cachedSettings) {
        setSettings(cachedSettings.data);
      } else {
        setSettings(INITIAL_SETTINGS);
      }

      setLastSynced(new Date());
      setSyncStatus('synced');
    } catch (err) {
      console.error('Demo data load failed:', err);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  /** Ensure Drive files exist and fileIds are populated */
  async function ensureDriveFiles(): Promise<void> {
    if (!useDrive || driveInitialized.current) return;

    try {
      const [stepsResult, tripsResult, settingsResult] = await Promise.all([
        drive.readSteps(),
        drive.readTrips(),
        drive.readSettings(),
      ]);

      fileIds.current.steps = stepsResult.id;
      fileIds.current.trips = tripsResult.id;
      fileIds.current.settings = settingsResult.id;
      driveInitialized.current = true;

      console.log('[Stepsy] Drive files initialized:', {
        steps: stepsResult.id,
        trips: tripsResult.id,
        settings: settingsResult.id,
      });
    } catch (err) {
      console.error('[Stepsy] Failed to initialize Drive files:', err);
      throw err;
    }
  }

  /** Load real data from IndexedDB cache + Google Drive */
  const loadData = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      // 0. Clear any leftover demo/legacy cache entries first
      await cache.clearDemoCache();

      // 1. Load from IndexedDB cache first (instant) — user-scoped
      const cachedSteps = await cache.getCachedSteps(userId);
      const cachedSettings = await cache.getCachedSettings(userId);
      const cachedTrips = await cache.getCachedTrips(userId);

      if (cachedSteps) {
        console.log('[Stepsy] Loaded', cachedSteps.data.records.length, 'step records from cache');
        setStepsData(cachedSteps.data);
        if (cachedSteps.driveFileId) fileIds.current.steps = cachedSteps.driveFileId;
      }
      if (cachedSettings) {
        setSettings(cachedSettings.data);
        if (cachedSettings.driveFileId) fileIds.current.settings = cachedSettings.driveFileId;
      }
      if (cachedTrips) {
        setTripsData(cachedTrips.data);
        if (cachedTrips.driveFileId) fileIds.current.trips = cachedTrips.driveFileId;
      }

      // 2. Fetch from Google Drive if connected (background sync)
      if (useDrive) {
        try {
          await ensureDriveFiles();

          // Now read the actual data
          const [stepsResult, tripsResult, settingsResult] = await Promise.all([
            drive.readSteps(),
            drive.readTrips(),
            drive.readSettings(),
          ]);

          setStepsData(stepsResult.data);
          setTripsData(tripsResult.data);
          setSettings(settingsResult.data);

          fileIds.current.steps = stepsResult.id;
          fileIds.current.trips = tripsResult.id;
          fileIds.current.settings = settingsResult.id;

          // Update cache (user-scoped)
          await Promise.all([
            cache.setCachedSteps(stepsResult.data, stepsResult.id, userId),
            cache.setCachedTrips(tripsResult.data, tripsResult.id, userId),
            cache.setCachedSettings(settingsResult.data, settingsResult.id, userId),
          ]);

          setLastSynced(new Date());
          setSyncStatus('synced');
          console.log('[Stepsy] Drive sync complete. Steps records:', stepsResult.data.records.length);
        } catch (err) {
          console.error('[Stepsy] Drive sync failed:', err);
          setSyncStatus('error');
          // Still use cached data if Drive fails
        }
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('[Stepsy] Load data failed:', err);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const importStepRecords = useCallback(
    async (records: StepRecord[]): Promise<number> => {
      setIsSaving(true);
      setSyncStatus('syncing');

      try {
        // Use ref to get the LATEST stepsData (avoids stale closure problem)
        const currentData = stepsDataRef.current;

        // Merge with existing: newer entries overwrite
        const existingMap = new Map(currentData.records.map((r) => [r.date, r]));
        for (const rec of records) {
          existingMap.set(rec.date, rec);
        }

        const merged: StepsData = {
          version: 1,
          records: Array.from(existingMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        };

        console.log('[Stepsy] Import: merging', records.length, 'new records with', currentData.records.length, 'existing →', merged.records.length, 'total');

        setStepsData(merged);

        // Write to Drive if connected
        if (useDrive) {
          // Ensure Drive files are initialized before writing
          if (!fileIds.current.steps) {
            console.log('[Stepsy] Drive file IDs not ready, initializing...');
            await ensureDriveFiles();
          }

          if (fileIds.current.steps) {
            console.log('[Stepsy] Writing', merged.records.length, 'records to Drive file:', fileIds.current.steps);
            await drive.writeSteps(fileIds.current.steps, merged);
            console.log('[Stepsy] Drive write successful');
          } else {
            console.warn('[Stepsy] Could not write to Drive: file ID still null after init');
          }
        }

        // Always update cache (works offline too) — user-scoped
        await cache.setCachedSteps(merged, fileIds.current.steps, userId);

        setLastSynced(new Date());
        setSyncStatus('synced');
        return records.length;
      } catch (err) {
        console.error('[Stepsy] Import failed:', err);
        setSyncStatus('error');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [useDrive, userId]
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);

      // Always persist to cache — even in demo mode (user-scoped)
      await cache.setCachedSettings(updated, fileIds.current.settings, userId);

      // Also write to Drive if connected
      if (useDrive) {
        if (!fileIds.current.settings) {
          await ensureDriveFiles();
        }
        if (fileIds.current.settings) {
          await drive.writeSettings(fileIds.current.settings, updated);
        }
      }
    },
    [settings, useDrive, userId]
  );

  const addStepsToday = useCallback(
    (steps: number) => {
      const today = new Date().toISOString().split('T')[0];
      setStepsData((prev) => {
        const records = [...prev.records];
        const idx = records.findIndex((r) => r.date === today);
        if (idx >= 0) {
          records[idx] = { ...records[idx], steps: records[idx].steps + steps };
        } else {
          records.push({ date: today, steps });
        }
        const updated = { ...prev, records };

        // Fire-and-forget cache update (user-scoped)
        cache.setCachedSteps(updated, fileIds.current.steps, userId);
        return updated;
      });
    },
    [userId]
  );

  const refreshFromDrive = useCallback(async () => {
    if (isDemoMode) {
      await loadDemoData();
      return;
    }
    driveInitialized.current = false; // Force re-fetch
    await loadData();
  }, [isDemoMode, useDrive, userId]);

  const clearAllData = useCallback(async () => {
    const empty = { ...EMPTY_STEPS };
    setStepsData(empty);
    await cache.setCachedSteps(empty, fileIds.current.steps, userId);

    if (useDrive && fileIds.current.steps) {
      await drive.writeSteps(fileIds.current.steps, empty);
    }
  }, [useDrive, userId]);

  return (
    <DataContext.Provider
      value={{
        stepsData,
        tripsData,
        settings,
        isLoading,
        isSaving,
        lastSynced,
        syncStatus,
        importStepRecords,
        updateSettings,
        addStepsToday,
        refreshFromDrive,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
