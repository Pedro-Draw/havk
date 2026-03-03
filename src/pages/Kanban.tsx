import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

import { getAll, addItem, updateItem } from '../db/indexedDB'
import SortableCard from '../components/kanban/SortableCard'
import Button from '../components/ui/Button'

/* =========================
   TYPES
========================= */

type Status =
  | 'backlog'
  | 'afazer'
  | 'andamento'
  | 'teste'
  | 'concluida'

interface Attachment {
  name: string
  url: string
}

interface Task {
  id: string
  title: string
  description: string
  status: Status
  tipo: string
  prioridade: string
  prazo: string
  tempoEstimado: number | null
  responsavel: string | null
  labels: string[]
  dependencias: string
  ambiente: string
  criteriosAceitacao: string[]
  subtarefas: string[]
  riscos: string
  attachments: Attachment[]

  // 🔥 novos campos
  comentarios: string[]
  historico: string[]
  createdAt: string
  updatedAt: string
}

type Columns = Record<Status, Task[]>

/* =========================
   MODAL
========================= */

interface ModalProps {
  title: string
  children: React.ReactNode
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
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
          <Button
            onClick={onConfirm ?? onClose}
            className="w-full"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* =========================
   KANBAN
========================= */

export default function Kanban() {
  const [columns, setColumns] = useState<Columns>({
    backlog: [],
    afazer: [],
    andamento: [],
    teste: [],
    concluida: [],
  })

  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)

  const emptyTask: Task = {
    id: '',
    title: '',
    description: '',
    status: 'backlog',
    tipo: 'Nova Feature',
    prioridade: 'Média',
    prazo: new Date().toISOString(),
    tempoEstimado: null,
    responsavel: null,
    labels: [],
    dependencias: '',
    ambiente: 'Web',
    criteriosAceitacao: [''],
    subtarefas: [''],
    riscos: '',
    attachments: [],
    comentarios: [],
    historico: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const [newTaskData, setNewTaskData] = useState<Task>({
    ...emptyTask,
  })

  /* =========================
     SENSORS
  ========================= */

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    const load = async () => {
      const demandas = (await getAll('demandas')) as Task[]

      const grouped: Columns = {
        backlog: [],
        afazer: [],
        andamento: [],
        teste: [],
        concluida: [],
      }

      demandas.forEach((d) => {
        if (grouped[d.status]) {
          grouped[d.status].push(d)
        }
      })

      setColumns(grouped)
    }

    load()
  }, [])

  /* =========================
     FIND CONTAINER
  ========================= */

  const findContainer = (id: string): Status | undefined => {
    if (id in columns) return id as Status

    return (Object.keys(columns) as Status[]).find((key) =>
      columns[key].some((item) => item.id === id)
    )
  }

  /* =========================
     DRAG END (FIX COMPLETO)
  ========================= */

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceColumn = findContainer(activeId)
    const targetColumn = findContainer(overId)

    if (!sourceColumn || !targetColumn) return

    const sourceItems = columns[sourceColumn]
    const targetItems = columns[targetColumn]

    const sourceIndex = sourceItems.findIndex(
      (item) => item.id === activeId
    )

    // 🔥 REORDER NA MESMA COLUNA
    if (sourceColumn === targetColumn) {
      const overIndex = targetItems.findIndex(
        (item) => item.id === overId
      )

      if (sourceIndex !== overIndex) {
        const reordered = arrayMove(
          sourceItems,
          sourceIndex,
          overIndex
        )

        setColumns((prev) => ({
          ...prev,
          [sourceColumn]: reordered,
        }))
      }

      return
    }

    // 🔥 MOVER ENTRE COLUNAS LIVREMENTE
    const movingItem = sourceItems[sourceIndex]

    const updatedItem: Task = {
      ...movingItem,
      status: targetColumn,
      updatedAt: new Date().toISOString(),
      historico: [
        ...movingItem.historico,
        `Movido para ${targetColumn} em ${new Date().toLocaleString()}`,
      ],
    }

    await updateItem('demandas', updatedItem)

    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter(
        (item) => item.id !== activeId
      ),
      [targetColumn]: [...prev[targetColumn], updatedItem],
    }))
  }

  /* =========================
     CREATE TASK
  ========================= */

  const createNewTask = async () => {
    if (!newTaskData.title.trim()) return

    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      historico: [
        `Criada em ${new Date().toLocaleString()}`,
      ],
    }

    await addItem('demandas', newTask)

    setColumns((prev) => ({
      ...prev,
      [newTask.status]: [...prev[newTask.status], newTask],
    }))

    setNewTaskData({ ...emptyTask })
    setShowNewModal(false)
  }

  /* =========================
     SAVE DETAIL
  ========================= */

  const saveTask = async () => {
    if (!currentTask) return

    const updated: Task = {
      ...currentTask,
      updatedAt: new Date().toISOString(),
    }

    await updateItem('demandas', updated)

    setColumns((prev) => ({
      ...prev,
      [updated.status]: prev[updated.status].map((t) =>
        t.id === updated.id ? updated : t
      ),
    }))

    setShowDetailModal(false)
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div className="max-w-7xl mx-auto pb-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Kanban
            </h1>
            <Button onClick={() => setShowNewModal(true)}>
              + Nova Demanda
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-6">
              {(Object.keys(columns) as Status[]).map((columnId) => {
                const items = columns[columnId]

                return (
                  <div
                    key={columnId}
                    id={columnId}
                    className="min-w-[320px] w-80 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex flex-col shadow-lg"
                  >
                    <h2 className="text-lg font-semibold text-white mb-4 capitalize">
                      {columnId}
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
                              setCurrentTask(item)
                              setShowDetailModal(true)
                              // Alternativa: navigate(`/demandas/${item.id}`)
                            }}
                          >
                            <SortableCard
                              id={item.id}
                              item={item}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>

                    <p className="text-xs text-zinc-500 mt-3 pt-2 border-t border-zinc-800">
                      {items.length} tarefas
                    </p>
                  </div>
                )
              })}
            </div>
          </DndContext>

          {/* NEW TASK MODAL */}
          {showNewModal && (
            <Modal
              title="Nova Demanda"
              onClose={() => setShowNewModal(false)}
              onConfirm={createNewTask}
              confirmLabel="Criar Demanda"
            >
              <input
                type="text"
                placeholder="Título"
                value={newTaskData.title}
                onChange={(e) =>
                  setNewTaskData({
                    ...newTaskData,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
              />
              {/* Adicione aqui os outros campos do formulário quando quiser expandir */}
            </Modal>
          )}

          {/* DETAIL MODAL */}
          {showDetailModal && currentTask && (
            <Modal
              title={currentTask.title}
              onClose={() => setShowDetailModal(false)}
              onConfirm={saveTask}
              confirmLabel="Salvar Alterações"
            >
              <input
                type="text"
                value={currentTask.title}
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
              />
              {/* Adicione aqui os outros campos editáveis */}
            </Modal>
          )}
        </div>
      </div>
    </div>
  )
}