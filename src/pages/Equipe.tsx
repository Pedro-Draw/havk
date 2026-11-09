// pages/Equipe.tsx
import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Camera,
  Search,
  Download,
  Mail,
  CheckCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import PermissionEditor from '../components/equipe/PermissionEditor';
import { confirmAction } from '../lib/confirm';

export default function Equipe() {
  const { translateUserContent: _tc } = useTranslation(); // eslint-disable-line

  const {
    membros,
    addMembro,
    updateMembro,
    deleteMembro,
    isLoading,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const blankMember = {
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'Member',
    notes: '',
    avatar: null as string | null,
    status: 'ativo',
    admin: false,
    permissions: [] as string[],
  };
  const [newMember, setNewMember] = useState(blankMember);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtro de busca
  const filteredMembros = membros.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase())
  );

  // Salvar (adicionar ou editar)
  const handleSaveMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      toast.error('E-mail inválido');
      return;
    }

    try {
      if (editingMember) {
        // Edição
        await updateMembro(editingMember.id, {
          name: newMember.name.trim(),
          email: newMember.email.trim(),
          phone: newMember.phone.trim(),
          department: newMember.department.trim(),
          notes: newMember.notes.trim(),
          role: newMember.admin ? 'Admin' : newMember.role,
          avatar: newMember.avatar,
          status: newMember.status as 'ativo' | 'inativo',
          admin: newMember.admin,
          permissions: newMember.permissions,
        });
      } else {
        await addMembro({
          name: newMember.name.trim(),
          email: newMember.email.trim(),
          phone: newMember.phone.trim(),
          department: newMember.department.trim(),
          notes: newMember.notes.trim(),
          role: newMember.admin ? 'Admin' : newMember.role,
          avatar: newMember.avatar,
          status: newMember.status as 'ativo' | 'inativo',
          admin: newMember.admin,
          permissions: newMember.permissions,
        });
      }

      // O store atualiza a lista automaticamente
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar membro:', err);
      toast.error('Erro ao salvar membro');
    }
  };

  // Excluir com confirmação
  const handleDeleteMember = async (id: string, name: string) => {
    const accepted = await confirmAction({
      title: `Remover ${name}?`,
      message: 'Esta pessoa deixa de aparecer na equipe desta empresa.',
      confirmLabel: 'Remover',
      tone: 'danger',
    });
    if (!accepted) return;

    try {
      await deleteMembro(id);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao remover membro');
    }
  };

  // Editar: abre modal preenchido
  const handleEdit = (membro: any) => {
    setEditingMember(membro);
    setNewMember({
      name: membro.name || '',
      email: membro.email || '',
      phone: membro.phone || '',
      department: membro.department || '',
      role: membro.role || 'Member',
      notes: membro.notes || '',
      avatar: membro.avatar || null,
      status: membro.status || 'ativo',
      admin: membro.admin === true || (membro.admin == null && membro.role === 'Admin'),
      permissions: Array.isArray(membro.permissions) ? membro.permissions : [],
    });
    setIsModalOpen(true);
  };

  // Upload de avatar (base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewMember((prev) => ({ ...prev, avatar: event.target?.result as string }));
      toast.success('Foto carregada');
    };
    reader.readAsDataURL(file);
  };

  // Exportar CSV
  const exportCSV = () => {
    if (membros.length === 0) {
      toast.error('Nenhum membro para exportar');
      return;
    }

    const headers = ['Nome', 'Email', 'Permissão', 'Status', 'Data de Entrada'];
    const rows = membros.map((m) => [
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      m.role || 'Member',
      m.status || 'ativo',
      new Date(m.createdAt).toLocaleString('pt-BR'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equipe_havk.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exportado com sucesso!');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setNewMember(blankMember);
  };

  const roles = [
    'Admin',
    'Project Manager',
    'Developer',
    'Designer',
    'Finance',
    'Support',
    'Member',
    'Viewer',
  ];

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Admin: 'bg-red-900/40 text-red-300 border-red-800/50',
      'Project Manager': 'bg-purple-900/40 text-purple-300 border-purple-800/50',
      Developer: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
      Designer: 'bg-pink-900/40 text-pink-300 border-pink-800/50',
      Finance: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
      Support: 'bg-indigo-900/40 text-indigo-300 border-indigo-800/50',
      Member: 'bg-zinc-800 text-zinc-300 border-zinc-700/50',
      Viewer: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
    };
    return colors[role] || 'bg-gray-800 text-gray-300 border-gray-700/50';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="w-full min-w-0 px-3 py-3 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl pb-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <Users className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Equipe</h1>
                <p className="text-zinc-400 mt-1 text-lg">
                  {membros.length} membros • Gerencie permissões e acessos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                size="lg"
                icon={<Download className="w-5 h-5" />}
                onClick={exportCSV}
                disabled={membros.length === 0}
              >
                Exportar CSV
              </Button>

              <Button
                variant="primary"
                size="lg"
                icon={<UserPlus className="w-5 h-5" />}
                onClick={() => {
                  setEditingMember(null);
                  setNewMember(blankMember);
                  setIsModalOpen(true);
                }}
              >
                Adicionar Membro
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="mb-10 max-w-xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou permissão..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                  pl-14 pr-6 py-4 text-zinc-100 placeholder-zinc-500 
                  focus:outline-none focus:border-indigo-500 focus:ring-1 
                  focus:ring-indigo-500/30 transition-all text-base
                "
              />
            </div>
          </div>

          {/* Tabela / Lista */}
          <Card className="border-zinc-800 shadow-2xl overflow-hidden">
            {filteredMembros.length === 0 ? (
              <div className="p-20 text-center text-zinc-500">
                <Users className="w-24 h-24 mx-auto mb-8 opacity-50" />
                <h3 className="text-3xl font-semibold mb-4">
                  {search ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe ainda'}
                </h3>
                <p className="text-lg mb-10">
                  {search
                    ? 'Tente outra busca ou limpe o filtro'
                    : 'Adicione seu primeiro membro para começar'}
                </p>
                {!search && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Adicionar Primeiro Membro
                  </Button>
                )}
              </div>
            ) : (
              <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/70">
                      <th className="py-6 px-8 text-left font-medium text-zinc-300 text-lg">Membro</th>
                      <th className="py-6 px-8 text-left font-medium text-zinc-300 text-lg">E-mail</th>
                      <th className="py-6 px-8 text-left font-medium text-zinc-300 text-lg">Permissão</th>
                      <th className="py-6 px-8 text-left font-medium text-zinc-300 text-lg">Status</th>
                      <th className="py-6 px-8 text-right font-medium text-zinc-300 text-lg">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembros.map((membro) => (
                      <tr
                        key={membro.id}
                        className="cursor-pointer border-b border-zinc-800 transition-colors hover:bg-zinc-900/70"
                        onClick={() => handleEdit(membro)}
                      >
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-5">
                            {membro.avatar ? (
                              <img
                                src={membro.avatar}
                                alt={membro.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 shadow-md"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-950 flex items-center justify-center text-2xl font-bold text-zinc-300 border-2 border-zinc-700 shadow-md">
                                {membro.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-lg text-white">{membro.name}</p>
                              <p className="text-sm text-zinc-500">{membro.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-6 px-8 text-zinc-300 text-base">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 opacity-70" />
                            {membro.email}
                          </div>
                        </td>

                        <td className="py-6 px-8">
                          <span className={`inline-flex px-5 py-2 rounded-full text-sm font-medium border ${getRoleBadge(membro.admin ? 'Admin' : membro.role)}`}>
                            {membro.admin ? 'Administrador' : membro.role}
                          </span>
                        </td>

                        <td className="py-6 px-8">
                          <span className={`px-5 py-2 rounded-full text-sm font-medium ${
                            membro.status === 'ativo'
                              ? 'bg-green-900/40 text-green-300 border-green-800/50'
                              : 'bg-red-900/40 text-red-300 border-red-800/50'
                          }`}>
                            {membro.status?.toUpperCase() || 'Ativo'}
                          </span>
                        </td>

                        <td className="py-6 px-8 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEdit(membro);
                              }}
                              className="p-3 hover:bg-zinc-800 rounded-xl transition-colors group"
                              title="Editar membro"
                            >
                              <Edit className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                            </button>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteMember(membro.id, membro.name);
                              }}
                              className="p-3 hover:bg-zinc-800 rounded-xl transition-colors group"
                              title="Remover membro"
                            >
                              <Trash2 className="w-6 h-6 text-zinc-400 group-hover:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-zinc-800 md:hidden">
                {filteredMembros.map((membro) => (
                  <article key={membro.id} className="cursor-pointer space-y-3 p-4" onClick={() => handleEdit(membro)}>
                    <div>
                      <p className="text-lg font-semibold">{membro.name}</p>
                      <p className="text-sm text-zinc-400">{membro.email}</p>
                    </div>
                    <p className="text-sm text-zinc-300">{membro.admin ? 'Administrador' : membro.role} · {membro.status || 'ativo'}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(membro)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={(event) => { event.stopPropagation(); void handleDeleteMember(membro.id, membro.name); }}>Remover</Button>
                    </div>
                  </article>
                ))}
              </div>
              </>
            )}
          </Card>

          {/* Modal Adicionar/Editar */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex bg-black/80 sm:items-center sm:justify-center sm:p-4">
              <div className="h-[100dvh] w-full overflow-y-auto border border-zinc-800 bg-zinc-900 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl">
                <div className="p-8 border-b border-zinc-800">
                  <h2 className="text-3xl font-bold text-white">
                    {editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
                  </h2>
                  <p className="text-zinc-400 mt-2">
                    {editingMember ? 'Atualize as informações do membro' : 'Preencha os dados do novo integrante da equipe'}
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      {newMember.avatar ? (
                        <img
                          src={newMember.avatar}
                          alt="Avatar"
                          className="w-32 h-32 rounded-2xl object-cover border-4 border-zinc-700 shadow-2xl transition-all group-hover:scale-105 group-hover:rotate-2"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-6xl text-zinc-500 border-4 border-zinc-700 shadow-2xl">
                          {newMember.name?.charAt(0)?.toUpperCase() || 'N'}
                        </div>
                      )}

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-4 -right-4 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-all ring-4 ring-zinc-950"
                      >
                        <Camera className="w-7 h-7 text-white" />
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-base text-zinc-500">Clique na câmera para adicionar ou alterar a foto</p>
                  </div>

                  {/* Campos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {([
                      ['name', 'Nome completo *', 'Ex: João Silva'],
                      ['email', 'E-mail *', 'joao@empresa.com'],
                      ['phone', 'Telefone', '(11) 90000-0000'],
                      ['department', 'Setor', 'Produto, design, financeiro'],
                    ] as const).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="mb-3 block text-base font-medium text-zinc-300">{label}</label>
                        <input
                          type={key === 'email' ? 'email' : 'text'}
                          value={newMember[key]}
                          onChange={(event) => setNewMember({ ...newMember, [key]: event.target.value })}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="mb-3 block text-base font-medium text-zinc-300">Cargo</label>
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base text-zinc-100 focus:border-indigo-500 focus:outline-none"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-medium text-zinc-300">Status</label>
                      <select
                        value={newMember.status}
                        onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base text-zinc-100 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-3 block text-base font-medium text-zinc-300">Observações</label>
                      <textarea
                        value={newMember.notes}
                        onChange={(event) => setNewMember({ ...newMember, notes: event.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        placeholder="Contexto desta pessoa nesta empresa"
                      />
                    </div>
                  </div>

                  <PermissionEditor
                    admin={newMember.admin}
                    permissions={newMember.permissions}
                    onAdmin={(admin) => setNewMember({ ...newMember, admin })}
                    onPermissions={(permissions) => setNewMember({ ...newMember, permissions })}
                  />

                  <div className="flex justify-end gap-5 pt-8 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={closeModal}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSaveMember}
                      icon={<CheckCircle className="w-6 h-6" />}
                    >
                      {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}