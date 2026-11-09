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
    id: 'inicio',
    title: 'Visão geral',
    items: [
      { id: '/', label: 'Ver o painel', hint: 'Dashboard e resumo da empresa' },
    ],
  },
  {
    id: 'inbox',
    title: 'Inbox',
    items: [
      { id: '/inbox', label: 'Ver avisos', hint: 'Abrir a central de notificações' },
      { id: 'inbox:read', label: 'Marcar como lida', hint: 'Limpar o aviso sem apagar' },
      { id: 'inbox:clear', label: 'Limpar notificações', hint: 'Apagar os avisos de uma vez' },
    ],
  },
  {
    id: 'demandas',
    title: 'Demandas',
    items: [
      { id: '/demandas', label: 'Ver demandas', hint: 'Lista, cards e detalhe' },
      { id: 'demandas:create', label: 'Criar demanda', hint: 'Abrir uma demanda nova' },
      { id: 'demandas:edit', label: 'Editar demanda', hint: 'Título, prazo, status e descrição' },
      { id: 'demandas:assign', label: 'Atribuir responsável', hint: 'Escolher quem executa, inclusive em lote' },
      { id: 'demandas:delete', label: 'Excluir demanda', hint: 'Remover da lista' },
    ],
  },
  {
    id: 'projetos',
    title: 'Projetos',
    items: [
      { id: '/projetos', label: 'Ver projetos', hint: 'Lista deste espaço' },
      { id: 'projetos:create', label: 'Criar projeto', hint: 'Novo projeto' },
      { id: 'projetos:edit', label: 'Editar projeto', hint: 'Nome, prazo e status' },
      { id: 'projetos:delete', label: 'Excluir projeto', hint: 'Remover o projeto' },
    ],
  },
  {
    id: 'equipe',
    title: 'Equipe',
    items: [
      { id: '/equipe', label: 'Ver pessoas', hint: 'Lista de quem está cadastrado' },
      { id: 'equipe:create', label: 'Criar usuário', hint: 'Abrir conta para uma pessoa nova' },
      { id: 'equipe:edit', label: 'Editar pessoa', hint: 'Dados, empresa e cargo' },
      { id: 'equipe:permissions', label: 'Alterar permissões', hint: 'O administrador principal continua com tudo' },
      { id: 'equipe:delete', label: 'Remover pessoa', hint: 'Tirar da equipe, sem apagar o login' },
    ],
  },
  {
    id: 'empresas',
    title: 'Empresas',
    items: [
      { id: '/empresas', label: 'Ver empresas', hint: 'Espaços e o Geral' },
      { id: 'empresas:create', label: 'Criar empresa', hint: 'Novo espaço' },
      { id: 'empresas:edit', label: 'Editar empresa', hint: 'Nome, logo e dados' },
      { id: 'empresas:delete', label: 'Excluir empresa', hint: 'Remover o espaço' },
    ],
  },
  {
    id: 'kanban',
    title: 'Kanban',
    items: [
      { id: '/kanban', label: 'Ver o quadro', hint: 'Colunas e cards' },
      { id: 'kanban:move', label: 'Mover card', hint: 'Arrastar para outro status' },
      { id: 'kanban:create', label: 'Criar no quadro', hint: 'Nova demanda a partir do kanban' },
    ],
  },
  {
    id: 'calendario',
    title: 'Calendário',
    items: [
      { id: '/calendario', label: 'Ver a agenda', hint: 'Mês, semana e dia' },
      { id: 'calendario:edit', label: 'Alterar prazos', hint: 'Mover compromissos na agenda' },
    ],
  },
  {
    id: 'gantt',
    title: 'Gantt',
    items: [
      { id: '/gantt', label: 'Ver a linha do tempo', hint: 'Cronograma dos projetos' },
      { id: 'gantt:edit', label: 'Editar o cronograma', hint: 'Ajustar início e fim' },
    ],
  },
  {
    id: 'objetivos',
    title: 'Objetivos',
    items: [
      { id: '/objetivos', label: 'Ver objetivos', hint: 'Metas da empresa' },
      { id: 'objetivos:create', label: 'Criar objetivo', hint: 'Nova meta' },
      { id: 'objetivos:edit', label: 'Editar objetivo', hint: 'Progresso e prazo' },
      { id: 'objetivos:delete', label: 'Excluir objetivo', hint: 'Remover a meta' },
    ],
  },
  {
    id: 'tempo',
    title: 'Tempo',
    items: [
      { id: '/tempo', label: 'Ver horas', hint: 'Rastreador e histórico' },
      { id: 'tempo:create', label: 'Lançar horas', hint: 'Registrar tempo trabalhado' },
      { id: 'tempo:delete', label: 'Apagar lançamento', hint: 'Remover um registro' },
    ],
  },
  {
    id: 'notas',
    title: 'Notas',
    items: [
      { id: '/notas', label: 'Ver notas', hint: 'Anotações internas' },
      { id: 'notas:create', label: 'Criar nota', hint: 'Nova anotação' },
      { id: 'notas:edit', label: 'Editar nota', hint: 'Alterar o texto' },
      { id: 'notas:delete', label: 'Excluir nota', hint: 'Apagar a anotação' },
    ],
  },
  {
    id: 'ia',
    title: 'Havk AI',
    items: [
      { id: '/ia', label: 'Usar o assistente', hint: 'Perguntar e gerar texto' },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    items: [
      { id: '/chat', label: 'Ver o chat', hint: 'Conversa da equipe' },
      { id: 'chat:send', label: 'Enviar mensagem', hint: 'Escrever no chat' },
    ],
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    items: [
      { id: '/relatorios', label: 'Ver relatórios', hint: 'Números da empresa' },
      { id: 'relatorios:export', label: 'Exportar', hint: 'Baixar CSV e planilhas' },
    ],
  },
  {
    id: 'templates',
    title: 'Templates',
    items: [
      { id: '/templates', label: 'Ver modelos', hint: 'Templates reutilizáveis' },
      { id: 'templates:create', label: 'Criar modelo', hint: 'Novo template' },
      { id: 'templates:edit', label: 'Editar modelo', hint: 'Alterar o conteúdo' },
      { id: 'templates:delete', label: 'Excluir modelo', hint: 'Remover o template' },
    ],
  },
  {
    id: 'conta',
    title: 'Conta',
    items: [
      { id: '/configuracoes', label: 'Configurações', hint: 'Tema, senha e a própria conta' },
      { id: 'action:export', label: 'Exportar dados', hint: 'Baixar uma cópia do que está salvo' },
    ],
  },
];

export const ALL_PERMISSION_IDS = PERMISSION_SECTIONS.flatMap((section) => section.items.map((item) => item.id));

const SCREEN_PATHS = new Set(ALL_PERMISSION_IDS.filter((id) => id.startsWith('/')));

export function allowedPaths(
  user: { email?: string } | null,
  membros: { email?: string; admin?: boolean; master?: boolean; permissions?: string[]; role?: string }[]
): Set<string> | null {
  if (!user?.email) return null;
  const member = membros.find((item) => (item.email || '').toLowerCase() === user.email!.toLowerCase());
  if (!member) return null;
  if (member.master || member.admin || (member.admin == null && member.role === 'Admin')) return null;
  if (!Array.isArray(member.permissions)) return null;
  return new Set(member.permissions.filter((id) => SCREEN_PATHS.has(id)));
}
