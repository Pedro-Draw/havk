import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, User } from 'lucide-react';
import { KANBAN_COLUMNS, formatPrazoLabel, isPrazoOverdue } from '../../lib/kanban';

interface SortableCardProps {
  id: string;
  item: {
    id: string;
    title?: string;
    description?: string;
    priority?: string;
    prazo?: string;
    responsavel?: string;
    esforcoEstimado?: number;
    columnId?: string;
    empresaName?: string;
  };
  onOpen: () => void;
  onMove: (columnId: string) => void;
}

const priorityClass: Record<string, string> = {
  baixa: 'bg-emerald-500/15 text-emerald-300',
  media: 'bg-amber-500/15 text-amber-300',
  alta: 'bg-orange-500/15 text-orange-300',
  urgente: 'bg-red-500/15 text-red-300',
};

export default function SortableCard({ id, item, onOpen, onMove }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const overdue = isPrazoOverdue(item.prazo, item.columnId);
  const priority = item.priority?.toLowerCase() || 'media';

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: 'var(--card-elevated)',
        borderColor: 'var(--border)',
        touchAction: 'none',
      }}
      className={`kanban-card cursor-grab touch-manipulation rounded-2xl border p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? 'z-10 opacity-80 ring-2 ring-violet-400' : ''
      }`}
      {...attributes}
      {...listeners}
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
      <h3 className="text-sm font-medium leading-5">{item.title || 'Sem título'}</h3>
      {item.empresaName && (
        <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">{item.empresaName}</p>
      )}
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{item.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${priorityClass[priority] || priorityClass.media}`}>
          {priority}
        </span>
        {item.prazo && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-300' : 'text-[var(--text-muted)]'}`}>
            <Calendar size={12} />
            {formatPrazoLabel(item.prazo)}
          </span>
        )}
        {item.responsavel && (
          <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
            <User size={12} />
            {item.responsavel}
          </span>
        )}
        {!!item.esforcoEstimado && (
          <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
            <Clock size={12} />
            {item.esforcoEstimado}h
          </span>
        )}
        {overdue && <span className="font-medium text-red-300">Atrasada</span>}
      </div>
      <label className="mt-3 block text-[11px] text-[var(--text-muted)]">
        Mover para
        <select
          aria-label="Mover para"
          value={item.columnId || 'backlog'}
          className="havk-field mt-1 min-h-11 w-full text-sm"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            if (event.target.value !== item.columnId) onMove(event.target.value);
          }}
        >
          {KANBAN_COLUMNS.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
