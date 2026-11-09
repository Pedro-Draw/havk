import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

export default function PasswordField({ value, onChange, autoComplete = 'new-password', placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="havk-field w-full rounded-2xl px-3 py-3 pr-14"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className={`password-toggle${visible ? ' is-on' : ''}`}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
