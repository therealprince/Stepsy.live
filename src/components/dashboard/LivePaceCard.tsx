import { Zap } from 'lucide-react';
import LiveIntensityChart from '../charts/LiveIntensityChart';

interface Props {
  currentPace: number;
  intensityData: number[];
}

export default function LivePaceCard({ currentPace, intensityData }: Props) {
  return (
    <div className="md:col-span-4 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden hover:border-neutral-800 transition-colors">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> LIVE PACE
          </h3>
          <div
            className={`w-2 h-2 rounded-full ${
              currentPace > 0
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-neutral-800'
            }`}
          />
        </div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tighter tabular-nums">{currentPace}</span>
          <span className="text-sm text-neutral-500 font-medium">steps/min</span>
        </div>
      </div>
      <div className="mt-4">
        <LiveIntensityChart data={intensityData} />
      </div>
    </div>
  );
}
