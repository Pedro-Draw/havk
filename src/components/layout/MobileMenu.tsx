import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  LayoutDashboard,
  Inbox,
  FolderKanban,
  ListTodo,
  Calendar,
  GanttChart,
  Clock,
  Bot,
  NotebookPen,
  CopyPlus,
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react';

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import { MOBILE_MENU_EVENT, setMobileMenuOpen } from '../../lib/mobileNav';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation();
  const { user } = useAppStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const location = useLocation();
  const navigate = useNavigate();

  /* =====================================================
     🔥 SINCRONIZAÇÃO COM TOPBAR
  ===================================================== */

  useEffect(() => {
    const onState = (event: Event) => {
      setIsOpen(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener(MOBILE_MENU_EVENT, onState);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, onState);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* =====================================================
     🔒 BLOQUEIA SCROLL DO BODY
  ===================================================== */

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* =====================================================
     🖱️ FECHA AO CLICAR FORA
  ===================================================== */

  /* =====================================================
     ⌨️ FECHA COM ESC
  ===================================================== */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /* =====================================================
     👆 SWIPE GLOBAL (ABRIR MENU)
  ===================================================== */

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - touchStartX.current;

      if (touchStartX.current < 24 && diff > 80) {
        setMobileMenuOpen(true);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  /* =====================================================
     👆 SWIPE PARA FECHAR
  ===================================================== */

  const handleTouchStartMenu = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMoveMenu = (e: React.TouchEvent) => {
    const endX = e.touches[0].clientX;
    const diff = endX - touchStartX.current;

    if (diff < -50) {
      setMobileMenuOpen(false);
    }
  };

  /* =====================================================
     📋 MENU ITEMS
  ===================================================== */

  const menuItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
      { icon: Inbox, label: t('sidebar.inbox'), path: '/inbox' },
      { icon: ListTodo, label: t('sidebar.demandas') || 'Demandas', path: '/demandas' },
      { icon: FolderKanban, label: t('sidebar.projetos'), path: '/projetos' },
      { icon: ListTodo, label: t('sidebar.kanban'), path: '/kanban' },
      { icon: Calendar, label: t('sidebar.calendario'), path: '/calendario' },
      { icon: GanttChart, label: t('sidebar.gantt'), path: '/gantt' },
      { icon: Clock, label: t('sidebar.timeTracker'), path: '/tempo' },
      { icon: Bot, label: t('sidebar.aiStudio'), path: '/ia' },
      { icon: NotebookPen, label: t('sidebar.notas'), path: '/notas' },
      { icon: CopyPlus, label: t('sidebar.templates'), path: '/templates' },
      { icon: Target, label: t('sidebar.objetivos'), path: '/objetivos' },
      { icon: BarChart3, label: t('sidebar.relatorios'), path: '/relatorios' },
      { icon: Users, label: t('sidebar.equipe'), path: '/equipe' },
      { icon: MessageSquare, label: t('sidebar.chat'), path: '/chat' },
      { icon: Settings, label: t('sidebar.configuracoes'), path: '/configuracoes' }
    ],
    [t]
  );

  /* =====================================================
     👤 AVATAR FALLBACK
  ===================================================== */

  const getInitials = () => {
    if (!user?.name) return 'U';

    const parts = user.name.split(' ');
    const initials = parts.map(p => p[0]).join('');

    return initials.slice(0, 2).toUpperCase();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* MENU */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        onTouchStart={handleTouchStartMenu}
        onTouchMove={handleTouchMoveMenu}
        className={`fixed inset-y-0 left-0 z-[70] w-[min(82vw,18rem)] max-w-sm overflow-y-auto border-r border-zinc-800 bg-zinc-900 transform transition-all duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">

          <div className="flex items-center gap-3">

            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Perfil"
                className="h-9 w-9 rounded-full border-2 border-zinc-700 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
                {getInitials()}
              </div>
            )}

            <div>
              <p className="font-semibold text-white">
                {user?.name || 'Usuário'}
              </p>

              <p className="text-sm text-zinc-500 truncate max-w-[160px]">
                {user?.email}
              </p>
            </div>

          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-zinc-400 hover:text-white"
            aria-label={t('mobileMenu.fecharMenu')}
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* MENU */}
        <nav className="space-y-0.5 p-2">

          {menuItems.map(item => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-800 text-white border-l-2 border-blue-500'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:translate-x-1'
                }`}
              >
                <item.icon className="h-4 w-4" />

                {item.label}
              </NavLink>
            );
          })}

          {/* NOVA DEMANDA */}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/demandas/nova');
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-white"
          >
            <Plus className="h-4 w-4" />

            {t('novaDemanda')}
          </button>

        </nav>
      </div>

      {/* OVERLAY */}

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}