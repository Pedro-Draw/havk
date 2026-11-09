import { useEffect, useRef, useState } from 'react';
import { Camera, Search, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import PasswordField from '../components/ui/PasswordField';
import SelectDot from '../components/ui/SelectDot';
import PermissionEditor from '../components/equipe/PermissionEditor';
import { confirmAction } from '../lib/confirm';
import { createMemberAccount } from '../lib/createMemberAccount';
import { ALL_PERMISSION_IDS } from '../lib/permissions';
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
  master?: boolean;
  permissions?: string[];
  empresaId?: string;
  gender?: string;
  maritalStatus?: string;
  age?: number;
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
  gender: '',
  maritalStatus: '',
  age: '',
};

const roles = ['Admin', 'Project Manager', 'Developer', 'Designer', 'Finance', 'Support', 'Member', 'Viewer'];
const genders = ['Feminino', 'Masculino', 'Não binário', 'Prefiro não informar'];
const maritalStatuses = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)', 'Prefiro não informar'];

function coverColor(name: string) {
  const hues = [210, 262, 160, 28, 330, 190];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % hues.length;
  return `linear-gradient(135deg, hsl(${hues[index]} 70% 46%), hsl(${(hues[index] + 28) % 360} 65% 38%))`;
}

function CompanyMini({ empresaId, empresas }: { empresaId?: string; empresas: { id: string; name: string; logo?: string | null }[] }) {
  if (!empresaId || empresaId === GERAL_EMPRESA_ID) {
    return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="company-mini" />;
  }
  const empresa = empresas.find((item) => item.id === empresaId);
  if (empresa?.logo) return <img src={empresa.logo} alt="" className="company-mini" />;
  return <span className="company-mini">{(empresa?.name || '?').slice(0, 1).toUpperCase()}</span>;
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
  const setUser = useAppStore((state) => state.setUser);
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

  const isMasterPerson = (person: Person) => Boolean(person.master || person.accountOnly);

  const openPerson = (person: Person) => {
    const master = isMasterPerson(person);
    const canEditSelf = master || person.admin || person.permissions?.includes('equipe:create') || person.permissions?.includes('equipe:edit');
    if (person.accountOnly && !canEditSelf) return;
    setEditingMember(person);
    setForm({
      name: person.name || '',
      email: person.email || '',
      password: '',
      confirmPassword: '',
      phone: person.phone || '',
      cpf: person.cpf || '',
      department: person.department || '',
      role: master ? 'Admin' : person.role || 'Member',
      notes: person.notes || '',
      avatar: photoFor(person),
      status: person.status || 'ativo',
      admin: master || person.admin === true || (person.admin == null && person.role === 'Admin'),
      permissions: master ? [...ALL_PERMISSION_IDS] : Array.isArray(person.permissions) ? person.permissions : [],
      empresaId: person.empresaId || GERAL_EMPRESA_ID,
      gender: person.gender || '',
      maritalStatus: person.maritalStatus || '',
      age: person.age ? String(person.age) : '',
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

    const age = Number(form.age);
    if (form.age && (!Number.isInteger(age) || age < 1 || age > 120)) {
      toast.error('Informe uma idade entre 1 e 120');
      return;
    }

    setSaving(true);
    try {
      const master = Boolean(editingMember && isMasterPerson(editingMember));
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        cpf: form.cpf.trim(),
        department: form.department.trim(),
        notes: form.notes.trim(),
        role: master || form.admin ? 'Admin' : form.role,
        avatar: form.avatar,
        status: form.status as 'ativo' | 'inativo',
        admin: master || form.admin,
        master,
        permissions: master ? [...ALL_PERMISSION_IDS] : form.permissions,
        empresaId: form.empresaId || GERAL_EMPRESA_ID,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
        age: form.age ? age : undefined,
      };
      if (editingMember && !editingMember.accountOnly) {
        await updateMembro(editingMember.id, payload);
      } else if (!editingMember) {
        const account = await createMemberAccount(payload.name, payload.email, form.password);
        await addMembro(payload);
        if (account.alreadyExists) toast('Este e-mail já tinha conta. A pessoa entra com a senha que já usa.');
      } else {
        await addMembro(payload);
      }
      if (user && editingMember && (editingMember.accountOnly || editingMember.email?.toLowerCase() === user.email.toLowerCase())) {
        await setUser({ ...user, name: payload.name, email: payload.email, avatar: payload.avatar });
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
                {!person.accountOnly && !person.master && (
                  <div className="absolute right-3 top-3" onClick={(event) => event.stopPropagation()}>
                    <SelectDot checked={selected.includes(person.id)} onChange={() => toggleSelected(person.id)} label={`Selecionar ${person.name}`} />
                  </div>
                )}
                <div className="px-4 pb-4">
                  {photo ? <img src={photo} alt="" className="member-photo" /> : <span className="member-photo grid place-items-center text-sm font-semibold">{(person.name || '?').slice(0, 1).toUpperCase()}</span>}
                  <p className="mt-2 truncate font-semibold">{person.name}</p>
                  <p className="truncate text-sm text-[var(--text-muted)]">{person.email}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <CompanyMini empresaId={person.empresaId} empresas={empresas} />
                    <span className="truncate">{companyName(person.empresaId)} · {isMasterPerson(person) ? 'Administrador principal' : person.admin ? 'Administrador' : person.role}</span>
                  </p>
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
                      <PasswordField value={form.password} onChange={(password) => setForm({ ...form, password })} />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-[var(--text-secondary)]">Confirmar senha</span>
                      <PasswordField value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} />
                    </label>
                  </>
                )}
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Gênero</span>
                  <select className="havk-field w-full rounded-2xl px-3 py-3" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                    <option value="">Não informado</option>
                    {genders.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Estado civil</span>
                  <select className="havk-field w-full rounded-2xl px-3 py-3" value={form.maritalStatus} onChange={(event) => setForm({ ...form, maritalStatus: event.target.value })}>
                    <option value="">Não informado</option>
                    {maritalStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-[var(--text-secondary)]">Idade</span>
                  <input inputMode="numeric" className="havk-field w-full rounded-2xl px-3 py-3" value={form.age} placeholder="Anos" onChange={(event) => setForm({ ...form, age: event.target.value.replace(/\D/g, '').slice(0, 3) })} />
                </label>
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
                locked={Boolean(editingMember && isMasterPerson(editingMember))}
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
