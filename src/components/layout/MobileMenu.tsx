import { useState, useRef, useEffect } from 'react';
import { X, LayoutDashboard, Inbox, FolderKanban, ListTodo, Calendar, GanttChart, Clock, Bot, NotebookPen, CopyPlus, Target, BarChart3, Users, MessageSquare, Settings, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { user } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // 🔥 SINCRONIZAÇÃO COM TOPBAR
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggle-mobile-menu', handleToggle);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle);
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Swipe para fechar (touch devices)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!menuRef.current) return;
    const touchEndX = e.touches[0].clientX;
    const diffX = touchEndX - touchStartX.current;

    if (diffX < -50) {
      setIsOpen(false);
    }
  };

  const menuItems = [
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
    { icon: Settings, label: t('sidebar.configuracoes'), path: '/configuracoes' },
  ];

  return (
    <>
      {/* Menu lateral */}
      <div
        ref={menuRef}
        className={`fixed inset-y-0 left-0 w-80 bg-zinc-900 border-r border-zinc-800 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="Perfil" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-2xl text-zinc-300">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{user?.name || 'Usuário'}</p>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>

          {/* Botão X para fechar */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white focus:outline-none"
            aria-label={t('mobileMenu.fecharMenu')}
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={() => {
              setIsOpen(false);
              alert('Nova demanda em desenvolvimento');
            }}
            className="w-full mt-6 flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-colors"
          >
            <Plus className="w-6 h-6" />
            {t('novaDemanda')}
          </button>
        </nav>
      </div>

      {/* Overlay de fundo */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}