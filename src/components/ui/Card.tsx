import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: ReactNode;
  hoverable?: boolean;
}

export default function Card({
  title,
  description,
  children,
  footer,
  hoverable = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all',
        hoverable && 'hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="border-b border-zinc-800 p-3 sm:p-6">
          {title && <h3 className="text-sm font-semibold text-white sm:text-lg">{title}</h3>}
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
      )}

      <div className="p-3 sm:p-6">{children}</div>

      {footer && (
        <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:px-6 sm:py-4">
          {footer}
        </div>
      )}
    </div>
  );
}