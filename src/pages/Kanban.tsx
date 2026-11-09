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
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/layout/PageHeader';
import ViewSwitch from '../components/demandas/ViewSwitch';
import { useAppStore } from '../store/useAppStore';
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
    if (!demanda?.id || seen.has(demanda.id)) return;
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
  mobileActive,
  onMoveAll,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  count: number;
  accent: string;
  tasks: BoardTask[];
  mobileActive: boolean;
  onMoveAll: (columnId: string) => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(id) });

  return (
    <section
      className={`w-full shrink-0 flex-col rounded-2xl border p-3 lg:flex lg:w-80 ${
        mobileActive ? 'flex' : 'hidden'
      } ${isOver ? 'ring-2 ring-violet-400/70' : ''}`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
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
      {count > 0 && (
        <label className="mb-3 block text-[11px] text-[var(--text-muted)]">
          Mover todas
          <select
            aria-label={`Mover todas de ${title}`}
            className="havk-field mt-1 min-h-11 w-full text-sm"
            value=""
            onChange={(event) => {
              const columnId = event.target.value;
              event.target.value = '';
              if (columnId) onMoveAll(columnId);
            }}
          >
            <option value="">Escolher coluna</option>
            {KANBAN_COLUMNS.filter((column) => column.id !== id).map((column) => (
              <option key={column.id} value={column.id}>{column.title}</option>
            ))}
          </select>
        </label>
      )}
      <div ref={setNodeRef} className="flex min-h-64 flex-1 flex-col gap-2">
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
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);
  const addDemanda = useAppStore((state) => state.addDemanda);
  const updateDemanda = useAppStore((state) => state.updateDemanda);
  const deleteDemanda = useAppStore((state) => state.deleteDemanda);
  const moveDemandaOnBoard = useAppStore((state) => state.moveDemandaOnBoard);
  const moveColumnDemandas = useAppStore((state) => state.moveColumnDemandas);

  const savedBoard = useMemo(() => buildBoard(demandas), [demandas]);
  const [draft, setDraft] = useState<Board | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileColumn, setMobileColumn] = useState('backlog');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [current, setCurrent] = useState<BoardTask | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const boardRef = useRef<Board>(savedBoard);
  const board = draft ?? savedBoard;
  boardRef.current = board;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveToColumn = async (taskId: string, columnId: string) => {
    await moveDemandaOnBoard(taskId, columnId, Number.MAX_SAFE_INTEGER);
    setMobileColumn(columnId);
    toast.success(`Movida para ${columnTitle(columnId)}`);
  };

  const moveColumn = async (fromColumn: string, toColumn: string) => {
    const moved = await moveColumnDemandas(fromColumn, toColumn);
    if (!moved) return;
    setMobileColumn(toColumn);
    toast.success(`${moved} ${moved === 1 ? 'demanda movida' : 'demandas movidas'} para ${columnTitle(toColumn)}`);
  };

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
      setMobileColumn(targetId);
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
    setMobileColumn(form.columnId);
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
          description="Arraste as demandas entre as etapas. A coluna fica salva e não volta sozinha."
          meta={`${demandas.length} demanda${demandas.length === 1 ? '' : 's'}`}
          actions={
            <>
              <ViewSwitch />
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
            Em andamento acima de 5 itens fica apertado. Bloqueadas saem do fluxo até o impedimento acabar.
          </p>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
          {KANBAN_COLUMNS.map((column) => (
            <button
              key={column.id}
              type="button"
              onClick={() => setMobileColumn(column.id)}
              className={`glass-button shrink-0 rounded-full px-3 py-1.5 text-xs ${
                mobileColumn === column.id ? 'glass-button-primary' : 'glass-button-secondary'
              }`}
            >
              {column.title} {board[column.id].length}
            </button>
          ))}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setDraft(null);
          }}
        >
          <div className="kanban-scroll flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((column) => {
              const tasks = visible(board[column.id] || []);
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
                  mobileActive={mobileColumn === column.id}
                  onMoveAll={(columnId) => moveColumn(column.id, columnId)}
                >
                  <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                      <SortableCard
                        key={task.id}
                        id={task.id}
                        item={task}
                        onOpen={() => setCurrent(task)}
                        onMove={(columnId) => moveToColumn(task.id, columnId)}
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
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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

      <Modal isOpen={!!current} title="Demanda" onClose={() => setCurrent(null)}>
        {current && (
          <div className="space-y-4">
            <TaskFields value={current} onChange={(value) => setCurrent({ ...current, ...value })} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="destructive" onClick={removeTask}>Excluir</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCurrent(null)}>Cancelar</Button>
                <Button onClick={saveTask}>Salvar</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
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
          <input className="havk-field px-3 py-2.5" value={value.responsavel || ''} onChange={(event) => set({ responsavel: event.target.value })} />
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
