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
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();

  const linkClass =
    'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all';

  const activeClass = 'bg-zinc-800 text-white';

  const inactiveClass =
    'text-zinc-400 hover:bg-zinc-900 hover:text-white';

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
    >
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <nav className="flex flex-col gap-1 mt-4">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <LayoutDashboard size={18} />
            {t('sidebar.dashboard')}
          </NavLink>

          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Inbox size={18} />
            {t('sidebar.inbox')}
          </NavLink>

          <NavLink
            to="/projetos"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <FolderKanban size={18} />
            {t('sidebar.projetos')}
          </NavLink>

          <NavLink
            to="/kanban"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <KanbanSquare size={18} />
            {t('sidebar.kanban')}
          </NavLink>

          <NavLink
            to="/calendario"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Calendar size={18} />
            {t('sidebar.calendario')}
          </NavLink>

            <NavLink
  to="/gantt"
  className={({ isActive }) =>
    `${linkClass} ${isActive ? activeClass : inactiveClass}`
  }
>
  <GanttChart size={18} />
  {t('sidebar.gantt')}
</NavLink>

          <NavLink
            to="/tempo"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Clock size={18} />
            {t('sidebar.timeTracker')}
          </NavLink>

          <NavLink
            to="/ia"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <BrainCircuit size={18} />
            {t('sidebar.aiStudio')}
          </NavLink>

          <NavLink
            to="/notas"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <StickyNote size={18} />
            {t('sidebar.notas')}
          </NavLink>

          <NavLink
            to="/objetivos"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Target size={18} />
            {t('sidebar.objetivos')}
          </NavLink>

          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <BarChart3 size={18} />
            {t('sidebar.relatorios')}
          </NavLink>

          <NavLink
            to="/equipe"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Users size={18} />
            {t('sidebar.equipe')}
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <MessageSquare size={18} />
            {t('sidebar.chatGlobal')}
          </NavLink>

          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <FileText size={18} />
            {t('sidebar.templates')}
          </NavLink>

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Settings size={18} />
            {t('sidebar.configuracoes')}
          </NavLink>

        </nav>
      </div>
    </aside>
  );
}