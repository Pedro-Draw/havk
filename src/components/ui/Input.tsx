import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, fullWidth = true, leadingIcon, trailingIcon, className, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {leadingIcon}
          </div>
        )}

        <input
          {...props}
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'havk-field px-3 py-2.5 text-base sm:text-sm',
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-11',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
        />

        {trailingIcon && <div className="absolute inset-y-0 right-3 flex items-center">{trailingIcon}</div>}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
