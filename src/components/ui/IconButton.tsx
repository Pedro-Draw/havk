import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export default function IconButton({ label, className, type = 'button', children, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn('glass-icon', className)}
      {...props}
    >
      {children}
    </button>
  );
}
