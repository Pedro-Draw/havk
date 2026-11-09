import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: ReactNode;
  hoverable?: boolean;
}

export default function Card({ title, description, children, footer, hoverable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'havk-card overflow-hidden rounded-2xl border shadow-sm transition-colors duration-200',
        hoverable && 'hover:-translate-y-0.5 hover:border-zinc-600',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="border-b px-4 py-4 sm:px-5" style={{ borderColor: 'var(--border)' }}>
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          {description && <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
        </div>
      )}

      <div className="p-4 sm:p-5">{children}</div>

      {footer && (
        <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border)', background: 'var(--card-elevated)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
