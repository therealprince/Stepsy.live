import { Navigation } from 'lucide-react';

interface Props {
  routePath: string;
}

export default function FuturisticMap({ routePath }: Props) {
  // Parse start and end points from path
  let startX = '50', startY = '250', endX = '350', endY = '80';
  try {
    const parts = routePath.trim().split(/[\s,]+/);
    // Find first coordinate pair after M
    if (parts.length >= 3) {
      startX = parts[1]?.split(',')[0] || startX;
      startY = parts[1]?.split(',')[1] || parts[2] || startY;
    }
    const lastPart = parts[parts.length - 1];
    if (lastPart?.includes(',')) {
      endX = lastPart.split(',')[0];
      endY = lastPart.split(',')[1];
    } else if (parts.length >= 2) {
      endX = parts[parts.length - 2]?.includes(',')
        ? parts[parts.length - 1]?.split(',')[0] || endX
        : parts[parts.length - 2] || endX;
      endY = parts[parts.length - 1] || endY;
    }
  } catch {
    // Use defaults
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-neutral-950 rounded-2xl relative overflow-hidden border border-neutral-900">
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ade80" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Route */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d={routePath} fill="none" stroke="#34d399" strokeWidth="6" className="opacity-20" strokeLinecap="round" strokeLinejoin="round" />
        <path d={routePath} fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="6 4" className="animate-dash" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={startX} cy={startY} r="6" fill="#000" stroke="#fff" strokeWidth="2" />
        <circle cx={endX} cy={endY} r="6" fill="#34d399" stroke="#000" strokeWidth="2" className="animate-pulse" />
      </svg>

      {/* GPS badge */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/60 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
          <Navigation size={12} /> GPS Active
        </div>
      </div>
    </div>
  );
}
