import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="grid min-h-48 place-items-center gap-3 text-sm text-[var(--text-muted)]">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorState({ title = 'Não foi possível carregar', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-48 place-items-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {onRetry && (
        <button type="button" className="glass-button glass-button-primary rounded-xl px-4 py-2 text-sm" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="grid min-h-48 place-items-center gap-3 px-4 py-8 text-center">
      {icon && <div className="text-[var(--text-muted)]">{icon}</div>}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  );
}
