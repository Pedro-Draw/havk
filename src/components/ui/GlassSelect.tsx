import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface GlassSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function GlassSelect({ label, value, options, onChange, placeholder = 'Digite para buscar' }: GlassSelectProps) {
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [place, setPlace] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find((option) => option.value === value);
  const term = query.trim().toLowerCase();
  const visible = options.filter((option) => !term || option.label.toLowerCase().includes(term));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!boxRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    const position = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPlace({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    const onAnother = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== listId) setOpen(false);
    };
    position();
    window.addEventListener('havk-glass-select', onAnother);
    window.dispatchEvent(new CustomEvent('havk-glass-select', { detail: listId }));
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      window.removeEventListener('havk-glass-select', onAnother);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, [open, listId]);

  const choose = (next: string) => {
    onChange(next);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor={listId}>{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={listId}
          className="glass-field"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          autoComplete="off"
          placeholder={placeholder}
          value={open ? query : (selected?.label && selected.value ? selected.label : '')}
          onFocus={() => {
            setOpen(true);
            setQuery('');
            setActiveIndex(Math.max(0, visible.findIndex((option) => option.value === value)));
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && open && visible[activeIndex]) {
              event.preventDefault();
              choose(visible[activeIndex].value);
            } else if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
      {open && (
        <div
          ref={listRef}
          id={`${listId}-list`}
          role="listbox"
          data-float-panel
          className="glass-popover z-[80] max-h-56 overflow-y-auto rounded-2xl p-1.5"
          style={{ position: 'fixed', top: place.top, left: place.left, width: place.width }}
        >
          {visible.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--text-muted)]">Nenhuma opção</p>
          ) : visible.map((option, index) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${index === activeIndex ? 'bg-[var(--hover)]' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="h-2 w-2 rounded-full" style={{ background: 'var(--primary)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
