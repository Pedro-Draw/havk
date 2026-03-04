// pages/Kanban.tsx
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

/* =========================
   Mapeamento de status Kanban → status do store
========================= */
const statusMap: Record<string, string> = {
  backlog: 'aberta',
  afazer: 'aberta',
  andamento: 'em-progresso',
  teste: 'em-progresso',
  concluida: 'concluida',
};

const reverseStatusMap: Record<string, string> = {
  aberta: 'backlog',        // ou 'afazer' — escolha o default que preferir
  'em-progresso': 'andamento',
  concluida: 'concluida',
  bloqueada: 'backlog',     // ou outra coluna que faça sentido
};

/* =========================
   Tipagem compatível com Demanda do store
========================= */
interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: string;           // 'backlog' | 'afazer' | 'andamento' | 'teste' | 'concluida'
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  prazo?: string;
  assignee?: string | null;
  createdAt: string;
  updatedAt?: string;
  // campos opcionais que você já tinha
  tipo?: string;
  tempoEstimado?: number | null;
  labels?: string[];
  dependencias?: string;
  ambiente?: string;
  criteriosAceitacao?: string[];
  subtarefas?: string[];
  riscos?: string;
  attachments?: { name: string; url: string }[];
  comentarios?: string[];
  historico?: string[];
}

/* =========================
   Modal genérico (mantido quase igual)
========================= */
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}

function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Salvar',
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto">{children}</div>

        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
          <Button onClick={onConfirm ?? onClose} className="w-full">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   KANBAN PRINCIPAL
