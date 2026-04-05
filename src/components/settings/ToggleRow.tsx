interface Props {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function ToggleRow({ label, description, enabled, onChange, disabled = false }: Props) {
  return (
    <div
      className={`bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex items-center justify-between ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <div>
        <h4 className="text-white font-medium mb-1">{label}</h4>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
          enabled
            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
            : 'bg-neutral-800'
        }`}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
            enabled ? 'right-1 bg-white' : 'left-1 bg-neutral-500'
          }`}
        />
      </button>
    </div>
  );
}
