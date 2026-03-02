import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Users, UserPlus, Edit, Trash2, Camera, Search, Download, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { getAll, addItem, updateItem, deleteItem } from '../db/indexedDB';
import toast from 'react-hot-toast';

const DB_NAME = 'HavkEquipeDB';
const DB_VERSION = 1;
const STORE_NAME = 'membros';

// Função para garantir que o banco e o object store existam
async function initializeDB() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      request.result.close();
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(`Object store "${STORE_NAME}" criado com sucesso`);
      }
    };
  });
}

export default function Equipe() {
  const { t } = useTranslation();

  const [membros, setMembros] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Member',
    avatar: null as string | null,
    status: 'ativo',
    createdAt: new Date().toISOString(),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o banco na montagem do componente (só roda uma vez)
  useEffect(() => {
    initializeDB()
      .then(() => {
        loadMembros();
      })
      .catch((err) => {
        console.error('Erro ao inicializar IndexedDB:', err);
        toast.error('Falha ao inicializar o banco de dados local');
        setLoading(false);
      });
  }, []);

  // Carrega membros do IndexedDB
  const loadMembros = async () => {
    setLoading(true);
    try {
      const data = await getAll<any>(STORE_NAME);
      setMembros(data || []);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      toast.error('Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  };

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
      let updatedMember;

      if (editingMember) {
        // Edição
        updatedMember = {
          ...editingMember,
          ...newMember,
          updatedAt: new Date().toISOString(),
        };
        await updateItem(STORE_NAME, updatedMember);
        toast.success('Membro atualizado com sucesso');
      } else {
        // Adição
        const id = Date.now().toString(); // ou use crypto.randomUUID() se preferir
        updatedMember = {
          ...newMember,
          id,
        };
        await addItem(STORE_NAME, updatedMember);
        toast.success('Membro adicionado com sucesso');
      }

      // Atualiza lista
      await loadMembros();

      // Reseta form e fecha modal
      setNewMember({
        name: '',
        email: '',
        role: 'Member',
        avatar: null,
        status: 'ativo',
        createdAt: new Date().toISOString(),
      });
      setEditingMember(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar membro:', err);
      toast.error('Erro ao salvar membro');
    }
  };

  // Excluir com confirmação
  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name}?`)) return;

    try {
      await deleteItem(STORE_NAME, id);
      toast.success('Membro removido');
      await loadMembros();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao remover membro');
    }
  };

  // Editar: abre modal preenchido
  const handleEdit = (membro: any) => {
    setEditingMember(membro);
    setNewMember({
      name: membro.name,
      email: membro.email,
      role: membro.role,
      avatar: membro.avatar || null,
      status: membro.status || 'ativo',
      createdAt: membro.createdAt,
    });
    setIsModalOpen(true);
  };

  // Upload de avatar
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
      `"${m.name?.replace(/"/g, '""') || ''}"`,
      `"${m.email?.replace(/"/g, '""') || ''}"`,
      m.role,
      m.status,
      new Date(m.createdAt).toLocaleString('pt-BR'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equipe_havk.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exportado com sucesso!');
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
      Admin: 'bg-red-900/40 text-red-300',
      'Project Manager': 'bg-purple-900/40 text-purple-300',
      Developer: 'bg-emerald-900/40 text-emerald-300',
      Designer: 'bg-pink-900/40 text-pink-300',
      Finance: 'bg-amber-900/40 text-amber-300',
      Support: 'bg-indigo-900/40 text-indigo-300',
      Member: 'bg-zinc-800 text-zinc-300',
      Viewer: 'bg-blue-900/40 text-blue-300',
    };
    return colors[role] || 'bg-gray-800 text-gray-300';
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-zinc-950 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Equipe</h1>
              <p className="text-zinc-400 mt-1">
                {membros.length} membros • Gerencie permissões e acessos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              icon={<Download className="w-5 h-5" />}
              onClick={exportCSV}
              disabled={membros.length === 0}
            >
              Exportar CSV
            </Button>

            <Button
              variant="primary"
              icon={<UserPlus className="w-5 h-5" />}
              onClick={() => {
                setEditingMember(null);
                setNewMember({
                  name: '',
                  email: '',
                  role: 'Member',
                  avatar: null,
                  status: 'ativo',
                  createdAt: new Date().toISOString(),
                });
                setIsModalOpen(true);
              }}
            >
              Adicionar Membro
            </Button>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-8 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou permissão..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Tabela */}
        <Card className="border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-zinc-500">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" />
              <p>Carregando equipe...</p>
            </div>
          ) : filteredMembros.length === 0 ? (
            <div className="p-16 text-center text-zinc-500">
              <Users className="w-20 h-20 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-semibold mb-3">
                {search ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe ainda'}
              </h3>
              <p className="mb-8">
                {search
                  ? 'Tente outra busca ou limpe o filtro'
                  : 'Adicione seu primeiro membro para começar'}
              </p>
              {!search && (
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  Adicionar Primeiro Membro
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="py-5 px-6 text-left font-medium text-zinc-300">Membro</th>
                    <th className="py-5 px-6 text-left font-medium text-zinc-300">E-mail</th>
                    <th className="py-5 px-6 text-left font-medium text-zinc-300">Permissão</th>
                    <th className="py-5 px-6 text-left font-medium text-zinc-300">Status</th>
                    <th className="py-5 px-6 text-right font-medium text-zinc-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembros.map((membro) => (
                    <tr
                      key={membro.id}
                      className="border-b border-zinc-800 hover:bg-zinc-900/70 transition-colors"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          {membro.avatar ? (
                            <img
                              src={membro.avatar}
                              alt={membro.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xl font-bold text-zinc-300 border-2 border-zinc-700 shadow-md">
                              {membro.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{membro.name}</p>
                            <p className="text-sm text-zinc-500">{membro.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-6 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 opacity-70" />
                          {membro.email}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-medium border ${getRoleBadge(membro.role)}`}>
                          {membro.role}
                        </span>
                      </td>

                      <td className="py-5 px-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                          membro.status === 'ativo'
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-red-900/40 text-red-300'
                        }`}>
                          {membro.status?.toUpperCase() || 'Ativo'}
                        </span>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(membro)}
                            className="p-2.5 hover:bg-zinc-800 rounded-lg transition-colors group"
                            title="Editar membro"
                          >
                            <Edit className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                          </button>

                          <button
                            onClick={() => handleDeleteMember(membro.id, membro.name)}
                            className="p-2.5 hover:bg-zinc-800 rounded-lg transition-colors group"
                            title="Remover membro"
                          >
                            <Trash2 className="w-5 h-5 text-zinc-400 group-hover:text-red-400" />
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white">
                  {editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {newMember.avatar ? (
                      <img
                        src={newMember.avatar}
                        alt="Avatar"
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-zinc-700 shadow-xl transition-all group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-6xl text-zinc-500 border-4 border-zinc-700 shadow-xl">
                        {newMember.name?.charAt(0)?.toUpperCase() || 'N'}
                      </div>
                    )}

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-3 -right-3 bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-full shadow-2xl hover:scale-110 transition-all ring-4 ring-zinc-950"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-zinc-500">Clique na câmera para adicionar foto</p>
                </div>

                {/* Campos */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="joao@havk.local"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Permissão
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Status
                      </label>
                      <select
                        value={newMember.status}
                        onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingMember(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveMember}
                    icon={<CheckCircle className="w-5 h-5" />}
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
  );
}