========================= */
export default function Kanban() {
  const { demandas, addDemanda, updateDemanda, isLoading } = useAppStore();

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
    assignee: null,
    tipo: 'Nova Feature',
    tempoEstimado: null,
    labels: [],
    dependencias: '',
    ambiente: 'Web',
    criteriosAceitacao: [''],
    subtarefas: [''],
    riscos: '',
    attachments: [],
    comentarios: [],
    historico: [],
  };

  const [newTaskData, setNewTaskData] = useState<Partial<KanbanTask>>(emptyTask);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Agrupa demandas nas colunas do Kanban
  useEffect(() => {
    if (isLoading) return;

    const grouped: Record<string, KanbanTask[]> = {
      backlog: [],
      afazer: [],
      andamento: [],
      teste: [],
      concluida: [],
    };

    demandas.forEach((demanda) => {
      const kanbanStatus = reverseStatusMap[demanda.status] || 'backlog';
      if (grouped[kanbanStatus]) {
        grouped[kanbanStatus].push({
          id: demanda.id,
          title: demanda.title,
          description: demanda.description,
          status: kanbanStatus,
          priority: demanda.priority,
          prazo: demanda.prazo,
          assignee: demanda.assignee,
          createdAt: demanda.createdAt,
          updatedAt: demanda.updatedAt,
          // outros campos opcionais podem ser adicionados conforme necessário
        });
      }
    });

    setColumns(grouped);
  }, [demandas, isLoading]);

  const findContainer = (id: string): string | undefined => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) =>
      columns[key].some((item) => item.id === id)
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumnId = findContainer(activeId);
    const targetColumnId = findContainer(overId);

    if (!sourceColumnId || !targetColumnId) return;

    const sourceItems = columns[sourceColumnId];
    const targetItems = columns[targetColumnId];

    const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);

    // Reordenação dentro da mesma coluna (ainda não persistimos ordem)
    if (sourceColumnId === targetColumnId) {
      if (sourceIndex !== targetItems.findIndex((item) => item.id === overId)) {
        const reordered = arrayMove(sourceItems, sourceIndex, targetItems.findIndex((item) => item.id === overId));
        setColumns((prev) => ({
          ...prev,
          [sourceColumnId]: reordered,
        }));
      }
      return;
    }

    // Movendo entre colunas → atualiza status no store
    const movingTask = sourceItems[sourceIndex];
    const newStatus = statusMap[targetColumnId] as 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada';

    try {
      await updateDemanda(activeId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        // Opcional: adicionar ao historico se você tiver implementado no store
      });

      setColumns((prev) => ({
        ...prev,
        [sourceColumnId]: prev[sourceColumnId].filter((item) => item.id !== activeId),
        [targetColumnId]: [
          ...prev[targetColumnId],
          { ...movingTask, status: targetColumnId },
        ],
      }));

      toast.success(`Movido para ${targetColumnId}`);
    } catch (err) {
      toast.error('Erro ao mover tarefa');
      console.error(err);
    }
  };

  const createNewTask = async () => {
    if (!newTaskData.title?.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const newId = await addDemanda({
        title: newTaskData.title.trim(),
        description: newTaskData.description?.trim(),
        priority: newTaskData.priority || 'media',
        status: 'aberta', // sempre começa em backlog/aberta
        prazo: newTaskData.prazo || undefined,
        assignee: newTaskData.assignee || undefined,
        // outros campos podem ser adicionados aqui
      });

      // O useEffect que agrupa demandas já vai atualizar as colunas automaticamente
      toast.success('Demanda criada');
      setNewTaskData(emptyTask);
      setShowNewModal(false);
    } catch (err) {
      toast.error('Erro ao criar demanda');
    }
  };

  const saveTaskDetail = async () => {
    if (!currentTask) return;

    try {
      await updateDemanda(currentTask.id, {
        title: currentTask.title.trim(),
        description: currentTask.description?.trim(),
        // adicione outros campos editáveis aqui
        updatedAt: new Date().toISOString(),
      });

      // O useEffect vai refletir a mudança
      toast.success('Demanda atualizada');
      setShowDetailModal(false);
    } catch (err) {
      toast.error('Erro ao salvar alterações');
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Kanban</h1>
            <Button onClick={() => setShowNewModal(true)}>+ Nova Demanda</Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-6">
              {(Object.keys(columns) as (keyof typeof columns)[]).map((columnId) => {
                const items = columns[columnId];

                return (
                  <div
                    key={columnId}
                    id={columnId}
                    className="min-w-[320px] w-80 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex flex-col shadow-lg"
                  >
                    <h2 className="text-lg font-semibold text-white mb-4 capitalize">
                      {columnId} <span className="text-zinc-500 text-sm">({items.length})</span>
                    </h2>

                    <SortableContext
                      items={items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3 min-h-[400px]">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setCurrentTask(item);
                              setShowDetailModal(true);
                            }}
                          >
                            <SortableCard id={item.id} item={item} />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>

          {/* Modal Nova Demanda */}
          {showNewModal && (
            <Modal
              title="Nova Demanda"
              onClose={() => setShowNewModal(false)}
              onConfirm={createNewTask}
              confirmLabel="Criar Demanda"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Título *"
                  value={newTaskData.title ?? ''}
                  onChange={(e) =>
                    setNewTaskData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  placeholder="Descrição"
                  value={newTaskData.description ?? ''}
                  onChange={(e) =>
                    setNewTaskData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full h-28 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                {/* Pode adicionar mais campos aqui: prioridade, prazo, responsável, etc. */}
              </div>
            </Modal>
          )}

          {/* Modal Detalhe / Edição */}
          {showDetailModal && currentTask && (
            <Modal
              title={currentTask.title || 'Sem título'}
              onClose={() => setShowDetailModal(false)}
              onConfirm={saveTaskDetail}
              confirmLabel="Salvar Alterações"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  value={currentTask.title}
                  onChange={(e) =>
                    setCurrentTask((prev) => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  value={currentTask.description ?? ''}
                  onChange={(e) =>
                    setCurrentTask((prev) => prev ? { ...prev, description: e.target.value } : null)
                  }
                  className="w-full h-32 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                {/* Expanda com mais campos editáveis conforme necessário */}
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}