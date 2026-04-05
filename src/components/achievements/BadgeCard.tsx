import { Award, Route as RouteIcon, Crosshair, Flame, Trophy, Zap } from 'lucide-react';
import type { BadgeDefinition } from '../../types';

const ICON_MAP: Record<string, typeof Award> = {
  award: Award,
  route: RouteIcon,
  crosshair: Crosshair,
  flame: Flame,
  trophy: Trophy,
  zap: Zap,
};

const COLOR_MAP: Record<string, { text: string; bg: string; border: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

interface Props {
  badge: BadgeDefinition;
}

export default function BadgeCard({ badge }: Props) {
  const Icon = ICON_MAP[badge.icon] || Award;
  const colors = COLOR_MAP[badge.color] || COLOR_MAP.emerald;

  if (badge.status === 'unlocked') {
    return (
      <div className={`bg-neutral-950 border ${colors.border} rounded-3xl p-6 relative overflow-hidden group`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 ${colors.bg} rounded-full blur-xl`} />
        <div className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(52,211,153,0.2)]`}>
          <Icon className={colors.text} size={28} />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">{badge.title}</h3>
        <p className="text-sm text-neutral-400 mb-6">{badge.description}</p>
        <div className={`text-[10px] font-mono ${colors.text} ${colors.bg} px-3 py-1 rounded-full inline-block`}>
          UNLOCKED • {badge.unlockedDate}
        </div>
      </div>
    );
  }

  if (badge.status === 'in-progress') {
    return (
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
          <Icon className={colors.text} size={28} />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">{badge.title}</h3>
        <p className="text-sm text-neutral-400 mb-6">{badge.description}</p>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-neutral-500 mb-2">
            <span>{badge.progressLabel}</span>
            <span>{badge.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
            <div className={`h-full bg-blue-500`} style={{ width: `${badge.progress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Locked
  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
        <Icon className={colors.text} size={28} />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{badge.title}</h3>
      <p className="text-sm text-neutral-400 mb-6">{badge.description}</p>
      <div className="text-[10px] font-mono text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full inline-block">
        LOCKED
      </div>
    </div>
  );
}
