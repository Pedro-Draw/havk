import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  ListTodo,
  Users,
  KanbanSquare,
  Calendar,
  GanttChart,
  Target,
  Clock,
  StickyNote,
  BrainCircuit,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  Building2,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  key: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { to: '/', label: 'Visão geral', key: 'sidebar.dashboard', icon: LayoutDashboard, end: true },
      { to: '/inbox', label: 'Inbox', key: 'sidebar.inbox', icon: Inbox },
      { to: '/demandas', label: 'Demandas', key: 'sidebar.demandas', icon: ListTodo },
      { to: '/projetos', label: 'Projetos', key: 'sidebar.projetos', icon: FolderKanban },
      { to: '/equipe', label: 'Equipe', key: 'sidebar.equipe', icon: Users },
      { to: '/empresas', label: 'Empresas', key: 'sidebar.empresas', icon: Building2 },
    ],
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    items: [
      { to: '/kanban', label: 'Kanban', key: 'sidebar.kanban', icon: KanbanSquare },
      { to: '/calendario', label: 'Calendário', key: 'sidebar.calendario', icon: Calendar },
      { to: '/gantt', label: 'Gantt', key: 'sidebar.gantt', icon: GanttChart },
      { to: '/objetivos', label: 'Objetivos', key: 'sidebar.objetivos', icon: Target },
    ],
  },
  {
    id: 'produtividade',
    label: 'Produtividade',
    items: [
      { to: '/tempo', label: 'Rastreador de tempo', key: 'sidebar.timeTracker', icon: Clock },
      { to: '/notas', label: 'Notas', key: 'sidebar.notas', icon: StickyNote },
      { to: '/ia', label: 'Havk AI', key: 'sidebar.aiStudio', icon: BrainCircuit },
    ],
  },
  {
    id: 'comunicacao',
    label: 'Comunicação e análises',
    items: [
      { to: '/chat', label: 'Chat', key: 'sidebar.chatGlobal', icon: MessageSquare },
      { to: '/relatorios', label: 'Relatórios', key: 'sidebar.relatorios', icon: BarChart3 },
      { to: '/templates', label: 'Templates', key: 'sidebar.templates', icon: FileText },
    ],
  },
  {
    id: 'preferencias',
    label: 'Preferências',
    items: [
      { to: '/configuracoes', label: 'Configurações', key: 'sidebar.configuracoes', icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const OPEN_COMMAND_EVENT = 'havk-open-command';

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));
}
