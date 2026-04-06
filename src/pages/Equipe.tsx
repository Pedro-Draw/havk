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

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Member',
    avatar: null as string | null, // base64
    status: 'ativo',
  });

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
          role: newMember.role,
          avatar: newMember.avatar,
          status: newMember.status as 'ativo' | 'inativo',
        });
        toast.success('Membro atualizado com sucesso');
      } else {
        // Adição
        await addMembro({
          name: newMember.name.trim(),
          email: newMember.email.trim(),
          role: newMember.role,
          avatar: newMember.avatar,
          status: newMember.status as 'ativo' | 'inativo',
        });
        toast.success('Membro adicionado com sucesso');
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
    if (!confirm(`Tem certeza que deseja remover ${name}?`)) return;

    try {
      await deleteMembro(id);
      toast.success('Membro removido');
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
      role: membro.role || 'Member',
      avatar: membro.avatar || null,
      status: membro.status || 'ativo',
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
    setNewMember({
      name: '',
      email: '',
      role: 'Member',
      avatar: null,
      status: 'ativo',
    });
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
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <Users className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Equipe</h1>
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
                  setNewMember({
                    name: '',
                    email: '',
                    role: 'Member',
                    avatar: null,
                    status: 'ativo',
                  });
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
              <div className="overflow-x-auto">
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
                        className="border-b border-zinc-800 hover:bg-zinc-900/70 transition-colors"
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
                          <span className={`inline-flex px-5 py-2 rounded-full text-sm font-medium border ${getRoleBadge(membro.role)}`}>
                            {membro.role}
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
                              onClick={() => handleEdit(membro)}
                              className="p-3 hover:bg-zinc-800 rounded-xl transition-colors group"
                              title="Editar membro"
                            >
                              <Edit className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                            </button>

                            <button
                              onClick={() => handleDeleteMember(membro.id, membro.name)}
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
            )}
          </Card>

          {/* Modal Adicionar/Editar */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-zinc-800 shadow-2xl">
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
                    <div>
                      <label className="block text-base font-medium text-zinc-300 mb-3">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-zinc-300 mb-3">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="joao@havk.local"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-zinc-300 mb-3">
                        Permissão
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors text-base"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-zinc-300 mb-3">
                        Status
                      </label>
                      <select
                        value={newMember.status}
                        onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors text-base"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

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