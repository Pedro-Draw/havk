interface RoundCheckProps {
  checked: boolean;
  label: string;
  hint?: string;
  onChange: (checked: boolean) => void;
}

export default function RoundCheck({ checked, label, hint, onChange }: RoundCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="round-check"
      onClick={() => onChange(!checked)}
    >
      <span className={`round-check-dot ${checked ? 'is-on' : ''}`} aria-hidden="true" />
      <span className="min-w-0 text-left">
        <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
      </span>
    </button>
  );
}
