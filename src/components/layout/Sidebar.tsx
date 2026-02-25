import { NavLink } from 'react-router-dom';
import { 
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
  Plug, 
  CreditCard, 
  HelpCircle 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore'; // será criado depois
import { useTranslation } from '../../i18n/useTranslation'; // será criado depois

export default function Sidebar() {
  const { isAuthenticated } = useAppStore(); // mock por enquanto
  const { t } = useTranslation();

  if (!isAuthenticated) return null;

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
    { icon: Inbox, label: t('sidebar.inbox'), path: '/inbox' },
    { icon: FolderKanban, label: t('sidebar.projetos'), path: '/projetos' },
    { icon: ListTodo, label: t('sidebar.kanban'), path: '/kanban' },
    { icon: ListTodo, label: t('sidebar.demandas'), path: '/demandas' },
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
    <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-screen overflow-y-auto">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white">Havk</h1>
        <p className="text-sm text-zinc-400">IA para Demandas</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

      <div className="p-4 border-t border-zinc-800">
        <button className="w-full flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
}