import { Activity } from 'lucide-react';

interface Props {
  todaySteps: number;
  goal: number;
  progressPercent: number;
}

export default function StepCounter({ todaySteps, goal, progressPercent }: Props) {
  return (
    <div className="md:col-span-8 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:p-8 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/30 transition-colors duration-500">
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none translate-x-1/2 translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" /> TOTAL STEPS
          </h3>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-6xl sm:text-7xl font-semibold tracking-tighter text-white tabular-nums">
              {todaySteps.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-neutral-500 mb-1">GOAL</p>
          <p className="text-xl font-mono text-neutral-300">{goal.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-12 relative z-10">
        <div className="flex justify-between text-xs text-neutral-400 mb-3 font-mono">
          <span>{progressPercent.toFixed(1)}%</span>
          <span className="text-emerald-400">
            {Math.max(0, goal - todaySteps).toLocaleString()} left
          </span>
        </div>
        <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-700 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
