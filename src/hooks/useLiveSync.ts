// Simulates live step data coming from a pedometer / phone sync
import { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';

export function useLiveSync() {
  const { addStepsToday } = useData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [currentPace, setCurrentPace] = useState(0);
  const [intensityData, setIntensityData] = useState<number[]>(Array(20).fill(0));
  const [lastStepDelta, setLastStepDelta] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsSyncing(true);

      setTimeout(() => {
        const newSteps = Math.floor(Math.random() * 15) + 3;
        const simulatedPace = newSteps * (60 / 8);

        addStepsToday(newSteps);
        setIntensityData((prev) => [...prev.slice(1), newSteps]);
        setCurrentPace(Math.round(simulatedPace));
        setLastSync(new Date());
        setLastStepDelta(newSteps);
        setIsSyncing(false);
      }, 800);
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [addStepsToday]);

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
  };
}
