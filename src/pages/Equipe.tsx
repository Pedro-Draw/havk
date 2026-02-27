import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Users, UserPlus, Shield, Edit, Trash2, Camera } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

export default function Equipe() {
  const { t } = useTranslation();

  const [membros, setMembros] = useState([
    { id: 1, name: 'Pedro', email: 'pedro@havk.local', role: 'Admin', avatar: null },
    { id: 2, name: 'Ana Design', email: 'ana@havk.local', role: 'Member', avatar: null },
    { id: 3, name: 'João Dev', email: 'joao@havk.local', role: 'Viewer', avatar: null },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Member',
    avatar: null as string | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) return;

    setMembros((prev) => [
      ...prev,
      { id: Date.now(), ...newMember },
    ]);

    setNewMember({ name: '', email: '', role: 'Member', avatar: null });
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id: number) => {
    setMembros((prev) => prev.filter((m) => m.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewMember((prev) => ({ ...prev, avatar: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const roles = [
    'Admin',
    'Member',
    'Viewer',
    'Project Manager',
    'Developer',
    'Designer',
    'Finance',
    'Support',
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-900/30 text-red-300';
      case 'Project Manager':
        return 'bg-purple-900/30 text-purple-300';
      case 'Developer':
        return 'bg-green-900/30 text-green-300';
      case 'Designer':
        return 'bg-pink-900/30 text-pink-300';
      case 'Finance':
        return 'bg-yellow-900/30 text-yellow-300';
      case 'Support':
        return 'bg-indigo-900/30 text-indigo-300';
      case 'Member':
        return 'bg-zinc-800 text-zinc-300';
      default:
        return 'bg-blue-900/30 text-blue-300';
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('equipe')}</h1>
          </div>

          <Button
            variant="primary"
            icon={<UserPlus />}
            onClick={() => setIsModalOpen(true)}
          >
            {t('adicionarMembro') || 'Adicionar Membro'}
          </Button>
        </div>

        <Card
          title={t('membrosDaEquipe') || 'Membros da Equipe'}
          description={t('gerenciePermissoes') || 'Gerencie permissões e acessos'}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 font-medium text-zinc-300">
                    {t('nome') || 'Nome'}
                  </th>
                  <th className="py-4 px-4 font-medium text-zinc-300">
                    {t('email') || 'E-mail'}
                  </th>
                  <th className="py-4 px-4 font-medium text-zinc-300">
                    {t('permissao') || 'Permissão'}
                  </th>
                  <th className="py-4 px-4 font-medium text-zinc-300">
                    {t('acoes') || 'Ações'}
                  </th>
                </tr>
              </thead>

              <tbody>
                {membros.map((membro) => (
                  <tr
                    key={membro.id}
                    className="border-b border-zinc-800 hover:bg-zinc-900"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {membro.avatar ? (
                          <img
                            src={membro.avatar}
                            alt={membro.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-medium">
                            {membro.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{membro.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-zinc-400">
                      {membro.email}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                          membro.role
                        )}`}
                      >
                        {membro.role}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-800 rounded">
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </button>

                        <button
                          onClick={() => handleDeleteMember(membro.id)}
                          className="p-2 hover:bg-zinc-800 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t('adicionarNovoMembro') || 'Adicionar Novo Membro'}
          size="md"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {newMember.avatar ? (
                  <img
                    src={newMember.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl text-zinc-400">
                    {newMember.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-zinc-800 p-2 rounded-full hover:bg-zinc-700"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <input
              type="text"
              value={newMember.name}
              onChange={(e) =>
                setNewMember({ ...newMember, name: e.target.value })
              }
              placeholder={t('nomeCompleto') || 'Nome completo'}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100"
            />

            <input
              type="email"
              value={newMember.email}
              onChange={(e) =>
                setNewMember({ ...newMember, email: e.target.value })
              }
              placeholder={t('email') || 'E-mail'}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100"
            />

            <select
              value={newMember.role}
              onChange={(e) =>
                setNewMember({ ...newMember, role: e.target.value })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(role) || role}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {t('cancelar') || 'Cancelar'}
              </Button>

              <Button variant="primary" onClick={handleAddMember}>
                {t('adicionar') || 'Adicionar'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}