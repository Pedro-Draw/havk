export interface PermissionItem {
  id: string;
  label: string;
  hint: string;
}

export interface PermissionSection {
  id: string;
  title: string;
  items: PermissionItem[];
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { id: '/', label: 'Visão geral', hint: 'Painel inicial da empresa' },
      { id: '/inbox', label: 'Inbox', hint: 'Avisos reunidos' },
      { id: '/demandas', label: 'Demandas', hint: 'Lista e detalhes' },
      { id: '/projetos', label: 'Projetos', hint: 'Projetos deste espaço' },
      { id: '/equipe', label: 'Equipe', hint: 'Membros e acessos' },
      { id: '/empresas', label: 'Empresas', hint: 'Espaços separados' },
    ],
  },
  {
    id: 'planejamento',
    title: 'Planejamento',
    items: [
      { id: '/kanban', label: 'Kanban', hint: 'Quadro de status' },
      { id: '/calendario', label: 'Calendário', hint: 'Prazos e agenda' },
      { id: '/gantt', label: 'Gantt', hint: 'Linha do tempo' },
      { id: '/objetivos', label: 'Objetivos', hint: 'Metas da empresa' },
    ],
  },
  {
    id: 'produtividade',
    title: 'Produtividade',
    items: [
      { id: '/tempo', label: 'Tempo', hint: 'Rastreador de horas' },
      { id: '/notas', label: 'Notas', hint: 'Anotações internas' },
      { id: '/ia', label: 'Havk AI', hint: 'Assistente do espaço' },
    ],
  },
  {
    id: 'comunicacao',
    title: 'Comunicação e análises',
    items: [
      { id: '/chat', label: 'Chat', hint: 'Conversa da equipe' },
      { id: '/relatorios', label: 'Relatórios', hint: 'Números da empresa' },
      { id: '/templates', label: 'Templates', hint: 'Modelos reutilizáveis' },
    ],
  },
  {
    id: 'acoes',
    title: 'Ações',
    items: [
      { id: 'action:create', label: 'Criar', hint: 'Novas demandas, notas e projetos' },
      { id: 'action:edit', label: 'Editar', hint: 'Alterar o que já existe' },
      { id: 'action:delete', label: 'Excluir', hint: 'Remover itens da empresa' },
      { id: 'action:export', label: 'Exportar', hint: 'Baixar CSV e relatórios' },
      { id: '/configuracoes', label: 'Configurações', hint: 'Conta e preferências' },
    ],
  },
];

export const ALL_PERMISSION_IDS = PERMISSION_SECTIONS.flatMap((section) => section.items.map((item) => item.id));

export function allowedPaths(
  user: { email?: string } | null,
  membros: { email?: string; admin?: boolean; permissions?: string[]; role?: string }[]
): Set<string> | null {
  if (!user?.email) return null;
  const member = membros.find((item) => (item.email || '').toLowerCase() === user.email!.toLowerCase());
  if (!member) return null;
  if (member.admin || (member.admin == null && member.role === 'Admin')) return null;
  if (!Array.isArray(member.permissions)) return null;
  return new Set(member.permissions);
}
