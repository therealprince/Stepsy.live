// Live sync hook — connects to real data sources when available
// Only simulates fake steps in demo mode; real users see actual drive data
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useLiveSync() {
  const { isDemoMode } = useAuth();
  const [isSyncing] = useState(false);
  const [lastSync] = useState(new Date());
  const [currentPace] = useState(0);
  const [intensityData] = useState<number[]>(Array(20).fill(0));
  const [lastStepDelta] = useState(0);

  // In production: real step data comes from CSV import + Drive sync.
  // The live sync simulation is disabled for real users to prevent fake data
  // from polluting their actual step records.
  //
  // Future: when a real pedometer/phone sync API is connected,
  // this hook will be the integration point.

  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  return {
    isSyncing,
    lastSync,
    currentPace,
    intensityData,
    lastStepDelta,
    formatTime,
    isDemoMode,
  };
}
