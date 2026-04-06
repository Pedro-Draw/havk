// pages/Kanban.tsx
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import toast from 'react-hot-toast';

import SortableCard from '../components/kanban/SortableCard';
import Button from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { DemandaTipo } from './DemandaDetail'; // ajuste o path se necessário

/* Mapeamento colunas Kanban → status do store */
const columnToStatus: Record<string, string> = {
  backlog: 'aberta',
  afazer: 'aberta',
  andamento: 'em-progresso',
  teste: 'em-progresso',
  concluida: 'concluida',
};

const statusToColumn: Record<string, string> = {
  aberta: 'backlog',
  'em-progresso': 'andamento',
  concluida: 'concluida',
  bloqueada: 'backlog',
};

/* Tipagem compatível com o store */
interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: string; // coluna kanban
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  prazo?: string;           // agora string "YYYY-MM-DD" no frontend
  responsavel?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  tipo?: DemandaTipo;
  dificuldade?: string;
  esforcoEstimado?: number;
}

/* Modal genérico */
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}

function Modal({ title, children, onClose, onConfirm, confirmLabel = 'Salvar' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-zinc-700">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl font-bold">
            ×
          </button>
        </div>
        <div className="flex-1 px-6 py-6 overflow-y-auto">{children}</div>
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {onConfirm && <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>}
        </div>
      </div>
    </div>
  );
}

