// src/components/ui/Select.tsx
import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options, className = "", ...props }, ref) => {
    return (
      <div className={`space-y-1 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full rounded-md border border-zinc-700 bg-zinc-900 
              text-zinc-100 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              disabled:opacity-60
              ${icon ? "pl-10" : "pl-3"}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;