import {
  TrendingUp,
  MapPin,
  Trophy,
  Settings,
  Footprints,
} from 'lucide-react';
import type { TabId } from '../../types';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const NAV_ITEMS: { id: TabId; icon: typeof TrendingUp; label: string }[] = [
  { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
  { id: 'history', icon: MapPin, label: 'Trips & Routes' },
  { id: 'achievements', icon: Trophy, label: 'Achievements' },
];

export default function Sidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside className="w-20 lg:w-64 border-r border-neutral-900 hidden md:flex flex-col justify-between h-screen sticky top-0 bg-neutral-950/30 backdrop-blur-xl z-20">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 justify-center lg:justify-start">
          <div className="w-8 h-8 rounded flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Footprints className="text-emerald-400" size={18} />
          </div>
          <h1 className="text-xl font-medium tracking-tight hidden lg:block">
            stepsy<span className="text-emerald-400 font-bold">.live</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-2 lg:px-4 py-3 rounded-lg transition-all group ${
                activeTab === item.id
                  ? 'text-emerald-400 lg:bg-emerald-500/10 lg:border lg:border-emerald-500/20'
                  : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <item.icon
                size={22}
                className={`mx-auto lg:mx-0 ${activeTab !== item.id && 'group-hover:scale-110 transition-transform'}`}
              />
              <span className="font-medium hidden lg:block text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings at bottom */}
      <div className="p-6">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-4 px-2 lg:px-4 py-3 rounded-lg transition-all group ${
            activeTab === 'settings'
              ? 'text-emerald-400 lg:bg-emerald-500/10 lg:border lg:border-emerald-500/20'
              : 'text-neutral-500 hover:text-neutral-200'
          }`}
        >
          <Settings
            size={22}
            className={`mx-auto lg:mx-0 ${activeTab !== 'settings' && 'group-hover:scale-110 transition-transform'}`}
          />
          <span className="font-medium hidden lg:block text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
