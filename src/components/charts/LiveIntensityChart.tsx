interface Props {
  data: number[];
}

export default function LiveIntensityChart({ data }: Props) {
  const max = Math.max(...data, 15);
  const points = data
    .map((d, i) => `${i * (100 / (data.length - 1 || 1))},${100 - (d / max) * 100}`)
    .join(' L ');

  return (
    <div className="w-full h-16 mt-4 relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="intensity-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d={`M 0,100 L ${points} L 100,100`} fill="url(#intensity-gradient)" className="opacity-20" />
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.4))' }}
        />
      </svg>
    </div>
  );
}
