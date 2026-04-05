import { useMemo } from 'react';
import BadgeCard from '../components/achievements/BadgeCard';
import { useStepData } from '../hooks/useStepData';
import type { BadgeDefinition } from '../types';

export default function AchievementsView() {
  const { bestDay, totalSteps, totalDays } = useStepData();

  const badges = useMemo((): BadgeDefinition[] => {
    const totalKm = totalSteps * 0.000762;
    const weeklyKm = totalDays >= 7 ? (totalSteps / totalDays) * 7 * 0.000762 : 0;

    return [
      {
        id: '10k-vanguard',
        title: '10K Vanguard',
        description: 'Hit 10,000 steps in a single day.',
        icon: 'award',
        color: 'emerald',
        status: bestDay >= 10000 ? 'unlocked' : bestDay > 0 ? 'in-progress' : 'locked',
        progress: Math.min(Math.round((bestDay / 10000) * 100), 100),
        progressLabel: `${bestDay.toLocaleString()} / 10,000`,
        unlockedDate: bestDay >= 10000 ? 'ACHIEVED' : undefined,
      },
      {
        id: 'marathoner',
        title: 'Marathoner',
        description: 'Walk 42km in a single week.',
        icon: 'route',
        color: 'blue',
        status: weeklyKm >= 42 ? 'unlocked' : weeklyKm > 0 ? 'in-progress' : 'locked',
        progress: Math.min(Math.round((weeklyKm / 42) * 100), 100),
        progressLabel: `${weeklyKm.toFixed(1)}km / 42km`,
        unlockedDate: weeklyKm >= 42 ? 'ACHIEVED' : undefined,
      },
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Walk 5,000 steps between 10PM and 2AM.',
        icon: 'crosshair',
        color: 'rose',
        status: 'locked',
      },
      {
        id: 'streak-master',
        title: 'Streak Master',
        description: 'Hit your daily goal 7 days in a row.',
        icon: 'flame',
        color: 'amber',
        status: totalDays >= 7 ? 'in-progress' : 'locked',
        progress: Math.min(Math.round((totalDays / 7) * 100), 100),
        progressLabel: `${Math.min(totalDays, 7)} / 7 days`,
      },
      {
        id: 'explorer',
        title: 'Explorer',
        description: 'Walk a total of 100km across all trips.',
        icon: 'route',
        color: 'purple',
        status: totalKm >= 100 ? 'unlocked' : totalKm > 0 ? 'in-progress' : 'locked',
        progress: Math.min(Math.round((totalKm / 100) * 100), 100),
        progressLabel: `${totalKm.toFixed(1)}km / 100km`,
        unlockedDate: totalKm >= 100 ? 'ACHIEVED' : undefined,
      },
      {
        id: 'centurion',
        title: 'Centurion',
        description: 'Track steps for 100 days.',
        icon: 'trophy',
        color: 'emerald',
        status: totalDays >= 100 ? 'unlocked' : totalDays > 0 ? 'in-progress' : 'locked',
        progress: Math.min(Math.round((totalDays / 100) * 100), 100),
        progressLabel: `${totalDays} / 100 days`,
        unlockedDate: totalDays >= 100 ? 'ACHIEVED' : undefined,
      },
    ];
  }, [bestDay, totalSteps, totalDays]);

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">
          Milestones & <span className="font-semibold">Badges</span>
        </h2>
        <p className="text-sm text-neutral-400">
          Unlock futuristic badges by keeping your streak alive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}
