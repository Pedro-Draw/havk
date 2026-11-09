import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'glass-button inline-flex items-center justify-center rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'glass-button-primary',
    secondary: 'glass-button-secondary',
    outline: 'glass-button-outline',
    ghost: 'glass-button-ghost',
    destructive: 'border-transparent bg-red-600 text-white shadow-none hover:bg-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'gap-2 px-4 py-2.5 text-sm sm:px-5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', loading && 'cursor-wait', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <>
          {icon}
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
