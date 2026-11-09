
import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, ChevronRight, ChevronLeft, PanelLeftClose } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MOBILE_MENU_EVENT, PRIMARY_ROUTES, screenParent, setMobileMenuOpen } from '../../lib/mobileNav';
import { openCommandPalette } from '../../lib/navigation';
import { useAuth } from '../../hooks/useAuth';
import CompanySwitch from './CompanySwitch';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSubscreen = !PRIMARY_ROUTES.has(location.pathname);

  const user = useAppStore((state) => state.user);
  const notifications = useAppStore((state) => state.notifications || []);
  const updateNotification = useAppStore((state) => state.updateNotification);

  const { t } = useTranslation();
  const { signOut } = useAuth();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onState = (event: Event) => {
      setShowMobileMenu(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener(MOBILE_MENU_EVENT, onState);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, onState);
  }, []);

  const handleLeadingButton = () => {
    setMobileMenuOpen(!showMobileMenu);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    if (updateNotification) {
      updateNotification(id, { read: true });
    }
  };

  return (
    <header className="glass-bar z-30">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 lg:h-16 lg:gap-3 lg:px-5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleLeadingButton}
          className="glass-icon lg:hidden"
          aria-label={showMobileMenu ? 'Recolher menu' : t('mobileMenu.abrirMenu')}
          aria-expanded={showMobileMenu}
        >
          {showMobileMenu ? <PanelLeftClose size={18} /> : <Menu size={18} />}
        </button>
        {isSubscreen && (
          <button
            type="button"
            className="glass-icon lg:hidden"
            aria-label="Voltar"
            onClick={() => navigate(screenParent(location.pathname))}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <Link
          to="/"
          className="text-base font-semibold tracking-tight lg:hidden"
        >
          Havk
        </Link>
      </div>

      <div className="hidden min-w-0 justify-center lg:flex">
        <button
          type="button"
          className="havk-field flex w-full max-w-xl items-center gap-2 rounded-full px-4 py-2 text-left text-sm text-[var(--text-muted)]"
          onClick={openCommandPalette}
        >
          <Search size={16} />
          <span className="flex-1">Buscar</span>
          <span className="text-xs">⌘K</span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-1.5 lg:gap-2">
        <div className="hidden lg:block">
          <CompanySwitch />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="glass-icon relative"
            aria-label="Notificações"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1 min-w-[18px] h-5
                bg-red-500 text-white text-[10px] font-bold
                rounded-full flex items-center justify-center px-1.5
                ring-2 ring-zinc-950
              ">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de notificações */}
          {showNotifications && (
            <div
              ref={notificationRef}
              className="glass-popover overlay-scroll absolute right-0 z-50 mt-3 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <h3 className="text-base font-semibold">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 max-h-[55vh] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications
                    .slice()
                    .reverse()
                    .map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) {
                            handleMarkRead(n.id);
                          }
                          setShowNotifications(false);
                        }}
                        className={`cursor-pointer rounded-lg p-3 text-sm ${n.read ? 'hover:bg-[var(--hover)]' : 'border-l-4 bg-[var(--hover)]'}`}
                        style={n.read ? undefined : { borderColor: 'var(--primary)' }}
                      >
                        <div className="font-medium">{n.title || 'Notificação'}</div>
                        <p className="mt-0.5 line-clamp-2 text-[var(--text-secondary)]">{n.message}</p>
                        <span className="mt-1.5 block text-xs text-[var(--text-muted)]">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                    Nenhuma notificação no momento
                  </div>
                )}
              </div>

              {/* Rodapé com link para Inbox */}
              <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/inbox');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--hover)]"
                >
                  Ver todas as notificações
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
        <button
          type="button"
          onClick={() => setShowProfile((value) => !value)}
          className="glass-icon h-9 w-9 overflow-hidden"
          aria-label="Menu do perfil"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-zinc-700"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--hover)] text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </span>
          )}
        </button>
        {showProfile && (
          <div className="glass-popover absolute right-0 z-50 mt-2 w-48 rounded-xl p-1">
            <Link to="/configuracoes" className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--hover)]" onClick={() => setShowProfile(false)}>
              Configurações
            </Link>
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--hover)]" onClick={() => signOut()}>
              Sair
            </button>
          </div>
        )}
        </div>
      </div>
      </div>
    </header>
  );
}
