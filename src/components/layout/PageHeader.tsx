import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ icon, title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="page-header-icon">{icon}</div>}
        <div className="min-w-0">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {meta && <div className="mt-2 text-xs text-zinc-500">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </header>
  );
}
