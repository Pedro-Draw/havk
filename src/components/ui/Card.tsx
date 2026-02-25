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
        <div className="p-6 border-b border-zinc-800">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          {footer}
        </div>
      )}
    </div>
  );
}