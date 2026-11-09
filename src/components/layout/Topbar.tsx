
import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Search, Menu, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import ThemeToggle from '../common/ThemeToggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { MOBILE_MENU_EVENT, PRIMARY_ROUTES, screenParent, setMobileMenuOpen } from '../../lib/mobileNav';

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
        className="w-full rounded-full border border-zinc-700 bg-zinc-900 py-1.5 pl-9 pr-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:py-2 sm:pl-10 sm:pr-4 sm:text-sm"
      />
      {open && query.trim() && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
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

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
    if (isSubscreen) {
      setMobileMenuOpen(false);
      navigate(screenParent(location.pathname));
      return;
    }
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
    <header
      className="
        sticky top-0 z-30 w-full
        border-b border-zinc-800 bg-zinc-950/95 backdrop-blur
      "
    >
      <div className="grid h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5">
      {/* Esquerda */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={handleLeadingButton}
          className="
            -ml-1 rounded-full p-1.5
            text-zinc-100
            transition-colors
            hover:bg-zinc-800
            focus:outline-none focus:ring-2 focus:ring-zinc-400
            lg:hidden
          "
          aria-label={isSubscreen ? 'Voltar' : showMobileMenu ? t('mobileMenu.fecharMenu') : t('mobileMenu.abrirMenu')}
        >
          {isSubscreen ? (
            <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
          ) : showMobileMenu ? (
            <X className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={2} />
          )}
        </button>

        <Link
          to="/"
          className="text-base font-semibold tracking-tight text-white lg:hidden"
        >
          Havk
        </Link>
      </div>

      <div className="hidden min-w-0 justify-center sm:flex">
        <div className="w-full max-w-xl">
          <QuickSearch />
        </div>
      </div>
      <div className="sm:hidden" />

      {/* Direita */}
      <div className="flex items-center justify-end gap-1 sm:gap-2">

        {/* Tema */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>

        {/* Sino de notificações */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="
              relative p-2 rounded-full
              hover:bg-zinc-800
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-zinc-400
            "
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
              className={clsx(
                "absolute right-0 mt-3 w-[min(22rem,calc(100vw-1.5rem))] sm:mt-4",
                "max-h-[70vh] overflow-y-auto overscroll-contain",
                "bg-zinc-900",
                "border border-zinc-700",
                "rounded-xl shadow-2xl shadow-black/60",
                "z-50 transition-all duration-200",
                "scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent"
              )}
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
        <Link
          to="/configuracoes"
          className="
            flex items-center gap-2
            hover:opacity-90 transition-opacity
            focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded-full
          "
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
        </Link>

        {/* Botão Nova Demanda */}
        <button
          onClick={handleNovaDemanda}
          className="
            hidden lg:flex items-center gap-2
            bg-white
            text-zinc-900
            hover:bg-zinc-200
            px-4 sm:px-5 py-2 rounded-xl font-medium text-sm
            transition-colors duration-200
          "
        >
          + {t('novaDemanda')}
        </button>
      </div>
      </div>
      <div className="px-3 pb-2 sm:hidden">
        <QuickSearch />
      </div>
    </header>
  );
}