/* Coluna droppable com highlight forte ao passar por cima */
function KanbanColumn({
  id,
  title,
  tasks,
  children,
}: {
  id: string;
  title: string;
  tasks: KanbanTask[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column' },
  });

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`min-w-[340px] w-96 bg-zinc-900/70 backdrop-blur-md border-2 rounded-2xl p-5 flex flex-col shadow-xl transition-all duration-200 ${
        isOver 
          ? 'border-indigo-500 border-dashed bg-indigo-950/30 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-zinc-950' 
          : 'border-zinc-800'
      }`}
    >
      <h2 className="text-xl font-bold text-white mb-5 capitalize flex items-center justify-between">
        {title}
        <span className="text-zinc-500 text-sm font-normal">({tasks.length})</span>
      </h2>

      <div className="flex-1 space-y-4 min-h-[500px]">
        {tasks.length === 0 && (
          <div className={`h-32 flex items-center justify-center text-zinc-600 italic text-sm transition-all ${
            isOver ? 'text-indigo-400 scale-110' : ''
          }`}>
            Solte uma demanda aqui
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Formata a data ISO (vinda do banco) para string "YYYY-MM-DD" correta no fuso local
 * Evita o problema de aparecer 1 dia antes
 */
function formatDateForInput(isoString?: string): string | undefined {
  if (!isoString) return undefined;

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return undefined;

    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    console.warn('Data inválida ao formatar para input:', isoString);
    return undefined;
  }
}

/* Converte "YYYY-MM-DD" do input → ISO string salva no banco (meia-noite local) */
function localDateStringToISOString(dateStr: string): string {
  // Cria data no fuso local, meia-noite
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  return localDate.toISOString();
}

/* Kanban principal */
export default function Kanban() {
  const { demandas, addDemanda, updateDemanda, deleteDemanda, isLoading } = useAppStore();

  const [columns, setColumns] = useState<Record<string, KanbanTask[]>>({
    backlog: [],
    afazer: [],
    andamento: [],
    teste: [],
    concluida: [],
  });

  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<KanbanTask | null>(null);

  const emptyTask: Partial<KanbanTask> = {
    title: '',
    description: '',
    priority: 'media',
    prazo: '',
    responsavel: '',
    tipo: 'feature',
    dificuldade: 'media',
    esforcoEstimado: 0,
  };

  const [newTaskData, setNewTaskData] = useState<Partial<KanbanTask>>(emptyTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const deleteTask = async () => {
    if (!currentTask) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a demanda "${currentTask.title}"?`
    );

    if (!confirmDelete) return;

    try {
      await deleteDemanda(currentTask.id);

      setColumns((prev) => {
        const newCols: Record<string, KanbanTask[]> = {};

        Object.entries(prev).forEach(([colId, tasks]) => {
          newCols[colId] = tasks.filter((t) => t.id !== currentTask.id);
        });

        return newCols;
      });

      toast.success('Demanda excluída com sucesso');
      setShowDetailModal(false);
      setCurrentTask(null);
    } catch (err) {
      toast.error('Erro ao excluir demanda');
      console.error(err);
    }
  };

  // Sincroniza demandas do store para colunas
  useEffect(() => {
    if (isLoading || !demandas?.length) return;

    const grouped: Record<string, KanbanTask[]> = {
      backlog: [],
      afazer: [],
      andamento: [],
      teste: [],
      concluida: [],
    };

    const seenIds = new Set<string>();

    demandas.forEach((dem) => {
      if (seenIds.has(dem.id)) return;
      seenIds.add(dem.id);

      const col = statusToColumn[dem.status] || 'backlog';

      grouped[col].push({
        id: dem.id,
        title: dem.title?.replace(/^Havk AI translated:\s*/i, '') || dem.title || '',
        description: dem.description,
        status: col,
        priority: dem.priority,
        prazo: formatDateForInput(dem.prazo),           // ← aqui a correção principal
        responsavel: dem.responsavel,
        createdBy: dem.createdBy,
        createdAt: dem.createdAt,
        updatedAt: dem.updatedAt,
        tipo: dem.tipo,
        dificuldade: dem.dificuldade,
        esforcoEstimado: dem.esforcoEstimado,
      });
    });

    setColumns((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(grouped)) return prev;
      return grouped;
    });
  }, [demandas, isLoading]);

  const findContainer = (id: string): string | undefined => {
    if (id in columns) return id;
    for (const [colId, items] of Object.entries(columns)) {
      if (items.some((item) => item.id === id)) return colId;
    }
    return undefined;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let sourceColumnId = findContainer(activeId);
    let targetColumnId = findContainer(overId);

    if (!targetColumnId && Object.keys(columns).includes(overId)) {
      targetColumnId = overId;
    }

    if (!sourceColumnId || !targetColumnId) return;

    if (sourceColumnId === targetColumnId) {
      const sourceItems = [...columns[sourceColumnId]];
      const targetIndex = sourceItems.findIndex((item) => item.id === overId);
      const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);

      if (sourceIndex !== targetIndex && targetIndex !== -1) {
        const reordered = arrayMove(sourceItems, sourceIndex, targetIndex);
        setColumns((prev) => ({ ...prev, [sourceColumnId]: reordered }));
      }
      return;
    }

    const movingTask = columns[sourceColumnId].find((item) => item.id === activeId);
    if (!movingTask) return;

    const newStatus = columnToStatus[targetColumnId] as any;

    try {
      await updateDemanda(activeId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setColumns((prev) => {
        const newColumns: Record<string, KanbanTask[]> = {};

        Object.entries(prev).forEach(([colId, tasks]) => {
          newColumns[colId] = tasks.filter((t) => t.id !== activeId);
        });

        newColumns[targetColumnId].push({
          ...movingTask,
          status: targetColumnId,
        });

        return newColumns;
      });

      toast.success(`Movido para ${targetColumnId}`);
    } catch (err) {
      toast.error('Erro ao mover tarefa');
      console.error(err);
      setColumns((prev) => ({ ...prev }));
    }
  };

  const createNewTask = async () => {
    if (!newTaskData.title?.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const prazoISO = newTaskData.prazo
        ? localDateStringToISOString(newTaskData.prazo)
        : undefined;

      await addDemanda({
        title: newTaskData.title.trim(),
        description: newTaskData.description?.trim() || '',
        priority: newTaskData.priority || 'media',
        status: 'aberta',
        prazo: prazoISO,
        responsavel: newTaskData.responsavel || undefined,
        tipo: (newTaskData.tipo || 'feature') as any,
        dificuldade: (newTaskData.dificuldade || 'media') as any,
        esforcoEstimado: newTaskData.esforcoEstimado || 0,
        createdBy: 'Pedrin',
        updatedAt: new Date().toISOString(),
      });

      toast.success('Demanda criada com sucesso!');
      setNewTaskData(emptyTask);
      setShowNewModal(false);
    } catch (err) {
      toast.error('Erro ao criar demanda');
      console.error(err);
    }
  };

  const saveTaskDetail = async () => {
    if (!currentTask) return;

    try {
      const prazoISO = currentTask.prazo
        ? localDateStringToISOString(currentTask.prazo)
        : undefined;

      await updateDemanda(currentTask.id, {
        title: currentTask.title.trim(),
        description: currentTask.description?.trim() || '',
        priority: currentTask.priority,
        prazo: prazoISO,
        responsavel: currentTask.responsavel || undefined,
        tipo: currentTask.tipo as any,
        dificuldade: currentTask.dificuldade as any,
        esforcoEstimado: currentTask.esforcoEstimado || 0,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Demanda atualizada');
      setShowDetailModal(false);
      setCurrentTask(null);
    } catch (err) {
      toast.error('Erro ao salvar alterações');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto pb-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Kanban</h1>
            <Button onClick={() => setShowNewModal(true)}>+ Nova Demanda</Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
              {Object.entries(columns).map(([columnId, tasks]) => (
                <KanbanColumn key={columnId} id={columnId} title={columnId} tasks={tasks}>
                  <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setCurrentTask(task);
                          setShowDetailModal(true);
                        }}
                        className="cursor-pointer"
                      >
                        <SortableCard id={task.id} item={task} />
                      </div>
                    ))}
                  </SortableContext>
                </KanbanColumn>
              ))}
            </div>
          </DndContext>

          {/* Modal Nova Demanda */}
          {showNewModal && (
            <Modal
              title="Criar Nova Demanda"
              onClose={() => {
                setShowNewModal(false);
                setNewTaskData(emptyTask);
              }}
              onConfirm={createNewTask}
              confirmLabel="Criar Demanda"
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Título *</label>
                  <input
                    type="text"
                    value={newTaskData.title ?? ''}
                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: Implementar login com Google"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Descrição</label>
                  <textarea
                    value={newTaskData.description ?? ''}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                    className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Detalhes, requisitos, contexto..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Tipo</label>
                    <select
                      value={newTaskData.tipo ?? 'feature'}
                      onChange={(e) => setNewTaskData({ ...newTaskData, tipo: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bug">Bug / Erro</option>
                      <option value="feature">Nova Feature</option>
                      <option value="melhoria">Melhoria</option>
                      <option value="inovacao">Inovação</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Dificuldade</label>
                    <select
                      value={newTaskData.dificuldade ?? 'media'}
                      onChange={(e) => setNewTaskData({ ...newTaskData, dificuldade: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="muito-facil">Muito Fácil</option>
                      <option value="facil">Fácil</option>
                      <option value="media">Média</option>
                      <option value="dificil">Difícil</option>
                      <option value="muito-dificil">Muito Difícil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prioridade</label>
                    <select
                      value={newTaskData.priority ?? 'media'}
                      onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Esforço estimado (horas)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTaskData.esforcoEstimado ?? 0}
                      onChange={(e) => setNewTaskData({ ...newTaskData, esforcoEstimado: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prazo</label>
                    <input
                      type="date"
                      value={newTaskData.prazo ?? ''}
                      onChange={(e) => setNewTaskData({ ...newTaskData, prazo: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Responsável</label>
                    <input
                      type="text"
                      value={newTaskData.responsavel ?? ''}
                      onChange={(e) => setNewTaskData({ ...newTaskData, responsavel: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="Nome ou email"
                    />
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {/* Modal Detalhe / Edição */}
          {showDetailModal && currentTask && (
            <Modal
              title={currentTask.title || 'Detalhes da Demanda'}
              onClose={() => {
                setShowDetailModal(false);
                setCurrentTask(null);
              }}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Título</label>
                  <input
                    type="text"
                    value={currentTask.title}
                    onChange={(e) =>
                      setCurrentTask((p) => (p ? { ...p, title: e.target.value } : null))
                    }
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Descrição</label>
                  <textarea
                    value={currentTask.description ?? ''}
                    onChange={(e) =>
                      setCurrentTask((p) =>
                        p ? { ...p, description: e.target.value } : null
                      )
                    }
                    className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white resize-none focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prioridade</label>
                    <select
                      value={currentTask.priority}
                      onChange={(e) =>
                        setCurrentTask((p) =>
                          p ? { ...p, priority: e.target.value as any } : null
                        )
                      }
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prazo</label>
                    <input
                      type="date"
                      value={currentTask.prazo ?? ''}
                      onChange={(e) =>
                        setCurrentTask((p) =>
                          p ? { ...p, prazo: e.target.value } : null
                        )
                      }
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Responsável</label>
                    <input
                      type="text"
                      value={currentTask.responsavel ?? ''}
                      onChange={(e) =>
                        setCurrentTask((p) =>
                          p ? { ...p, responsavel: e.target.value } : null
                        )
                      }
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Tipo</label>
                    <select
                      value={currentTask.tipo ?? 'feature'}
                      onChange={(e) =>
                        setCurrentTask((p) =>
                          p ? { ...p, tipo: e.target.value as any } : null
                        )
                      }
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="melhoria">Melhoria</option>
                      <option value="inovacao">Inovação</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                  <Button
                    variant="destructive"
                    onClick={deleteTask}
                    className="flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDetailModal(false);
                        setCurrentTask(null);
                      }}
                    >
                      Cancelar
                    </Button>

                    <Button variant="primary" onClick={saveTaskDetail}>
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}