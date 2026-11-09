import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  options: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, icon, options, className = '', id, ...props },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('havk-field appearance-none px-3 py-2.5 pr-8 text-sm', icon && 'pl-10', className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
