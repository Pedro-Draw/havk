import { useRef, useState } from 'react';
import { Building2, GripVertical, Layers, Pin, Trash2 } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { GERAL_EMPRESA_ID, type Empresa } from '../lib/workspace';
import { EMPRESA_ESTADOS, EMPRESA_PORTES, EMPRESA_SETORES, EMPRESA_TIPOS, withCurrent } from '../lib/empresaOptions';
import { confirmAction } from '../lib/confirm';
import { readSquareImage } from '../lib/images';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';

const emptyForm = {
  name: '',
  segment: '',
  size: '',
  kind: '',
  state: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  description: '',
  logo: null as string | null,
};

function selectOptions(values: string[], current: string) {
  return [{ value: '', label: 'Selecione' }, ...withCurrent(values, current).map((value) => ({ value, label: value }))];
}

function CompanyCard({
  empresa,
  inUse,
  onOpen,
  onPin,
  onLogo,
}: {
  empresa: Empresa;
  inUse: boolean;
  onOpen: () => void;
  onPin: () => void;
  onLogo: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: empresa.id });

  return (
    <article
      ref={setNodeRef}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--card)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
      className="rounded-3xl border p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-grab text-[var(--text-muted)] active:cursor-grabbing"
          aria-label={`Arrastar ${empresa.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <button type="button" className="company-logo-button" aria-label={`Imagem de ${empresa.name}`} onClick={onLogo}>
          {empresa.logo ? <img src={empresa.logo} alt="" /> : <span>{empresa.name.slice(0, 1).toUpperCase()}</span>}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button type="button" className="min-w-0 text-left" onClick={onOpen}>
              <span className="flex items-center gap-1.5">
                <span className="truncate text-base font-semibold">{empresa.name}</span>
                {empresa.pinned && <Pin size={14} className="shrink-0 text-violet-500" />}
              </span>
              <span className="mt-0.5 block truncate text-sm text-[var(--text-muted)]">{[empresa.kind, empresa.segment, empresa.size].filter(Boolean).join(' · ') || 'Sem setor'}</span>
            </button>
            <button
              type="button"
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${empresa.pinned ? 'border-violet-500 text-violet-600' : 'text-[var(--text-muted)]'}`}
              style={{ borderColor: empresa.pinned ? undefined : 'var(--border)' }}
              aria-pressed={Boolean(empresa.pinned)}
              onClick={onPin}
            >
              {empresa.pinned ? 'Fixada' : 'Fixar'}
            </button>
          </div>
          <button type="button" className="mt-2 block w-full text-left" onClick={onOpen}>
            <span className="line-clamp-2 text-sm text-[var(--text-secondary)]">{empresa.description || 'Toque para completar logo e informações.'}</span>
            {inUse && <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600">Em uso</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Empresas() {
  const empresas = useAppStore((state) => state.empresas);
  const activeEmpresaId = useAppStore((state) => state.activeEmpresaId);
  const demandas = useAppStore((state) => state.demandas);
  const membros = useAppStore((state) => state.membros);
  const projetos = useAppStore((state) => state.projetos);
  const addEmpresa = useAppStore((state) => state.addEmpresa);
  const updateEmpresa = useAppStore((state) => state.updateEmpresa);
  const deleteEmpresa = useAppStore((state) => state.deleteEmpresa);
  const setActiveEmpresa = useAppStore((state) => state.setActiveEmpresa);
  const toggleEmpresaPin = useAppStore((state) => state.toggleEmpresaPin);
  const reorderEmpresas = useAppStore((state) => state.reorderEmpresas);

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const cardTarget = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const selected = empresas.find((empresa) => empresa.id === selectedId) || null;
  const geral = activeEmpresaId === GERAL_EMPRESA_ID;
  const active = empresas.find((empresa) => empresa.id === activeEmpresaId) || null;
  const pinned = empresas.filter((empresa) => empresa.pinned);
  const loose = empresas.filter((empresa) => !empresa.pinned);

  const open = (empresa: Empresa) => {
    setSelectedId(empresa.id);
    setForm({
      name: empresa.name || '',
      segment: empresa.segment || '',
      size: empresa.size || '',
      kind: empresa.kind || '',
      state: empresa.state || '',
      email: empresa.email || '',
      phone: empresa.phone || '',
      website: empresa.website || '',
      city: empresa.city || '',
      description: empresa.description || '',
      logo: empresa.logo || null,
    });
  };

  const openNew = () => {
    setSelectedId('new');
    setForm(emptyForm);
  };

  const pickLogo = async (file: File | undefined, empresaId?: string) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Escolha uma imagem');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('A imagem precisa ter no máximo 8 MB');
      return;
    }
    try {
      const logo = await readSquareImage(file);
      if (empresaId) {
        await updateEmpresa(empresaId, { logo });
        if (selectedId === empresaId) setForm((current) => ({ ...current, logo }));
        return;
      }
      setForm((current) => ({ ...current, logo }));
    } catch {
      toast.error('Não foi possível usar essa imagem');
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Dê um nome para a empresa');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        segment: form.segment,
        size: form.size,
        kind: form.kind,
        state: form.state,
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        city: form.city.trim(),
        description: form.description.trim(),
        logo: form.logo,
      };
      if (selectedId === 'new') {
        const id = await addEmpresa(payload);
        setSelectedId(id);
      } else if (selected) {
        await updateEmpresa(selected.id, payload);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    const accepted = await confirmAction({
      title: `Remover ${selected.name}?`,
      message: 'Demandas, equipe, notas e o restante deste espaço saem junto. O que estiver no Geral continua.',
      confirmLabel: 'Remover empresa',
      tone: 'danger',
    });
    if (!accepted) return;
    await deleteEmpresa(selected.id);
    setSelectedId(null);
  };

  const onDragEnd = (group: Empresa[]) => (event: DragEndEvent) => {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;
    const oldIndex = group.findIndex((empresa) => empresa.id === dragged.id);
    const newIndex = group.findIndex((empresa) => empresa.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    void reorderEmpresas(arrayMove(group, oldIndex, newIndex).map((empresa) => empresa.id));
  };

  const renderGroup = (group: Empresa[]) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(group)}>
      <SortableContext items={group.map((empresa) => empresa.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {group.map((empresa) => (
            <CompanyCard
              key={empresa.id}
              empresa={empresa}
              inUse={empresa.id === activeEmpresaId}
              onOpen={() => open(empresa)}
              onPin={() => void toggleEmpresaPin(empresa.id)}
              onLogo={() => {
                cardTarget.current = empresa.id;
                cardFileRef.current?.click();
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Espaços</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Empresas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {geral
              ? 'Você está no Geral. A lista mostra todas as empresas e o que for criado aqui aparece em todas.'
              : `A empresa em uso agora é ${active?.name || 'nenhuma'}. Arraste para ordenar e fixe as que precisam ficar no topo.`}
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>Nova empresa</Button>
      </div>

      <button
        type="button"
        className="mb-4 flex w-full items-center gap-3 rounded-3xl border p-4 text-left"
        style={{ borderColor: geral ? '#8b5cf6' : 'var(--border)', background: 'var(--card)' }}
        onClick={() => void setActiveEmpresa(GERAL_EMPRESA_ID)}
      >
        <span className="company-mark"><Layers size={16} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">Geral</span>
          <span className="block text-sm text-[var(--text-muted)]">Tudo junto, sem entrar em uma empresa.</span>
        </span>
        {geral && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600">Em uso</span>}
      </button>

      {pinned.length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Fixadas</p>
          {renderGroup(pinned)}
        </section>
      )}

      <section>
        {pinned.length > 0 && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Demais empresas</p>}
        {renderGroup(loose)}
      </section>

      <input
        ref={cardFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const id = cardTarget.current || undefined;
          void pickLogo(event.target.files?.[0], id);
          event.target.value = '';
        }}
      />

      {selectedId && (
        <div className="fixed inset-0 z-50 flex bg-black/70 sm:items-center sm:justify-center sm:p-4" onClick={() => setSelectedId(null)}>
          <div
            className="h-[100dvh] w-full overflow-y-auto border pb-[env(safe-area-inset-bottom)] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl"
            style={{ borderColor: 'var(--border)', background: 'var(--card-elevated)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4 border-b p-5" style={{ borderColor: 'var(--border)' }}>
              <button type="button" className="company-logo-button company-logo-button-lg" onClick={() => fileRef.current?.click()} aria-label="Escolher logo">
                {form.logo ? <img src={form.logo} alt="" /> : <Building2 />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { void pickLogo(event.target.files?.[0]); event.target.value = ''; }} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold">{selectedId === 'new' ? 'Nova empresa' : form.name || 'Empresa'}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">A imagem redonda é a logo deste espaço.</p>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Nome</span>
                <input value={form.name} placeholder="Nome da empresa" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="havk-field w-full rounded-2xl px-3 py-3" />
              </label>
              <Select className="w-full rounded-2xl" label="Tipo" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} options={selectOptions(EMPRESA_TIPOS, form.kind)} />
              <Select className="w-full rounded-2xl" label="Setor" value={form.segment} onChange={(event) => setForm((current) => ({ ...current, segment: event.target.value }))} options={selectOptions(EMPRESA_SETORES, form.segment)} />
              <Select className="w-full rounded-2xl" label="Porte" value={form.size} onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))} options={selectOptions(EMPRESA_PORTES, form.size)} />
              <Select className="w-full rounded-2xl" label="Estado" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} options={selectOptions(EMPRESA_ESTADOS, form.state)} />
              <label className="block text-sm">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Cidade</span>
                <input value={form.city} placeholder="Cidade" onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="havk-field w-full rounded-2xl px-3 py-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[var(--text-secondary)]">E-mail</span>
                <input value={form.email} placeholder="contato@empresa.com" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="havk-field w-full rounded-2xl px-3 py-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Telefone</span>
                <input value={form.phone} placeholder="(11) 90000-0000" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="havk-field w-full rounded-2xl px-3 py-3" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Site</span>
                <input value={form.website} placeholder="https://" onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className="havk-field w-full rounded-2xl px-3 py-3" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Sobre</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="havk-field w-full rounded-2xl px-3 py-3" placeholder="O que esta empresa faz." />
              </label>
            </div>

            {selected && (geral || selected.id === activeEmpresaId) && (
              <div className="mx-5 mb-2 grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
                <div><p className="text-lg font-semibold">{demandas.length}</p><p className="text-[var(--text-muted)]">Demandas</p></div>
                <div><p className="text-lg font-semibold">{membros.length}</p><p className="text-[var(--text-muted)]">Membros</p></div>
                <div><p className="text-lg font-semibold">{projetos.length}</p><p className="text-[var(--text-muted)]">Projetos</p></div>
              </div>
            )}

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--card-elevated)' }}>
              {selected ? (
                <button type="button" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-red-500" onClick={() => void remove()}>
                  <Trash2 className="h-4 w-4" /> Remover
                </button>
              ) : <span />}
              <div className="flex gap-2">
                {selected && selected.id !== activeEmpresaId && (
                  <Button variant="secondary" onClick={() => void setActiveEmpresa(selected.id)}>Entrar</Button>
                )}
                <Button variant="outline" onClick={() => setSelectedId(null)}>Fechar</Button>
                <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? 'Salvando' : 'Salvar'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
