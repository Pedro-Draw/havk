import { useRef, useState } from 'react';
import { Building2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import type { Empresa } from '../lib/workspace';
import { confirmAction } from '../lib/confirm';
import { readSquareImage } from '../lib/images';
import Button from '../components/ui/Button';

const emptyForm = {
  name: '',
  segment: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  description: '',
  logo: null as string | null,
};

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

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const cardTarget = useRef<string | null>(null);

  const selected = empresas.find((empresa) => empresa.id === selectedId) || null;
  const active = empresas.find((empresa) => empresa.id === activeEmpresaId) || null;

  const open = (empresa: Empresa) => {
    setSelectedId(empresa.id);
    setForm({
      name: empresa.name || '',
      segment: empresa.segment || '',
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
        segment: form.segment.trim(),
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
      message: 'Demandas, equipe, notas e o restante deste espaço saem junto. As outras empresas continuam intactas.',
      confirmLabel: 'Remover empresa',
      tone: 'danger',
    });
    if (!accepted) return;
    await deleteEmpresa(selected.id);
    setSelectedId(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Espaços</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Empresas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Cada empresa guarda os próprios quadros, demandas, pessoas e notas. A empresa em uso agora é {active?.name || 'nenhuma'}.
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>Nova empresa</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {empresas.map((empresa) => {
          const inUse = empresa.id === activeEmpresaId;
          return (
            <article
              key={empresa.id}
              className="cursor-pointer rounded-3xl border p-4 text-left transition-colors hover:border-violet-500/50"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              onClick={() => open(empresa)}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="company-logo-button"
                  aria-label={`Imagem de ${empresa.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    cardTarget.current = empresa.id;
                    cardFileRef.current?.click();
                  }}
                >
                  {empresa.logo ? <img src={empresa.logo} alt="" /> : <span>{empresa.name.slice(0, 1).toUpperCase()}</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold">{empresa.name}</h2>
                    {inUse && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Em uso</span>}
                  </div>
                  <p className="truncate text-sm text-[var(--text-muted)]">{empresa.segment || 'Sem setor'}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{empresa.description || 'Toque para completar logo e informações.'}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

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
                <p className="mt-1 text-sm text-[var(--text-secondary)]">A imagem redonda é a logo deste espaço. Os dados dela não se misturam com os das outras.</p>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {([
                ['name', 'Nome', 'Nome da empresa'],
                ['segment', 'Setor', 'Produto, estúdio, cliente...'],
                ['email', 'E-mail', 'contato@empresa.com'],
                ['phone', 'Telefone', '(11) 90000-0000'],
                ['website', 'Site', 'https://'],
                ['city', 'Cidade', 'São Paulo'],
              ] as const).map(([key, label, placeholder]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">{label}</span>
                  <input
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="havk-field w-full rounded-2xl px-3 py-3"
                  />
                </label>
              ))}
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-[var(--text-secondary)]">Sobre</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  className="havk-field w-full rounded-2xl px-3 py-3"
                  placeholder="O que esta empresa faz e o que fica separado aqui."
                />
              </label>
            </div>

            {selected && selected.id === activeEmpresaId && (
              <div className="mx-5 mb-2 grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
                <div><p className="text-lg font-semibold">{demandas.length}</p><p className="text-[var(--text-muted)]">Demandas</p></div>
                <div><p className="text-lg font-semibold">{membros.length}</p><p className="text-[var(--text-muted)]">Membros</p></div>
                <div><p className="text-lg font-semibold">{projetos.length}</p><p className="text-[var(--text-muted)]">Projetos</p></div>
              </div>
            )}

            {selected && selected.id !== activeEmpresaId && (
              <p className="mx-5 mb-2 rounded-2xl bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
                Entre nesta empresa para ver somente os dados dela.
              </p>
            )}

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--card-elevated)' }}>
              {selected ? (
                <button type="button" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-red-300" onClick={() => void remove()}>
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
