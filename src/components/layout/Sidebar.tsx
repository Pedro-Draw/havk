import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Calendar,
  BarChart3,
  Users,
  Settings,
  KanbanSquare,
  Clock,
  BrainCircuit,
  StickyNote,
  Target,
  FileText,
  MessageSquare,
  GanttChart,
  ListTodo,
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();

  const baseClass =
    'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150';

  const activeClass = 'bg-zinc-800 text-white';

  const inactiveClass =
    'text-zinc-400 hover:bg-zinc-900 hover:text-white';

  const getClass = ({ isActive }: { isActive: boolean }) =>
    `${baseClass} ${isActive ? activeClass : inactiveClass}`;

  return (
    <aside
      className="
        hidden lg:flex
        w-64
        pt-16
        flex-col
        bg-zinc-950
        border-r border-zinc-800
        fixed
        top-0
        left-0
        h-screen
        z-40
      "
      aria-label="Sidebar"
    >
      <div
        className="
          flex-1
          overflow-y-auto
          px-3
          pb-6
          scrollbar-thin
          scrollbar-thumb-zinc-700
          scrollbar-track-transparent
        "
      >
        <nav className="flex flex-col gap-1 mt-4">

          <NavLink to="/" className={getClass}>
            <LayoutDashboard size={18} />
            {t('sidebar.dashboard') || 'Dashboard'}
          </NavLink>

          <NavLink to="/inbox" className={getClass}>
            <Inbox size={18} />
            {t('sidebar.inbox') || 'Inbox'}
          </NavLink>

          <NavLink to="/demandas" className={getClass}>
            <ListTodo size={18} />
            {t('sidebar.demandas') || 'Demandas'}
          </NavLink>

          <NavLink to="/projetos" className={getClass}>
            <FolderKanban size={18} />
            {t('sidebar.projetos') || 'Projetos'}
          </NavLink>

          <NavLink to="/kanban" className={getClass}>
            <KanbanSquare size={18} />
            {t('sidebar.kanban') || 'Kanban'}
          </NavLink>

          <NavLink to="/calendario" className={getClass}>
            <Calendar size={18} />
            {t('sidebar.calendario') || 'Calendário'}
          </NavLink>

          <NavLink to="/gantt" className={getClass}>
            <GanttChart size={18} />
            {t('sidebar.gantt') || 'Gantt'}
          </NavLink>

          <NavLink to="/tempo" className={getClass}>
            <Clock size={18} />
            {t('sidebar.timeTracker') || 'Tempo'}
          </NavLink>

          <NavLink to="/ia" className={getClass}>
            <BrainCircuit size={18} />
            {t('sidebar.aiStudio') || 'IA Studio'}
          </NavLink>

          <NavLink to="/notas" className={getClass}>
            <StickyNote size={18} />
            {t('sidebar.notas') || 'Notas'}
          </NavLink>

          <NavLink to="/objetivos" className={getClass}>
            <Target size={18} />
            {t('sidebar.objetivos') || 'Objetivos'}
          </NavLink>

          <NavLink to="/relatorios" className={getClass}>
            <BarChart3 size={18} />
            {t('sidebar.relatorios') || 'Relatórios'}
          </NavLink>

          <NavLink to="/equipe" className={getClass}>
            <Users size={18} />
            {t('sidebar.equipe') || 'Equipe'}
          </NavLink>

          <NavLink to="/chat" className={getClass}>
            <MessageSquare size={18} />
            {t('sidebar.chatGlobal') || 'Chat'}
          </NavLink>

          <NavLink to="/templates" className={getClass}>
            <FileText size={18} />
            {t('sidebar.templates') || 'Templates'}
          </NavLink>

          <NavLink to="/configuracoes" className={getClass}>
            <Settings size={18} />
            {t('sidebar.configuracoes') || 'Configurações'}
          </NavLink>

        </nav>
      </div>
    </aside>
  );
}