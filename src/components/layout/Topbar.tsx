import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Link } from 'react-router-dom';

export default function Topbar() {
  const user = useAppStore((state) => state.user);
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const { t } = useTranslation();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simula notificações em tempo real (sem backend)
  useEffect(() => {
    if (!addNotification) return;
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substr(2, 9);
      addNotification({
        id,
        message: `Nova notificação ${id}`,
        time: new Date().toLocaleTimeString(),
      });
    }, 15000); // a cada 15 segundos
    return () => clearInterval(interval);
  }, [addNotification]);

  // Controla o menu mobile
  const toggleMobileMenu = () => {
    setShowMobileMenu((prev) => !prev);
    window.dispatchEvent(new Event('toggle-mobile-menu'));
  };

  // Botão Nova Demanda
  const handleNovaDemanda = () => {
    window.location.href = '/kanban'; // ou modal de criação de demanda
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 h-16 flex items-center px-4 lg:px-6">

      {/* LADO ESQUERDO */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile) */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-full lg:hidden"
          aria-label={t('mobileMenu.abrirMenu')}
        >
          {showMobileMenu ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-white"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Havk
        </Link>
      </div>

      {/* Busca central (desktop) */}
      <div className="flex-1 hidden md:flex justify-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder={t('search')}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-full pl-11 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="flex items-center gap-3 ml-auto relative">

        {/* Sino */}
        <button
          onClick={() => setShowNotifications((prev) => !prev)}
          className="relative p-2 hover:bg-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <Bell className="w-5 h-5 text-zinc-400" />
          {notifications?.some((n) => !n.read) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-900" />
          )}
        </button>

        {/* Dropdown de Notificações */}
        {showNotifications && (
          <div
            ref={notificationRef}
            className="absolute right-0 mt-12 w-80 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg p-3 flex flex-col gap-2 z-50"
          >
            {notifications && notifications.length > 0 ? (
              notifications
                .slice()
                .reverse()
                .map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 rounded-md cursor-pointer hover:bg-zinc-700 transition-colors ${
                      !n.read ? 'bg-zinc-700/50' : ''
                    }`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <p className="text-sm text-zinc-200">{n.message}</p>
                    <span className="text-xs text-zinc-400">{n.time}</span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-zinc-400 text-center py-2">
                {t('semNotificacoes')}
              </p>
            )}
          </div>
        )}

        {/* Avatar */}
        <Link
          to="/configuracoes"
          className="flex items-center gap-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-full"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-700"
            />
          ) : (
            <div className="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center text-xl text-zinc-300">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </Link>

        {/* Botão Nova Demanda (desktop) */}
        <button
          onClick={handleNovaDemanda}
          className="hidden lg:flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-2 rounded-xl font-medium text-sm transition-colors"
        >
          + {t('novaDemanda')}
        </button>
      </div>
    </header>
  );
}