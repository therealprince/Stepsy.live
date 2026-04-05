import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  iconColor: string;     // e.g. 'text-orange-500'
  bgColor: string;       // e.g. 'bg-orange-500/10'
  borderColor: string;   // e.g. 'border-orange-500/20'
  label: string;
  value: string | number;
  unit: string;
}

export default function MetricCard({ icon: Icon, iconColor, bgColor, borderColor, label, value, unit }: Props) {
  return (
    <div className="md:col-span-4 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex items-center gap-5 hover:border-neutral-800 transition-colors">
      <div
        className={`w-12 h-12 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center shrink-0`}
      >
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-sm text-neutral-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}
