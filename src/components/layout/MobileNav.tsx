import { TrendingUp, MapPin, Trophy, Settings } from 'lucide-react';
import type { TabId } from '../../types';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const NAV_ITEMS: { id: TabId; icon: typeof TrendingUp; label: string }[] = [
  { id: 'dashboard', icon: TrendingUp, label: 'Dash' },
  { id: 'history', icon: MapPin, label: 'Routes' },
  { id: 'achievements', icon: Trophy, label: 'Goals' },
  { id: 'settings', icon: Settings, label: 'Menu' },
];

export default function MobileNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-black/90 backdrop-blur-xl border-t border-neutral-900 flex justify-around p-4 z-50 pb-safe">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === item.id ? 'text-emerald-400' : 'text-neutral-500 hover:text-white'
          }`}
        >
          <item.icon size={20} />
          <span className="text-[9px] font-medium uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
