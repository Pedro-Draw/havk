import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from '../i18n/useTranslation';
import { getAll, updateItem } from '../db/indexedDB';
import SortableCard from '../components/kanban/SortableCard'; // você precisará criar esse componente depois

export default function Kanban() {
  const { t } = useTranslation();
  const [columns, setColumns] = useState({
    backlog: [],
    afazer: [],
    andamento: [],
    conclusao: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadDemandas = async () => {
      const demandas = await getAll<any>('demandas');
      const grouped = {
        backlog: demandas.filter((d) => d.status === 'backlog'),
        afazer: demandas.filter((d) => d.status === 'a-fazer'),
        andamento: demandas.filter((d) => d.status === 'em-andamento'),
        conclusao: demandas.filter((d) => d.status === 'concluida'),
      };
      setColumns(grouped);
    };
    loadDemandas();
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const oldColumn = columns[activeContainer];
    const newColumn = columns[overContainer];

    const activeIndex = oldColumn.findIndex((item) => item.id === active.id);
    const item = oldColumn[activeIndex];

    // Move para nova coluna
    const updatedItem = { ...item, status: overContainer.replace(' ', '-') };
    await updateItem('demandas', updatedItem);

    setColumns((prev) => ({
      ...prev,
      [activeContainer]: prev[activeContainer].filter((i) => i.id !== active.id),
      [overContainer]: [...prev[overContainer], updatedItem],
    }));
  };

  const findContainer = (id) => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) =>
      columns[key].some((item) => item.id === id)
    );
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">{t('kanban')}</h1>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(columns).map(([columnId, items]) => (
              <div key={columnId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4 capitalize">
                  {t(columnId) || columnId}
                </h2>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 min-h-[400px]">
                    {items.map((item) => (
                      <SortableCard key={item.id} id={item.id} item={item} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}