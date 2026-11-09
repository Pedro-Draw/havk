export type BoardStatus = 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada';

export interface KanbanColumnDef {
  id: string;
  title: string;
  hint: string;
  status: BoardStatus;
  accent: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: 'backlog', title: 'Backlog', hint: 'Ainda sem compromisso', status: 'aberta', accent: '#71717A' },
  { id: 'afazer', title: 'A fazer', hint: 'Pronta para começar', status: 'aberta', accent: '#3B82F6' },
  { id: 'andamento', title: 'Em andamento', hint: 'Alguém está executando', status: 'em-progresso', accent: '#8B5CF6' },
  { id: 'teste', title: 'Em teste', hint: 'Aguardando validação', status: 'em-progresso', accent: '#F59E0B' },
  { id: 'bloqueada', title: 'Bloqueada', hint: 'Impedimento ativo', status: 'bloqueada', accent: '#EF4444' },
  { id: 'concluida', title: 'Concluída', hint: 'Entregue', status: 'concluida', accent: '#22C55E' },
];

const COLUMN_IDS = new Set(KANBAN_COLUMNS.map((column) => column.id));

export function statusForColumn(columnId: string): BoardStatus {
  return KANBAN_COLUMNS.find((column) => column.id === columnId)?.status ?? 'aberta';
}

export function defaultColumnForStatus(status?: string): string {
  switch (status) {
    case 'em-progresso':
      return 'andamento';
    case 'concluida':
      return 'concluida';
    case 'bloqueada':
      return 'bloqueada';
    default:
      return 'backlog';
  }
}

export function columnForDemanda(item: { status?: string; boardColumn?: string }): string {
  if (item.status === 'concluida') return 'concluida';
  if (item.status === 'bloqueada') return 'bloqueada';
  if (item.boardColumn && COLUMN_IDS.has(item.boardColumn)) {
    if (statusForColumn(item.boardColumn) === item.status) return item.boardColumn;
  }
  return defaultColumnForStatus(item.status);
}

export function columnTitle(columnId: string): string {
  return KANBAN_COLUMNS.find((column) => column.id === columnId)?.title ?? 'Backlog';
}

export interface BoardCard {
  id: string;
  status?: string;
  boardColumn?: string;
  boardOrder?: number;
}

export interface BoardChange {
  id: string;
  boardColumn: string;
  boardOrder: number;
  status: BoardStatus;
}

export function groupByColumn<T extends BoardCard>(items: T[]): Record<string, T[]> {
  const groups = Object.fromEntries(KANBAN_COLUMNS.map((column) => [column.id, [] as T[]])) as Record<string, T[]>;
  const seen = new Set<string>();

  items.forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    groups[columnForDemanda(item)].push(item);
  });

  Object.values(groups).forEach((list) => {
    list.sort((a, b) => (a.boardOrder ?? 0) - (b.boardOrder ?? 0) || a.id.localeCompare(b.id));
  });

  return groups;
}

function changesFromGroups<T extends BoardCard>(groups: Record<string, T[]>): BoardChange[] {
  const changes: BoardChange[] = [];
  Object.entries(groups).forEach(([columnId, list]) => {
    const status = statusForColumn(columnId);
    list.forEach((item, index) => {
      if (item.boardColumn === columnId && item.boardOrder === index && item.status === status) return;
      changes.push({ id: item.id, boardColumn: columnId, boardOrder: index, status });
    });
  });
  return changes;
}

/** Move um cartão e reindexa só a partir do estado mais recente. */
export function placeOnBoard<T extends BoardCard>(
  items: T[],
  placement: { id: string; columnId: string; index: number }
): BoardChange[] {
  if (!COLUMN_IDS.has(placement.columnId)) return [];
  const groups = groupByColumn(items);
  let moving: T | undefined;

  Object.values(groups).some((list) => {
    const index = list.findIndex((item) => item.id === placement.id);
    if (index < 0) return false;
    moving = list.splice(index, 1)[0];
    return true;
  });

  if (!moving) return [];
  const target = groups[placement.columnId];
  const index = Math.max(0, Math.min(placement.index, target.length));
  target.splice(index, 0, moving);
  return changesFromGroups(groups);
}

/** Leva a coluna inteira para outra, preservando a ordem relativa. */
export function moveColumnOnBoard<T extends BoardCard>(items: T[], fromColumn: string, toColumn: string): BoardChange[] {
  if (!COLUMN_IDS.has(fromColumn) || !COLUMN_IDS.has(toColumn) || fromColumn === toColumn) return [];
  const groups = groupByColumn(items);
  const moving = groups[fromColumn];
  if (!moving.length) return [];
  groups[toColumn] = [...groups[toColumn], ...moving];
  groups[fromColumn] = [];
  return changesFromGroups(groups);
}

export function applyBoardChanges<T extends BoardCard>(items: T[], changes: BoardChange[]): T[] {
  const byId = new Map(changes.map((change) => [change.id, change]));
  const seen = new Set<string>();
  return items.flatMap((item) => {
    if (!item?.id || seen.has(item.id)) return [];
    seen.add(item.id);
    const change = byId.get(item.id);
    return change ? [{ ...item, ...change }] : [item];
  });
}

type BoardPatch = {
  status?: string;
  boardColumn?: string;
  progresso?: number;
};

/** Mantém status e coluna do quadro coerentes, sem apagar uma coluna válida. */
export function reconcileDemanda<T extends BoardPatch>(current: T, patch: Partial<T>): Partial<T> {
  const next: Partial<T> = { ...patch };

  if (patch.boardColumn && patch.status === undefined) {
    next.status = statusForColumn(patch.boardColumn) as T['status'];
  }

  if (patch.status && patch.boardColumn === undefined) {
    const keep =
      current.boardColumn &&
      COLUMN_IDS.has(current.boardColumn) &&
      statusForColumn(current.boardColumn) === patch.status;
    next.boardColumn = (keep ? current.boardColumn : defaultColumnForStatus(patch.status)) as T['boardColumn'];
  }

  const status = (next.status ?? patch.status) as string | undefined;
  if (status === 'concluida' && patch.progresso === undefined && patch.status === 'concluida') {
    next.progresso = 100 as T['progresso'];
  }

  return next;
}

export function toDateInputValue(value?: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

export function formatPrazoLabel(value?: string): string {
  const input = toDateInputValue(value);
  if (!input) return '';
  const [year, month, day] = input.split('-');
  return `${day}/${month}/${year}`;
}

export function isPrazoOverdue(value?: string, columnId?: string): boolean {
  if (!value || columnId === 'concluida') return false;
  const input = toDateInputValue(value);
  if (!input) return false;
  const [year, month, day] = input.split('-').map(Number);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return end.getTime() < Date.now();
}
