import { useEffect, useRef, useState } from 'react';
import { Camera, Search, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import PermissionEditor from '../components/equipe/PermissionEditor';
import { confirmAction } from '../lib/confirm';
import { createMemberAccount } from '../lib/createMemberAccount';
import { getAll } from '../db/indexedDB';
import { useAppStore } from '../store/useAppStore';
import { GERAL_EMPRESA_ID } from '../lib/workspace';

type Person = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  department?: string;
  role: string;
  notes?: string;
  avatar?: string | null;
  status: 'ativo' | 'inativo';
  admin?: boolean;
  permissions?: string[];
  empresaId?: string;
  accountOnly?: boolean;
};

const blankMember = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  cpf: '',
  department: '',
  role: 'Member',
  notes: '',
  avatar: null as string | null,
  status: 'ativo',
  admin: false,
  permissions: [] as string[],
  empresaId: '',
};

const roles = ['Admin', 'Project Manager', 'Developer', 'Designer', 'Finance', 'Support', 'Member', 'Viewer'];

function coverColor(name: string) {
  const hues = [210, 262, 160, 28, 330, 190];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % hues.length;
  return `linear-gradient(135deg, hsl(${hues[index]} 70% 46%), hsl(${(hues[index] + 28) % 360} 65% 38%))`;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function Equipe() {
  const membros = useAppStore((state) => state.membros);
  const empresas = useAppStore((state) => state.empresas);
  const user = useAppStore((state) => state.user);
  const addMembro = useAppStore((state) => state.addMembro);
  const updateMembro = useAppStore((state) => state.updateMembro);
  const deleteMembros = useAppStore((state) => state.deleteMembros);
  const isLoading = useAppStore((state) => state.isLoading);

  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Person | null>(null);
  const [form, setForm] = useState(blankMember);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    getAll<Person>('membros').then((rows) => {
      if (alive) setPeople(rows);
    }).catch(() => {
      if (alive) setPeople([]);
    });
    return () => {
      alive = false;
    };
  }, [membros]);

  const companyName = (id?: string) => {
    if (!id || id === GERAL_EMPRESA_ID) return 'Geral';
    return empresas.find((empresa) => empresa.id === id)?.name || 'Sem empresa';
  };

  const photoFor = (person: Person) => {
    if (user && person.email?.toLowerCase() === user.email?.toLowerCase() && user.avatar) return user.avatar;
    return person.avatar || null;
  };

  const accountCard: Person | null = user && !people.some((person) => person.email?.toLowerCase() === user.email?.toLowerCase())
    ? {
        id: `conta-${user.id}`,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: 'Sua conta',
        status: 'ativo',
        accountOnly: true,
      }
    : null;

  const visible = [accountCard, ...people].filter((person): person is Person => {
    if (!person) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${person.name} ${person.email} ${person.role} ${companyName(person.empresaId)}`.toLowerCase().includes(term);
  });

  const openNew = () => {
    setEditingMember(null);
    setForm(blankMember);
    setIsModalOpen(true);
  };

  const openPerson = (person: Person) => {
    if (person.accountOnly) return;
    setEditingMember(person);
    setForm({
      name: person.name || '',
      email: person.email || '',
      password: '',
      confirmPassword: '',
      phone: person.phone || '',
      cpf: person.cpf || '',
      department: person.department || '',
      role: person.role || 'Member',
      notes: person.notes || '',
      avatar: person.avatar || null,
      status: person.status || 'ativo',
      admin: person.admin === true || (person.admin == null && person.role === 'Admin'),
      permissions: Array.isArray(person.permissions) ? person.permissions : [],
      empresaId: person.empresaId || '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, avatar: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('E-mail inválido');
      return;
    }
    if (!editingMember) {
      if (form.password.length < 8) {
        toast.error('A senha precisa ter pelo menos 8 caracteres');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        cpf: form.cpf.trim(),
        department: form.department.trim(),
        notes: form.notes.trim(),
        role: form.admin ? 'Admin' : form.role,
        avatar: form.avatar,
        status: form.status as 'ativo' | 'inativo',
        admin: form.admin,
        permissions: form.permissions,
        empresaId: form.empresaId || GERAL_EMPRESA_ID,
      };
      if (editingMember) {
        await updateMembro(editingMember.id, payload);
      } else {
        const account = await createMemberAccount(payload.name, payload.email, form.password);
        await addMembro(payload);
        if (account.alreadyExists) toast('Este e-mail já tinha conta. A pessoa entra com a senha que já usa.');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      setForm(blankMember);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar o membro');
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    const ids = selected.filter((id) => people.some((person) => person.id === id));
    if (ids.length === 0) return;
    const accepted = await confirmAction({
      title: ids.length === 1 ? 'Remover esta pessoa?' : `Remover ${ids.length} pessoas?`,
      message: 'Elas deixam de aparecer na equipe. A conta de acesso continua existindo e pode ser usada para entrar.',
      confirmLabel: 'Confirmar remoção',
      tone: 'danger',
    });
    if (!accepted) return;
    await deleteMembros(ids);
    setSelected([]);
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (isLoading && people.length === 0) {
    return <div className="grid min-h-[40vh] place-items-center text-sm text-[var(--text-muted)]">Carregando equipe...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Pessoas</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Equipe</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{people.length + (accountCard ? 1 : 0)} pessoas cadastradas, de todas as empresas.</p>
        </div>
        <Button variant="primary" icon={<UserPlus size={16} />} onClick={openNew}>Adicionar membro</Button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou empresa" className="havk-field w-full rounded-2xl py-3 pl-10 pr-3" />
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <p className="text-sm">{selected.length} {selected.length === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}</p>
          <Button variant="destructive" onClick={() => void removeSelected()}>Remover selecionados</Button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border px-4 py-10 text-center text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>Nenhuma pessoa encontrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((person) => {
            const photo = photoFor(person);
            return (
              <article key={person.id} className="member-card cursor-pointer" onClick={() => openPerson(person)}>
                <div className="member-cover" style={{ background: coverColor(person.name || person.email) }} />
                {!person.accountOnly && (
                  <label className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-md bg-white/80" onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(person.id)} onChange={() => toggleSelected(person.id)} aria-label={`Selecionar ${person.name}`} />
                  </label>
                )}
                <div className="px-4 pb-4">
                  {photo ? <img src={photo} alt="" className="member-photo" /> : <span className="member-photo grid place-items-center text-sm font-semibold">{(person.name || '?').slice(0, 1).toUpperCase()}</span>}
                  <p className="mt-2 truncate font-semibold">{person.name}</p>
                  <p className="truncate text-sm text-[var(--text-muted)]">{person.email}</p>
                  <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{companyName(person.empresaId)} · {person.admin ? 'Administrador' : person.role}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div data-havk-overlay className="fixed inset-0 z-50 flex bg-black/70 sm:items-center sm:justify-center sm:p-4" onClick={() => setIsModalOpen(false)}>
          <div className="h-[100dvh] w-full overflow-y-auto sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl" style={{ background: 'var(--card-elevated)' }} onClick={(event) => event.stopPropagation()}>
            <div className="border-b p-5" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-semibold">{editingMember ? form.name || 'Pessoa' : 'Nova conta'}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {editingMember ? 'A empresa define onde esta pessoa trabalha.' : 'A senha serve para esta pessoa entrar. O restante ela pode completar depois.'}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <button type="button" className="company-logo-button member-photo-pick" onClick={() => fileInputRef.current?.click()} aria-label="Foto do membro">
                  {form.avatar ? <img src={form.avatar} alt="" /> : <span className="company-logo-letter">{(form.name || 'N').slice(0, 1).toUpperCase()}</span>}
                  <span className="company-logo-badge"><Camera size={10} /></span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <p className="text-sm text-[var(--text-muted)]">Foto redonda, só o ícone no canto troca a imagem.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Nome</span>
                  <input className="havk-field w-full rounded-2xl px-3 py-3" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">E-mail</span>
                  <input type="email" autoComplete="off" className="havk-field w-full rounded-2xl px-3 py-3" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                {!editingMember && (
                  <>
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-[var(--text-secondary)]">Senha</span>
                      <input type="password" autoComplete="new-password" className="havk-field w-full rounded-2xl px-3 py-3" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-[var(--text-secondary)]">Confirmar senha</span>
                      <input type="password" autoComplete="new-password" className="havk-field w-full rounded-2xl px-3 py-3" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                    </label>
                  </>
                )}
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">CPF</span>
                  <input inputMode="numeric" className="havk-field w-full rounded-2xl px-3 py-3" value={form.cpf} placeholder="000.000.000-00" onChange={(event) => setForm({ ...form, cpf: formatCpf(event.target.value) })} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Telefone</span>
                  <input className="havk-field w-full rounded-2xl px-3 py-3" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Empresa</span>
                  <select className="havk-field w-full rounded-2xl px-3 py-3" value={form.empresaId} onChange={(event) => setForm({ ...form, empresaId: event.target.value })}>
                    <option value={GERAL_EMPRESA_ID}>Geral</option>
                    {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Cargo</span>
                  <select className="havk-field w-full rounded-2xl px-3 py-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Setor</span>
                  <input className="havk-field w-full rounded-2xl px-3 py-3" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                </label>
              </div>
              <PermissionEditor
                admin={form.admin}
                permissions={form.permissions}
                onAdmin={(admin) => setForm({ ...form, admin })}
                onPermissions={(permissions) => setForm({ ...form, permissions })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Fechar</Button>
                <Button onClick={() => void save()} disabled={saving}>{editingMember ? 'Salvar' : 'Criar conta'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
