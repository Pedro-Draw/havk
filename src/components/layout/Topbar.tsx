
import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, X, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import ThemeToggle from '../common/ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Topbar() {
  const navigate = useNavigate();

  const user = useAppStore((state) => state.user);
  const notifications = useAppStore((state) => state.notifications || []);
  const addNotification = useAppStore((state) => state.addNotification);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead); // ou updateNotification se for o caso

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

  // Simulação (você pode remover se já tiver geração real no Inbox)
  useEffect(() => {
    if (!addNotification) return;

    const interval = setInterval(() => {
      const id = Math.random().toString(36).slice(2, 11);
      addNotification({
        id,
        message: `Nova notificação ${id}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'info',
        title: 'Atualização',
      });
    }, 30000); // aumentei para 30s para não ficar muito agressivo

    return () => clearInterval(interval);
  }, [addNotification]);

  const toggleMobileMenu = () => {
    setShowMobileMenu((prev) => !prev);
    window.dispatchEvent(new Event('toggle-mobile-menu'));
  };

  const handleNovaDemanda = () => {
    navigate('/kanban');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        bg-white dark:bg-zinc-900
        border-b border-zinc-200 dark:border-zinc-800
        h-16 flex items-center px-4 sm:px-6
        transition-colors duration-200
      "
    >
      {/* Esquerda */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleMobileMenu}
          className="
            p-2 -ml-2
            text-zinc-600 dark:text-zinc-400
            hover:text-zinc-900 dark:hover:text-zinc-100
            hover:bg-zinc-100 dark:hover:bg-zinc-800
            rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-zinc-400
            lg:hidden
          "
          aria-label={t('mobileMenu.abrirMenu')}
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link
          to="/"
          className="
            text-xl sm:text-2xl font-bold tracking-tight
            text-zinc-900 dark:text-white
            transition-colors
          "
        >
          Havk
        </Link>
      </div>

      {/* Busca central - desktop */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="relative w-full max-w-md lg:max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder={t('search')}
            className="
              w-full bg-zinc-100 dark:bg-zinc-800
              border border-zinc-200 dark:border-zinc-700
              text-zinc-900 dark:text-zinc-100
              rounded-full pl-11 py-2.5 text-sm
              focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">

        {/* Tema */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        {/* Sino de notificações */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="
              relative p-2 rounded-full
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-zinc-400
            "
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-600 dark:text-zinc-400" />

            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1 min-w-[18px] h-5
                bg-red-500 text-white text-[10px] font-bold
                rounded-full flex items-center justify-center px-1.5
                ring-2 ring-white dark:ring-zinc-900
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
                "absolute right-0 mt-3 sm:mt-4 w-[90vw] sm:w-96 max-w-[380px]",
                "max-h-[70vh] overflow-y-auto overscroll-contain",
                "bg-white dark:bg-zinc-800",
                "border border-zinc-200 dark:border-zinc-700",
                "rounded-xl shadow-2xl shadow-black/30 dark:shadow-black/60",
                "z-50 transition-all duration-200",
                "scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent"
              )}
            >
              <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
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
                          if (!n.read && markNotificationRead) {
                            markNotificationRead(n.id);
                          }
                          setShowNotifications(false);
                        }}
                        className={clsx(
                          "p-3 rounded-lg cursor-pointer transition-colors duration-150",
                          !n.read
                            ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-500"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/70",
                          "text-sm"
                        )}
                      >
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {n.title || 'Notificação'}
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 block">
                          {n.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
              <div className="border-t border-zinc-200 dark:border-zinc-700 p-3">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/inbox');
                  }}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 text-sm font-medium
                    text-indigo-600 dark:text-indigo-400
                    hover:bg-indigo-50 dark:hover:bg-indigo-950/30
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-zinc-300 dark:ring-zinc-700"
            />
          ) : (
            <div className="
              w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
              bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300
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
            bg-zinc-900 dark:bg-white
            text-white dark:text-zinc-900
            hover:bg-zinc-800 dark:hover:bg-zinc-100
            px-4 sm:px-5 py-2 rounded-xl font-medium text-sm
            transition-colors duration-200
          "
        >
          + {t('novaDemanda')}
        </button>
      </div>
    </header>
  );
}