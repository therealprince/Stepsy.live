import { ChevronRight } from 'lucide-react';
import WeeklyBarChart from '../charts/WeeklyBarChart';
import type { WeeklyBarData } from '../../types';

interface Props {
  data: WeeklyBarData[];
  goal: number;
}

export default function WeeklyTrend({ data, goal }: Props) {
  return (
    <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">7-Day Trend</h3>
        <button className="text-xs font-mono text-neutral-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest border border-neutral-800 px-3 py-1.5 rounded-full">
          Report <ChevronRight size={14} />
        </button>
      </div>
      <WeeklyBarChart data={data} goal={goal} />
    </div>
  );
}
