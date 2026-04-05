import { LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserAvatar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
      >
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <User size={14} className="text-neutral-400" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-neutral-900 border border-neutral-800 rounded-xl p-4 min-w-[200px] shadow-2xl z-50 animate-in">
          <div className="mb-3 pb-3 border-b border-neutral-800">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 text-sm text-red-400/80 hover:text-red-400 transition-colors py-1"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
