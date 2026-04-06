// components/kanban/SortableCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, User, GripVertical } from 'lucide-react';

interface SortableCardProps {
  id: string | number;
  item: any;
}

export default function SortableCard({ id, item }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString({
      x: transform?.x || 0,
      y: transform?.y || 0,
      scaleX: isDragging ? 1.02 : 1,
      scaleY: isDragging ? 1.02 : 1,
    } as any),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const isOverdue =
    item.prazo && new Date(item.prazo) < new Date() && item.status !== 'concluida';

  const prioridadeColor = {
    baixa: 'bg-emerald-700/40 text-emerald-400',
    media: 'bg-yellow-700/40 text-yellow-400',
    alta: 'bg-orange-700/40 text-orange-400',
    urgente: 'bg-red-700/40 text-red-400', // corrigi 'critica' para 'urgente' (compatível com seu enum)
  }[(item.priority?.toLowerCase() as any)] || 'bg-zinc-700 text-zinc-300';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-4 bg-zinc-800 rounded-xl border border-zinc-700 shadow-sm transition-all
        hover:shadow-lg hover:border-zinc-600
        ${isDragging ? 'ring-2 ring-zinc-500 ring-offset-2 ring-offset-zinc-950 shadow-xl' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 text-zinc-500 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Título - SEM TRADUÇÃO AUTOMÁTICA */}
      <h3 className="font-medium text-zinc-100 truncate pr-6">
        {item.title || 'Sem título'}
      </h3>

      {/* Descrição - SEM TRADUÇÃO AUTOMÁTICA */}
      {item.description && (
        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {item.priority && (
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${prioridadeColor}`}
          >
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>
        )}

        {item.prazo && (
          <span
            className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {new Date(item.prazo).toLocaleDateString('pt-BR')}
          </span>
        )}

        {item.responsavel && (
          <span className="flex items-center gap-1 text-zinc-400">
            <User className="w-3.5 h-3.5" />
            {item.responsavel}
          </span>
        )}

        {item.esforcoEstimado && (
          <span className="flex items-center gap-1 text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            {item.esforcoEstimado} h
          </span>
        )}
      </div>

      {/* Indicador de atraso */}
      {isOverdue && (
        <div className="absolute bottom-2 right-3 text-[10px] text-red-400 font-medium">
          Atrasada
        </div>
      )}
    </div>
  );
}