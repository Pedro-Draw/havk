import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanSquare, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import SortableCard from '../components/kanban/SortableCard';
import ResponsavelField from '../components/demandas/ResponsavelField';
import DemandaSheet from '../components/demandas/DemandaSheet';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/layout/PageHeader';
import ViewSwitch from '../components/demandas/ViewSwitch';
import { useAppStore } from '../store/useAppStore';
import { GERAL_EMPRESA_ID } from '../lib/workspace';
import { confirmAction } from '../lib/confirm';
import {
  KANBAN_COLUMNS,
  columnForDemanda,
  columnTitle,
  fromDateInputValue,
  statusForColumn,
  toDateInputValue,
} from '../lib/kanban';

interface BoardTask {
  id: string;
  title: string;
  description?: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  prazo?: string;
  responsavel?: string;
  tipo?: string;
  dificuldade?: string;
  esforcoEstimado?: number;
  columnId: string;
  boardOrder: number;
  empresaId?: string;
  empresaName?: string;
  createdAt?: string;
  createdBy?: string;
  creatorAvatar?: string | null;
  seguidores?: string[];
}

type Board = Record<string, BoardTask[]>;

const emptyTask = {
  title: '',
  description: '',
  priority: 'media' as const,
  prazo: '',
  responsavel: '',
  tipo: 'feature',
  dificuldade: 'media',
  esforcoEstimado: 0,
  columnId: 'afazer',
};

function columnDropId(columnId: string) {
  return `col:${columnId}`;
}

function buildBoard(demandas: Array<Record<string, any>>): Board {
  const board = Object.fromEntries(KANBAN_COLUMNS.map((column) => [column.id, [] as BoardTask[]])) as Board;
  const seen = new Set<string>();

  demandas.forEach((demanda) => {
    if (!demanda?.id || demanda.parentId || seen.has(demanda.id)) return;
    seen.add(demanda.id);
    const columnId = columnForDemanda(demanda);
    board[columnId].push({
      id: demanda.id,
      title: String(demanda.title || '').replace(/^Havk AI translated:\s*/i, ''),
      description: demanda.description,
      priority: demanda.priority || 'media',
      prazo: toDateInputValue(demanda.prazo),
      responsavel: demanda.responsavel,
      tipo: demanda.tipo,
      dificuldade: demanda.dificuldade,
      esforcoEstimado: demanda.esforcoEstimado,
      columnId,
      boardOrder: typeof demanda.boardOrder === 'number' ? demanda.boardOrder : board[columnId].length,
      empresaId: demanda.empresaId,
      createdAt: demanda.createdAt,
      createdBy: demanda.createdBy,
      seguidores: demanda.seguidores,
    });
  });

  Object.values(board).forEach((tasks) => tasks.sort((a, b) => a.boardOrder - b.boardOrder));
  return board;
}

function findColumn(board: Board, id: string): string | undefined {
  if (id.startsWith('col:')) return id.slice(4);
  return Object.entries(board).find(([, tasks]) => tasks.some((task) => task.id === id))?.[0];
}

const collisionDetection: CollisionDetection = (args) => {
  const pointers = pointerWithin(args);
  return pointers.length ? pointers : closestCorners(args);
};

