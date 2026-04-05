import type { WeeklyBarData } from '../../types';

interface Props {
  data: WeeklyBarData[];
  goal: number;
}

export default function WeeklyBarChart({ data, goal }: Props) {
  const maxSteps = Math.max(...data.map((d) => d.steps), goal);

  return (
    <div className="w-full h-48 flex items-end justify-between gap-3 pt-4">
      {data.map((item, index) => {
        const heightPercent = maxSteps > 0 ? (item.steps / maxSteps) * 100 : 0;
        const isToday = index === data.length - 1;
        const reachedGoal = item.steps >= goal;

        return (
          <div key={item.date} className="flex flex-col items-center flex-1 group relative">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-white bg-neutral-800 px-2 py-1 rounded mb-2 absolute -top-8 pointer-events-none whitespace-nowrap z-10">
              {item.steps.toLocaleString()}
            </div>
            <div className="w-full max-w-[12px] h-full bg-neutral-900/50 rounded-full relative flex items-end justify-center overflow-hidden">
              <div
                className={`w-full rounded-full transition-all duration-1000 ease-out ${
                  isToday
                    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : reachedGoal
                      ? 'bg-white/40'
                      : 'bg-neutral-800'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
            </div>
            <span
              className={`text-[10px] mt-4 uppercase tracking-wider ${
                isToday ? 'text-emerald-400 font-bold' : 'text-neutral-500'
              }`}
            >
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}
