interface RoundCheckProps {
  checked: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export default function RoundCheck({ checked, label, hint, disabled, onChange }: RoundCheckProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      className={`round-check${disabled ? ' is-disabled' : ''}`}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <span className={`round-check-dot ${checked ? 'is-on' : ''}`} aria-hidden="true" />
      <span className="min-w-0 text-left">
        <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
      </span>
    </button>
  );
}
