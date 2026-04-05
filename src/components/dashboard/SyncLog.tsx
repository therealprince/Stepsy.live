import { Clock } from 'lucide-react';

interface Props {
  isSyncing: boolean;
  lastSync: Date;
  lastStepDelta: number;
  formatTime: (date: Date) => string;
}

export default function SyncLog({ isSyncing, lastSync, lastStepDelta, formatTime }: Props) {
  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} /> Sync Log
        </h3>
      </div>
      <div className="flex-1 relative font-mono">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-neutral-800 to-transparent" />
        <div className="space-y-6 relative z-10">
          <div className="flex gap-4">
            <div className="mt-1 relative shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center bg-black border ${
                  isSyncing ? 'border-emerald-500/50' : 'border-neutral-800'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSyncing
                      ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-neutral-600'
                  }`}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-white">Listening...</p>
              <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">/api/sync-steps</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1 shrink-0">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black border border-neutral-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-300">Payload Received</p>
              <p className="text-xs text-emerald-400 mt-1.5">+{lastStepDelta} steps</p>
              <p className="text-[10px] text-neutral-600 mt-1">{formatTime(lastSync)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
