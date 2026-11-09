import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Layers, Pin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GERAL_EMPRESA_ID } from '../../lib/workspace';

export default function CompanySwitch() {
  const navigate = useNavigate();
  const empresas = useAppStore((state) => state.empresas);
  const activeEmpresaId = useAppStore((state) => state.activeEmpresaId);
  const setActiveEmpresa = useAppStore((state) => state.setActiveEmpresa);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const geral = activeEmpresaId === GERAL_EMPRESA_ID;
  const active = empresas.find((empresa) => empresa.id === activeEmpresaId) || null;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!geral && !active && empresas.length === 0) return null;

  const mark = geral || !active
    ? <span className="company-mark"><Layers size={16} /></span>
    : active.logo
      ? <img src={active.logo} alt="" className="company-mark" />
      : <span className="company-mark">{active.name.slice(0, 1).toUpperCase()}</span>;

  return (
    <div ref={boxRef} className="relative">
      <button type="button" className="company-switch" onClick={() => setOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={open}>
        {mark}
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{geral || !active ? 'Geral' : active.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      </button>
      {open && (
        <div className="glass-popover absolute left-0 z-50 mt-2 w-64 rounded-2xl p-2" role="listbox">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--hover)]"
            onClick={() => {
              setOpen(false);
              if (!geral) void setActiveEmpresa(GERAL_EMPRESA_ID);
            }}
          >
            <span className="company-mark"><Layers size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">Geral</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">Todas as empresas</span>
            </span>
            {geral && <Check className="h-4 w-4 text-emerald-400" />}
          </button>
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--hover)]"
              onClick={() => {
                setOpen(false);
                if (empresa.id !== active?.id) void setActiveEmpresa(empresa.id);
              }}
            >
              {empresa.logo ? <img src={empresa.logo} alt="" className="company-mark" /> : <span className="company-mark">{empresa.name.slice(0, 1).toUpperCase()}</span>}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 truncate text-sm font-medium">{empresa.name}{empresa.pinned && <Pin size={12} style={{ color: 'var(--primary)' }} />}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{empresa.segment || 'Empresa'}</span>
              </span>
              {empresa.id === active?.id && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
          ))}
          <button
            type="button"
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--hover)]"
            style={{ color: 'var(--primary)' }}
            onClick={() => {
              setOpen(false);
              navigate('/empresas');
            }}
          >
            Gerenciar empresas
          </button>
        </div>
      )}
    </div>
  );
}
