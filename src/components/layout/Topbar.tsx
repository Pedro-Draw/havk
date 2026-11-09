
import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Search, Menu, ChevronRight, ChevronLeft, Command, Star, PanelLeftClose } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import ThemeToggle from '../common/ThemeToggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { MOBILE_MENU_EVENT, PRIMARY_ROUTES, screenParent, setMobileMenuOpen } from '../../lib/mobileNav';
import { openCommandPalette } from '../../lib/navigation';
import { PLACES_EVENT, isFavorite, toggleFavorite } from '../../lib/places';
import { useAuth } from '../../hooks/useAuth';
import CompanySwitch from './CompanySwitch';

function QuickSearch() {
  const navigate = useNavigate();
  const demandas = useAppStore((state) => state.demandas);
  const projetos = useAppStore((state) => state.projetos);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const demandaResults = demandas
      .filter((item) => (item.title || '').toLowerCase().includes(term))
      .slice(0, 5)
      .map((item) => ({
        id: `demanda-${item.id}`,
        label: item.title,
        hint: 'Demanda',
        path: `/demandas/${item.id}`,
      }));

    const projetoResults = projetos
      .filter((item) => (item.name || '').toLowerCase().includes(term))
      .slice(0, 3)
      .map((item) => ({
        id: `projeto-${item.id}`,
        label: item.name,
        hint: 'Projeto',
        path: '/projetos',
      }));

    return [...demandaResults, ...projetoResults];
  }, [demandas, projetos, query]);

  return (
    <div ref={boxRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar demandas e projetos"
        className="havk-field rounded-full py-1.5 pl-9 pr-3 text-base sm:py-2 sm:pl-10 sm:pr-4 sm:text-sm"
      />
      {open && query.trim() && (
        <div className="glass-popover overlay-scroll absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Nenhum resultado</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setQuery('');
                  setOpen(false);
                  navigate(item.path);
                }}
                className="flex w-full flex-col px-4 py-3 text-left hover:bg-zinc-800"
              >
                <span className="text-sm font-medium text-zinc-100">{item.label}</span>
                <span className="text-xs text-zinc-500">{item.hint}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
  const [favorite, setFavorite] = useState(() => isFavorite(location.pathname));

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
    const sync = () => setFavorite(isFavorite(location.pathname));
    sync();
    window.addEventListener(PLACES_EVENT, sync);
    return () => window.removeEventListener(PLACES_EVENT, sync);
  }, [location.pathname]);

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

  const handleNovaDemanda = () => {
    navigate('/kanban');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    if (updateNotification) {
      updateNotification(id, { read: true });
    }
  };

  return (
    <header className="glass-bar z-30 w-full shrink-0">
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
        <div className="w-full max-w-xl">
          <QuickSearch />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 lg:gap-2">

        <div className="hidden lg:block">
          <CompanySwitch />
        </div>
        <div className="hidden shrink-0 lg:block">
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="glass-icon hidden lg:inline-flex"
          aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar esta página'}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(location.pathname)}
        >
          <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
        </button>
        <button type="button" className="glass-icon hidden lg:inline-flex" aria-label="Busca global" onClick={openCommandPalette}>
          <Command className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="glass-icon relative"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-300" />

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
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="font-semibold text-base sm:text-lg text-zinc-100">
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
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
                        className={clsx(
                          "p-3 rounded-lg cursor-pointer transition-colors duration-150",
                          !n.read
                            ? "bg-indigo-950/40 border-l-4 border-indigo-500"
                            : "hover:bg-zinc-800/70",
                          "text-sm"
                        )}
                      >
                        <div className="font-medium text-zinc-100">
                          {n.title || 'Notificação'}
                        </div>
                        <p className="text-zinc-300 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 block">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    Nenhuma notificação no momento
                  </div>
                )}
              </div>

              {/* Rodapé com link para Inbox */}
              <div className="border-t border-zinc-700 p-3">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/inbox');
                  }}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 text-sm font-medium
                    text-indigo-400
                    hover:bg-indigo-950/30
                    rounded-lg transition-colors
                  "
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
            <div className="
              w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
              bg-zinc-800 text-zinc-100
              text-lg sm:text-xl font-medium
            ">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </button>
        {showProfile && (
          <div className="glass-popover absolute right-0 z-50 mt-2 w-48 rounded-xl p-1">
            <Link to="/configuracoes" className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10" onClick={() => setShowProfile(false)}>
              Configurações
            </Link>
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10" onClick={() => signOut()}>
              Sair
            </button>
          </div>
        )}
        </div>

        {/* Botão Nova Demanda */}
        <button
          onClick={handleNovaDemanda}
          className="glass-button glass-button-primary hidden rounded-xl px-4 py-2 text-sm font-medium lg:flex"
        >
          + {t('novaDemanda')}
        </button>
      </div>
      </div>
    </header>
  );
}
