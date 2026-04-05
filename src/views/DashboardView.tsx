import { Smartphone, RefreshCw, Flame, Map, Timer } from 'lucide-react';
import { useStepData } from '../hooks/useStepData';
import { useLiveSync } from '../hooks/useLiveSync';
import StepCounter from '../components/dashboard/StepCounter';
import LivePaceCard from '../components/dashboard/LivePaceCard';
import MetricCard from '../components/dashboard/MetricCard';
import WeeklyTrend from '../components/dashboard/WeeklyTrend';
import SyncLog from '../components/dashboard/SyncLog';

export default function DashboardView() {
  const { todaySteps, weeklyData, calories, distance, progressPercent, activeMinutes, goal } = useStepData();
  const { isSyncing, lastSync, currentPace, intensityData, lastStepDelta, formatTime } = useLiveSync();

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-4">
            <Smartphone size={14} /> Device Sync Active
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white">
            Daily <span className="font-semibold">Overview</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-0.5">Last updated</p>
            <p className="text-sm font-mono text-neutral-300">{formatTime(lastSync)}</p>
          </div>
          <div
            className={`p-3 rounded-full border ${
              isSyncing
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-neutral-800 bg-neutral-900/50 text-neutral-500'
            }`}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
        <StepCounter todaySteps={todaySteps} goal={goal} progressPercent={progressPercent} />
        <LivePaceCard currentPace={currentPace} intensityData={intensityData} />

        <MetricCard
          icon={Flame}
          iconColor="text-orange-500"
          bgColor="bg-orange-500/10"
          borderColor="border-orange-500/20"
          label="Calories"
          value={calories}
          unit="kcal"
        />
        <MetricCard
          icon={Map}
          iconColor="text-blue-500"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
          label="Distance"
          value={distance}
          unit="km"
        />
        <MetricCard
          icon={Timer}
          iconColor="text-indigo-400"
          bgColor="bg-indigo-500/10"
          borderColor="border-indigo-500/20"
          label="Active Time"
          value={activeMinutes}
          unit="mins"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <WeeklyTrend data={weeklyData} goal={goal} />
        <SyncLog
          isSyncing={isSyncing}
          lastSync={lastSync}
          lastStepDelta={lastStepDelta}
          formatTime={formatTime}
        />
      </div>
    </div>
  );
}
