import { useState } from 'react';
import { Menu, X, LayoutDashboard, Inbox, FolderKanban, ListTodo, Calendar, GanttChart, Clock, Bot, NotebookPen, CopyPlus, Target, BarChart3, Users, MessageSquare, Settings, Plug, CreditCard, HelpCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
    { icon: Inbox, label: t('sidebar.inbox'), path: '/inbox' },
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
    { icon: Plug, label: t('sidebar.integracoes'), path: '/integracoes' },
    { icon: CreditCard, label: t('sidebar.planos'), path: '/planos' },
    { icon: HelpCircle, label: t('sidebar.ajuda'), path: '/ajuda' },
  ];

  return (
    <>
      {/* Botão hamburger fixo no mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center shadow-xl hover:bg-zinc-700 transition-colors"
        aria-label={t('mobileMenu.abrirMenu')}
      >
        {isOpen ? <X className="w-7 h-7 text-zinc-100" /> : <Menu className="w-7 h-7 text-zinc-100" />}
      </button>

      {/* Overlay + Menu flutuante */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[70vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-y-auto lg:hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Havk Menu</h2>
            </div>
            <nav className="p-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl text-sm ${
                      isActive
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}