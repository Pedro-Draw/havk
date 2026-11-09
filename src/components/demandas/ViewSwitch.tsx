import { Link, useLocation } from 'react-router-dom';
import { Calendar, KanbanSquare, List } from 'lucide-react';

const views = [
  { to: '/demandas', label: 'Lista', icon: List },
  { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
];

export default function ViewSwitch() {
  const { pathname } = useLocation();

  return (
    <div className="view-switch" role="tablist" aria-label="Visualização das demandas">
      {views.map((view) => {
        const active = pathname === view.to;
        const Icon = view.icon;
        return (
          <Link
            key={view.to}
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
