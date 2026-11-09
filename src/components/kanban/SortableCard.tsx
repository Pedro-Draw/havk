import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCardProps {
  id: string;
  item: {
    id: string;
    title?: string;
    description?: string;
    priority?: string;
    createdAt?: string;
    createdBy?: string;
    creatorAvatar?: string | null;
    empresaName?: string;
  };
  onOpen: () => void;
}

const priorityClass: Record<string, string> = {
  baixa: 'bg-emerald-500/15 text-emerald-700',
  media: 'bg-amber-500/15 text-amber-700',
  alta: 'bg-orange-500/15 text-orange-700',
  urgente: 'bg-red-500/15 text-red-700',
};

function formatCreated(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

export default function SortableCard({ id, item, onOpen }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id,
    transition: { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  });
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const priority = item.priority?.toLowerCase() || 'media';
  const initial = (item.createdBy || '?').slice(0, 1).toUpperCase();

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`kanban-card rounded-2xl p-3 ${isDragging ? 'z-10 opacity-90' : ''}`}
      onPointerDown={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const origin = pointer.current;
        const moved = origin
          ? Math.abs(event.clientX - origin.x) > 6 || Math.abs(event.clientY - origin.y) > 6
          : false;
        if (!moved && !isDragging) onOpen();
      }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 grid h-7 w-7 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--text-muted)] active:cursor-grabbing"
          aria-label="Segurar e arrastar"
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{item.title || 'Sem título'}</h3>
          {item.description && (
            <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{item.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            {item.creatorAvatar ? (
              <img src={item.creatorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--hover)] text-[10px] font-semibold">{initial}</span>
            )}
            <span>{formatCreated(item.createdAt) || 'Sem data'}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityClass[priority] || priorityClass.media}`}>
              {priority}
            </span>
            {item.empresaName && <span className="truncate text-[11px] text-[var(--text-muted)]">{item.empresaName}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
