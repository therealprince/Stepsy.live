import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { isGoogleConfigured } from '../config/google';
import * as drive from '../services/drive';
import * as cache from '../db/local-cache';
import type { StepsData, TripsData, AppSettings, StepRecord } from '../types';
import { DEFAULT_SETTINGS } from '../config/google';

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
const EMPTY_SETTINGS: AppSettings = { ...DEFAULT_SETTINGS } as AppSettings;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [stepsData, setStepsData] = useState<StepsData>(EMPTY_STEPS);
  const [tripsData, setTripsData] = useState<TripsData>(EMPTY_TRIPS);
  const [settings, setSettings] = useState<AppSettings>(EMPTY_SETTINGS);
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

  const useDrive = isGoogleConfigured() && isSignedIn;

  // Load data on sign-in
  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  const loadData = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      // Try cache first
      const cachedSteps = await cache.getCachedSteps();
      const cachedSettings = await cache.getCachedSettings();

      if (cachedSteps && cache.isCacheFresh(cachedSteps)) {
        setStepsData(cachedSteps.data);
        fileIds.current.steps = cachedSteps.driveFileId;
      }
      if (cachedSettings && cache.isCacheFresh(cachedSettings)) {
        setSettings(cachedSettings.data);
        fileIds.current.settings = cachedSettings.driveFileId;
      }

      // Fetch from Drive if configured
      if (useDrive) {
        try {
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

          // Update cache
          await Promise.all([
            cache.setCachedSteps(stepsResult.data, stepsResult.id),
            cache.setCachedTrips(tripsResult.data, tripsResult.id),
            cache.setCachedSettings(settingsResult.data, settingsResult.id),
          ]);

          setLastSynced(new Date());
          setSyncStatus('synced');
        } catch (err) {
          console.error('Drive sync failed:', err);
          setSyncStatus('error');
        }
      } else {
        // Demo mode — load from cache only
        if (cachedSteps) setStepsData(cachedSteps.data);
        if (cachedSettings) setSettings(cachedSettings.data);
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('Load data failed:', err);
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
        // Merge with existing: newer entries overwrite
        const existingMap = new Map(stepsData.records.map((r) => [r.date, r]));
        for (const rec of records) {
          existingMap.set(rec.date, rec);
        }

        const merged: StepsData = {
          version: 1,
          records: Array.from(existingMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        };

        setStepsData(merged);
        await cache.setCachedSteps(merged, fileIds.current.steps);

        // Write to Drive
        if (useDrive && fileIds.current.steps) {
          await drive.writeSteps(fileIds.current.steps, merged);
        }

        setLastSynced(new Date());
        setSyncStatus('synced');
        return records.length;
      } catch (err) {
        console.error('Import failed:', err);
        setSyncStatus('error');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [stepsData, useDrive]
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      await cache.setCachedSettings(updated, fileIds.current.settings);

      if (useDrive && fileIds.current.settings) {
        await drive.writeSettings(fileIds.current.settings, updated);
      }
    },
    [settings, useDrive]
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

        // Fire-and-forget cache update
        cache.setCachedSteps(updated, fileIds.current.steps);
        return updated;
      });
    },
    []
  );

  const refreshFromDrive = useCallback(async () => {
    if (!useDrive) return;
    await loadData();
  }, [useDrive]);

  const clearAllData = useCallback(async () => {
    const empty = { ...EMPTY_STEPS };
    setStepsData(empty);
    await cache.setCachedSteps(empty, fileIds.current.steps);

    if (useDrive && fileIds.current.steps) {
      await drive.writeSteps(fileIds.current.steps, empty);
    }
  }, [useDrive]);

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
