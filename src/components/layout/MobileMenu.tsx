import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Layers, PanelLeftClose, Plus, Search, Star } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { MOBILE_MENU_EVENT, setMobileMenuOpen } from '../../lib/mobileNav';
import { useVisibleNav } from '../../hooks/useVisibleNav';
import { openCommandPalette } from '../../lib/navigation';
import { isFavorite, toggleFavorite } from '../../lib/places';
import { GERAL_EMPRESA_ID } from '../../lib/workspace';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { user, empresas, activeEmpresaId, setActiveEmpresa } = useAppStore();
  const { groups } = useVisibleNav();
  const navigate = useNavigate();
  const location = useLocation();
  const [favorite, setFavorite] = useState(() => isFavorite(location.pathname));

  const menuGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          label: t(item.key) || item.label,
        })),
      })),
    [groups, t]
  );

  const geral = activeEmpresaId === GERAL_EMPRESA_ID;
  const activeEmpresa = empresas.find((empresa) => empresa.id === activeEmpresaId) || null;

  useEffect(() => {
    const onState = (event: Event) => setOpen(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(MOBILE_MENU_EVENT, onState);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, onState);
  }, []);

  useEffect(() => {
    setFavorite(isFavorite(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setMobileMenuOpen(false);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        className={`mobile-drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3" style={{ borderColor: 'var(--border)' }}>
          <p className="px-2 text-lg font-semibold tracking-tight">Havk</p>
          <button type="button" className="drawer-close" aria-label="Recolher menu" onClick={close}>
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <button
            type="button"
            className="company-switch mx-1 mt-3 w-[calc(100%-0.5rem)] max-w-none"
            onClick={() => {
              close();
              navigate('/empresas');
            }}
          >
            {geral || !activeEmpresa ? (
              <span className="company-mark"><Layers size={16} /></span>
            ) : activeEmpresa.logo ? (
              <img src={activeEmpresa.logo} alt="" className="company-mark" />
            ) : (
              <span className="company-mark">{activeEmpresa.name.slice(0, 1).toUpperCase()}</span>
            )}
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{geral || !activeEmpresa ? 'Geral' : activeEmpresa.name}</span>
          </button>

          <div className="company-icon-row mt-2 flex gap-2 px-1 pb-1">
            <button
              type="button"
              className="company-mark shrink-0"
              style={geral ? { boxShadow: '0 0 0 2px var(--primary)' } : undefined}
              aria-label="Geral"
              onClick={() => {
                if (!geral) void setActiveEmpresa(GERAL_EMPRESA_ID);
              }}
            >
              <Layers size={16} />
            </button>
            {empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  type="button"
                  className="company-mark shrink-0"
                  style={empresa.id === activeEmpresa?.id ? { boxShadow: '0 0 0 2px var(--primary)' } : undefined}
                  aria-label={empresa.name}
                  onClick={() => {
                    if (empresa.id !== activeEmpresa?.id) void setActiveEmpresa(empresa.id);
                  }}
                >
                  {empresa.logo ? <img src={empresa.logo} alt="" className="h-full w-full object-cover" /> : empresa.name.slice(0, 1).toUpperCase()}
                </button>
              ))}
          </div>

          <button
            type="button"
            className="havk-field mx-1 mt-3 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-full px-3 py-2 text-left text-sm text-[var(--text-muted)]"
            onClick={() => {
              close();
              openCommandPalette();
            }}
          >
            <Search size={16} />
            Buscar
          </button>

          {menuGroups.map((group) => (
            <div key={group.id}>
              <p className="nav-group-label">{group.label}</p>
              <nav className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={close}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon size={18} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
              })}
            </nav>
          </div>
        ))}

          <div className="mt-4 space-y-1 border-t px-1 pt-3" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              className="sidebar-link w-full"
              aria-pressed={favorite}
              onClick={() => {
                toggleFavorite(location.pathname);
                setFavorite(isFavorite(location.pathname));
              }}
            >
              <Star size={18} className={favorite ? 'fill-current' : ''} />
              <span className="truncate">{favorite ? 'Nos favoritos' : 'Favoritar página'}</span>
            </button>
            <button
              type="button"
              className="sidebar-link w-full"
              onClick={() => {
                close();
                navigate('/demandas/nova');
              }}
            >
              <Plus size={18} />
              <span className="truncate">{t('novaDemanda')}</span>
            </button>
            <div className="flex items-center gap-3 px-2.5 py-2">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="company-mark">{initials}</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || 'Conta'}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Recolher menu"
          data-havk-overlay
          className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={close}
        />
      )}
    </>
  );
}
