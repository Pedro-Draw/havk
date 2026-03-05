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
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggle-mobile-menu', handleToggle);

    return () =>
      window.removeEventListener('toggle-mobile-menu', handleToggle);
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /* =====================================================
     ⌨️ FECHA COM ESC
  ===================================================== */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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

      if (diff > 80) {
        setIsOpen(true);
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
      setIsOpen(false);
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
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-zinc-900 border-r border-zinc-800 z-50 overflow-y-auto transform transition-all duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        {/* HEADER */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">

          <div className="flex items-center gap-3">

            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Perfil"
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
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
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white"
            aria-label={t('mobileMenu.fecharMenu')}
          >
            <X className="w-7 h-7" />
          </button>

        </div>

        {/* MENU */}
        <nav className="p-4 space-y-1">

          {menuItems.map(item => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-800 text-white border-l-2 border-blue-500'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:translate-x-1'
                }`}
              >
                <item.icon className="w-6 h-6" />

                {item.label}
              </NavLink>
            );
          })}

          {/* NOVA DEMANDA */}

          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/demandas/nova');
            }}
            className="w-full mt-6 flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-all"
          >
            <Plus className="w-6 h-6" />

            {t('novaDemanda')}
          </button>

        </nav>
      </div>

      {/* OVERLAY */}

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}