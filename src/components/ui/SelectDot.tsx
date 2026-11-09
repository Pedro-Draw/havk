import { Check } from 'lucide-react';

interface SelectDotProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

export default function SelectDot({ checked, onChange, label }: SelectDotProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || (checked ? 'Selecionado' : 'Selecionar')}
      className={`select-dot${checked ? ' is-on' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </button>
  );
}
