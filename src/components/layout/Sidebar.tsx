import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useVisibleNav } from '../../hooks/useVisibleNav';
import IconButton from '../ui/IconButton';

const STORAGE_KEY = 'havk-sidebar-collapsed';

if (typeof document !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') {
  document.documentElement.dataset.sidebar = 'collapsed';
}

export default function Sidebar() {
  const { t } = useTranslation();
  const { groups } = useVisibleNav();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <aside
      className="glass-bar fixed inset-y-0 left-0 z-40 hidden h-dvh flex-col border-r lg:flex"
      style={{ width: 'var(--sidebar-w)', background: 'var(--sidebar)' }}
      aria-label="Menu lateral"
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3" style={{ borderColor: 'var(--border)' }}>
        <Link to="/" className="truncate px-2 text-lg font-semibold tracking-tight" title="Havk">
          {collapsed ? 'H' : 'Havk'}
        </Link>
        <IconButton label={collapsed ? 'Expandir menu' : 'Recolher menu'} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </IconButton>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto px-2 pb-6">
        {groups.map((group) => (
          <div key={group.id}>
            {!collapsed && <p className="nav-group-label">{group.label}</p>}
            {collapsed && <div className="h-3" />}
            <nav className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.key) || item.label;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={label}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                  >
                    <Icon size={18} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
