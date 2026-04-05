import { Footprints } from 'lucide-react';
import { useData } from '../../context/DataContext';
import UserAvatar from '../auth/UserAvatar';

export default function MobileHeader() {
  const { syncStatus } = useData();
  const isSyncing = syncStatus === 'syncing';

  return (
    <div className="md:hidden flex items-center justify-between p-6 bg-black/80 backdrop-blur-xl border-b border-neutral-900 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
          <Footprints className="text-emerald-400" size={18} />
        </div>
        <h1 className="text-lg font-medium tracking-tight">
          stepsy<span className="text-emerald-400 font-bold">.live</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isSyncing
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                : syncStatus === 'synced'
                  ? 'bg-emerald-400'
                  : syncStatus === 'error'
                    ? 'bg-red-400'
                    : 'bg-neutral-600'
            }`}
          />
          <span className="text-[10px] font-mono text-neutral-500">
            {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'synced' ? 'Synced' : syncStatus === 'error' ? 'Error' : 'Idle'}
          </span>
        </div>
        <UserAvatar />
      </div>
    </div>
  );
}
