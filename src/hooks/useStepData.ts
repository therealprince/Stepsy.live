// Hook to derive dashboard metrics from step data
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { WeeklyBarData } from '../types';

export function useStepData() {
  const { stepsData, settings } = useData();
  const goal = settings.dailyGoal;

  const today = new Date().toISOString().split('T')[0];

  const todaySteps = useMemo(() => {
    const rec = stepsData.records.find((r) => r.date === today);
    return rec?.steps ?? 0;
  }, [stepsData.records, today]);

  const weeklyData = useMemo((): WeeklyBarData[] => {
    const days: WeeklyBarData[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const rec = stepsData.records.find((r) => r.date === dateStr);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        steps: rec?.steps ?? 0,
      });
    }
    return days;
  }, [stepsData.records]);

  const calories = Math.round(todaySteps * 0.045);
  const distance = (todaySteps * 0.000762).toFixed(2);
  const progressPercent = Math.min((todaySteps / goal) * 100, 100);
  const activeMinutes = Math.floor(todaySteps / 110);

  // Total stats
  const totalSteps = useMemo(
    () => stepsData.records.reduce((sum, r) => sum + r.steps, 0),
    [stepsData.records]
  );
  const totalDays = stepsData.records.length;
  const avgSteps = totalDays > 0 ? Math.round(totalSteps / totalDays) : 0;
  const bestDay = useMemo(() => {
    if (stepsData.records.length === 0) return 0;
    return Math.max(...stepsData.records.map((r) => r.steps));
  }, [stepsData.records]);

  return {
    todaySteps,
    weeklyData,
    calories,
    distance,
    progressPercent,
    activeMinutes,
    goal,
    totalSteps,
    totalDays,
    avgSteps,
    bestDay,
  };
}
