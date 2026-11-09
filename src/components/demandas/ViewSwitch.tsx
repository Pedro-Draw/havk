import { Link, useLocation } from 'react-router-dom';
import { KanbanSquare, List } from 'lucide-react';

const views = [
  { id: 'lista' as const, to: '/demandas', label: 'Lista', icon: List },
  { id: 'kanban' as const, to: '/kanban', label: 'Kanban', icon: KanbanSquare },
];

export default function ViewSwitch({
  mode,
  onMode,
}: {
  mode?: 'kanban' | 'lista';
  onMode?: (mode: 'kanban' | 'lista') => void;
}) {
  const { pathname } = useLocation();

  return (
    <div className="view-switch" role="tablist" aria-label="Visualização das demandas">
      {views.map((view) => {
        const Icon = view.icon;
        const active = onMode ? mode === view.id : pathname === view.to;
        if (onMode) {
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'is-active' : undefined}
              onClick={() => onMode(view.id)}
            >
              <Icon size={15} />
              {view.label}
            </button>
          );
        }
        return (
          <Link
            key={view.id}
            to={view.to}
            role="tab"
            aria-selected={active}
            className={active ? 'is-active' : undefined}
          >
            <Icon size={15} />
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