function KanbanColumn({
  id,
  title,
  hint,
  count,
  accent,
  tasks,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  count: number;
  accent: string;
  tasks: BoardTask[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(id) });

  return (
    <section
      className={`kanban-column flex w-[min(84vw,20rem)] shrink-0 snap-start flex-col rounded-2xl p-3 lg:w-80 ${
        isOver ? 'ring-2 ring-violet-400/70' : ''
      }`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--text-secondary)]">{count}</span>
      </header>
      <div ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2">
        {tasks.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed px-3 text-center text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
            Solte uma demanda aqui
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default function Kanban() {
  const demandas = useAppStore((state) => state.demandas);
  const empresas = useAppStore((state) => state.empresas);
  const activeEmpresaId = useAppStore((state) => state.activeEmpresaId);
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);
  const membros = useAppStore((state) => state.membros);
  const addDemanda = useAppStore((state) => state.addDemanda);
  const updateDemanda = useAppStore((state) => state.updateDemanda);
  const deleteDemanda = useAppStore((state) => state.deleteDemanda);
  const moveDemandaOnBoard = useAppStore((state) => state.moveDemandaOnBoard);
  const moveColumnDemandas = useAppStore((state) => state.moveColumnDemandas);

  const savedBoard = useMemo(() => buildBoard(demandas), [demandas]);
  const [draft, setDraft] = useState<Board | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [current, setCurrent] = useState<BoardTask | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const boardRef = useRef<Board>(savedBoard);
  const board = draft ?? savedBoard;
  boardRef.current = board;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveToColumn = async (taskId: string, columnId: string) => {
    await moveDemandaOnBoard(taskId, columnId, Number.MAX_SAFE_INTEGER);
    toast.success(`Movida para ${columnTitle(columnId)}`);
  };

  const moveColumn = async (fromColumn: string, toColumn: string) => {
    const moved = await moveColumnDemandas(fromColumn, toColumn);
    if (!moved) return;
    toast.success(`${moved} ${moved === 1 ? 'demanda movida' : 'demandas movidas'} para ${columnTitle(toColumn)}`);
  };

  const showCompany = !activeEmpresaId || activeEmpresaId === GERAL_EMPRESA_ID;
  const withCompany = (task: BoardTask): BoardTask => ({
    ...task,
    empresaName: !task.empresaId || task.empresaId === GERAL_EMPRESA_ID
      ? 'Geral'
      : empresas.find((empresa) => empresa.id === task.empresaId)?.name || 'Empresa',
  });

  const visible = (tasks: BoardTask[]) => {
    const term = query.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) =>
      `${task.title} ${task.description || ''} ${task.responsavel || ''}`.toLowerCase().includes(term)
    );
  };

  const moveTask = (activeTaskId: string, _sourceId: string, targetId: string, overId: string) => {
    const currentBoard = boardRef.current;
    let task: BoardTask | undefined;
    const next = Object.fromEntries(
      Object.entries(currentBoard).map(([columnId, tasks]) => [
        columnId,
        tasks.filter((item) => {
          if (item.id !== activeTaskId) return true;
          task = item;
          return false;
        }),
      ])
    ) as Board;
    if (!task || !next[targetId]) return;
    const overIndex = next[targetId].findIndex((item) => item.id === overId);
    next[targetId].splice(overIndex >= 0 ? overIndex : next[targetId].length, 0, { ...task, columnId: targetId });
    boardRef.current = next;
    setDraft(next);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setDraft(boardRef.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const sourceId = findColumn(boardRef.current, activeKey);
    const targetId = findColumn(boardRef.current, overKey);
    if (!sourceId || !targetId || sourceId === targetId) return;
    moveTask(activeKey, sourceId, targetId, overKey);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setDraft(null);
      return;
    }

    const activeKey = String(active.id);
    const overKey = String(over.id);
    const sourceBoard = boardRef.current;
    const targetId = findColumn(sourceBoard, overKey);
    if (!targetId) {
      setDraft(null);
      return;
    }

    const withoutActive = sourceBoard[targetId].filter((task) => task.id !== activeKey);
    const currentIndex = sourceBoard[targetId].findIndex((task) => task.id === activeKey);
    const overIndex = withoutActive.findIndex((task) => task.id === overKey);
    const index = overKey === activeKey
      ? Math.max(currentIndex, 0)
      : overIndex >= 0
        ? overIndex
        : withoutActive.length;

    try {
      await moveDemandaOnBoard(activeKey, targetId, index);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível mover a demanda');
    } finally {
      setDraft(null);
    }
  };

  const createTask = async () => {
    if (!form.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    await addDemanda({
      title: form.title.trim(),
      description: form.description?.trim() || '',
      priority: form.priority,
      status: statusForColumn(form.columnId),
      boardColumn: form.columnId,
      prazo: form.prazo ? fromDateInputValue(form.prazo) : undefined,
      responsavel: form.responsavel?.trim() || undefined,
      tipo: form.tipo as any,
      dificuldade: form.dificuldade as any,
      esforcoEstimado: form.esforcoEstimado || 0,
      createdBy: user?.name || user?.email || 'Você',
    });
    setForm(emptyTask);
    setShowNew(false);
  };

  const saveTask = async () => {
    if (!current || !current.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    await updateDemanda(current.id, {
      title: current.title.trim(),
      description: current.description?.trim() || '',
      priority: current.priority,
      prazo: current.prazo ? fromDateInputValue(current.prazo) : undefined,
      responsavel: current.responsavel || undefined,
      tipo: current.tipo as any,
      dificuldade: current.dificuldade as any,
      esforcoEstimado: current.esforcoEstimado || 0,
      boardColumn: current.columnId,
      status: statusForColumn(current.columnId),
    });
    setCurrent(null);
  };

  const removeTask = async () => {
    if (!current) return;
    const accepted = await confirmAction({
      title: 'Excluir demanda?',
      message: `"${current.title}" sai do quadro desta empresa.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (!accepted) return;
    await deleteDemanda(current.id);
    setCurrent(null);
  };

  const creatorAvatar = (name?: string) => {
    const key = (name || '').trim().toLowerCase();
    if (!key || (user && (user.name?.toLowerCase() === key || user.email?.toLowerCase() === key))) return user?.avatar || null;
    return membros.find((member) => member.name?.toLowerCase() === key || member.email?.toLowerCase() === key)?.avatar || null;
  };
  const labeled = (task: BoardTask) => ({
    ...(showCompany ? withCompany(task) : task),
    creatorAvatar: creatorAvatar(task.createdBy),
    empresaName: showCompany ? withCompany(task).empresaName : empresas.find((empresa) => empresa.id === task.empresaId)?.name,
  });
  const listed = KANBAN_COLUMNS.flatMap((column) => visible(board[column.id] || []).map(labeled));

  const activeTask = activeId
    ? Object.values(board).flat().find((task) => task.id === activeId)
    : undefined;

  if (isLoading) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-[var(--text-muted)]">Carregando quadro...</div>;
  }

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <PageHeader
          icon={<KanbanSquare size={18} />}
          title="Kanban"
          description={showCompany
            ? 'No Geral o quadro junta as demandas de todas as empresas. Arraste o card para a coluna ao lado.'
            : 'Arraste as demandas entre as etapas. No celular, as colunas ficam lado a lado para você soltar o card na próxima.'}
          meta={`${demandas.length} demanda${demandas.length === 1 ? '' : 's'}`}
          actions={
            <>
              <ViewSwitch mode={view} onMode={setView} />
              <Button icon={<Plus size={16} />} onClick={() => setShowNew(true)}>Nova demanda</Button>
            </>
          }
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar neste quadro"
            className="havk-field max-w-md px-3 py-2.5 text-sm"
          />
          <p className="hidden text-xs text-[var(--text-muted)] sm:block">
            Segure o card e solte na coluna ao lado. A lista mostra as mesmas demandas, uma embaixo da outra.
          </p>
        </div>

        {view === 'lista' ? (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {listed.length === 0 && (
              <p className="px-4 py-8 text-sm text-[var(--text-muted)]">Nenhuma demanda neste espaço.</p>
            )}
            {listed.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => { setEditing(false); setCurrent(task); }}
                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{task.title || 'Sem título'}</span>
                  {showCompany && <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{task.empresaName}</span>}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                  style={{ background: KANBAN_COLUMNS.find((column) => column.id === task.columnId)?.accent || '#71717A' }}
                >
                  {columnTitle(task.columnId)}
                </span>
              </button>
            ))}
          </div>
        ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          autoScroll={{ acceleration: 1, threshold: { x: 0.3, y: 0.22 } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setDraft(null);
          }}
        >
          <div className={`kanban-scroll flex gap-3 overflow-x-auto pb-4${activeId ? ' is-panning' : ''}`}>
            {KANBAN_COLUMNS.map((column) => {
              const tasks = visible(board[column.id] || []).map(labeled);
              const crowded = column.id === 'andamento' && board[column.id].length > 5;
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  hint={crowded ? 'Muitas demandas ao mesmo tempo' : column.hint}
                  count={board[column.id].length}
                  accent={column.accent}
                  tasks={tasks}
                >
                  <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                      <SortableCard
                        key={task.id}
                        id={task.id}
                        item={task}
                        onOpen={() => {
                          setEditing(false);
                          setCurrent(task);
                        }}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="w-72 rounded-2xl border p-3 shadow-2xl" style={{ background: 'var(--card-elevated)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium">{activeTask.title}</p>
                {showCompany && <p className="mt-1 text-xs text-[var(--text-muted)]">{withCompany(activeTask).empresaName}</p>}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        )}
      </div>

      <Modal
        isOpen={showNew}
        title="Nova demanda"
        onClose={() => setShowNew(false)}
        onConfirm={createTask}
        confirmLabel="Criar demanda"
      >
        <TaskFields value={form} onChange={setForm} />
      </Modal>

      <Modal isOpen={!!current} title={current?.title || 'Demanda'} size="wide" onClose={() => { setCurrent(null); setEditing(false); }}>
        {current && (
          <DemandaPanel
            task={labeled(current)}
            editing={editing}
            subtasks={demandas.filter((item) => item.parentId === current.id)}
            onEdit={() => setEditing(true)}
            onCancelEdit={() => setEditing(false)}
            onChange={(value) => setCurrent({ ...current, ...value })}
            onSave={saveTask}
            onRemove={removeTask}
            onFollow={async () => {
              if (!user) return;
              const currentFollowers = current.seguidores || [];
              const next = currentFollowers.includes(user.id)
                ? currentFollowers.filter((id) => id !== user.id)
                : [...currentFollowers, user.id];
              setCurrent({ ...current, seguidores: next });
              await updateDemanda(current.id, { seguidores: next });
            }}
            following={Boolean(user && current.seguidores?.includes(user.id))}
            onAddSubtask={async (title, note) => {
              const nextTitle = (title || '').trim();
              if (!nextTitle) return;
              await addDemanda({
                title: nextTitle,
                description: (note || '').trim(),
                priority: 'media',
                status: 'aberta',
                boardColumn: 'afazer',
                tipo: 'feature',
                parentId: current.id,
                createdBy: user?.name || user?.email || 'Você',
              });
            }}
            onCompleteSubtask={(id) => updateDemanda(id, { status: 'concluida', progresso: 100, boardColumn: 'concluida' })}
          />
        )}
      </Modal>
    </div>
  );
}

function DemandaPanel({
  task,
  editing,
  subtasks,
  following,
  onEdit,
  onCancelEdit,
  onChange,
  onSave,
  onRemove,
  onFollow,
  onAddSubtask,
  onCompleteSubtask,
}: {
  task: BoardTask;
  editing: boolean;
  subtasks: Array<{ id: string; title?: string; description?: string; tipo?: string; status?: string }>;
  following: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChange: (value: TaskForm) => void;
  onSave: () => void;
  onRemove: () => void;
  onFollow: () => void;
  onAddSubtask: (title?: string, note?: string) => void;
  onCompleteSubtask: (id: string) => void;
}) {

  if (editing) {
    return (
      <div className="space-y-4">
        <TaskFields value={task} onChange={onChange} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="destructive" onClick={onRemove}>Excluir</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancelEdit}>Cancelar</Button>
            <Button onClick={onSave}>Salvar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DemandaSheet
      task={task}
      subtasks={subtasks}
      following={following}
      onFollow={onFollow}
      onEdit={onEdit}
      onAddSubtask={onAddSubtask}
      onCompleteSubtask={onCompleteSubtask}
    />
  );
}

interface TaskForm {
  title: string;
  description?: string;
  priority: BoardTask['priority'];
  prazo?: string;
  responsavel?: string;
  tipo?: string;
  dificuldade?: string;
  esforcoEstimado?: number;
  columnId: string;
}

function TaskFields({
  value,
  onChange,
}: {
  value: TaskForm;
  onChange: (value: TaskForm) => void;
}) {
  const set = (patch: Partial<TaskForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5 text-sm">
        <span className="text-[var(--text-secondary)]">Título</span>
        <input className="havk-field px-3 py-2.5" value={value.title} onChange={(event) => set({ title: event.target.value })} />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-[var(--text-secondary)]">Descrição</span>
        <textarea className="havk-field min-h-28 px-3 py-2.5" value={value.description} onChange={(event) => set({ description: event.target.value })} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldSelect label="Coluna" value={value.columnId} onChange={(columnId) => set({ columnId })} options={KANBAN_COLUMNS.map((column) => ({ value: column.id, label: column.title }))} />
        <FieldSelect label="Prioridade" value={value.priority} onChange={(priority) => set({ priority: priority as typeof value.priority })} options={['baixa', 'media', 'alta', 'urgente'].map((item) => ({ value: item, label: item }))} />
        <FieldSelect label="Tipo" value={value.tipo || 'feature'} onChange={(tipo) => set({ tipo })} options={['bug', 'feature', 'melhoria', 'inovacao', 'outro'].map((item) => ({ value: item, label: item }))} />
        <FieldSelect label="Dificuldade" value={value.dificuldade || 'media'} onChange={(dificuldade) => set({ dificuldade })} options={['muito-facil', 'facil', 'media', 'dificil', 'muito-dificil'].map((item) => ({ value: item, label: item }))} />
        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--text-secondary)]">Prazo</span>
          <input type="date" className="havk-field px-3 py-2.5" value={value.prazo || ''} onChange={(event) => set({ prazo: event.target.value })} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--text-secondary)]">Responsável</span>
          <ResponsavelField className="havk-field px-3 py-2.5" value={value.responsavel || ''} onChange={(responsavel) => set({ responsavel })} />
        </label>
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <select className="havk-field px-3 py-2.5" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
