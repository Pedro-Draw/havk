import React, {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
} from 'react';
import { cn } from '../../utils/cn';

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      fullWidth = true,
      leadingIcon,
      trailingIcon,
      className,
      id,
      ...props
    },
    ref
  ) {
    // Gera ID automático se não vier
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leadingIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
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
              'w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:px-4 sm:py-2.5 sm:text-sm',
              leadingIcon && 'pl-12',
              trailingIcon && 'pr-12',
              error && 'border-red-600 focus:border-red-600 focus:ring-red-600/30',
              className
            )}
          />

          {trailingIcon && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              {trailingIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-500"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;