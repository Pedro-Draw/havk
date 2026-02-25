import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '../../i18n/useTranslation';
import { Calendar, Clock, User } from 'lucide-react';

interface SortableCardProps {
  id: string | number;
  item: any; // tipo da demanda
}

export default function SortableCard({ id, item }: SortableCardProps) {
  const { t, translateUserContent } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    scale: isDragging ? 1.03 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-zinc-800 rounded-lg border border-zinc-700 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'ring-2 ring-zinc-500 ring-offset-2 ring-offset-zinc-950' : ''
      }`}
    >
      <h3 className="font-medium text-zinc-100 truncate">
        {translateUserContent(item.title || 'Sem título')}
      </h3>

      {item.description && (
        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
          {translateUserContent(item.description)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        {item.prioridade && (
          <span className="px-2 py-0.5 rounded-full bg-zinc-700">
            {item.prioridade}
          </span>
        )}

        {item.prazo && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(item.prazo).toLocaleDateString()}
          </span>
        )}

        {item.responsavel && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {item.responsavel}
          </span>
        )}

        {item.tempoEstimado && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {item.tempoEstimado} min
          </span>
        )}
      </div>
    </div>
  );
}