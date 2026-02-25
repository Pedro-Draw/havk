import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Users, UserPlus, Shield, Edit, Trash2 } from 'lucide-react';
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
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Member' });

  const handleAddMember = () => {
    setMembros((prev) => [
      ...prev,
      { id: Date.now(), ...newMember, avatar: null },
    ]);
    setNewMember({ name: '', email: '', role: 'Member' });
    setIsModalOpen(false);
  };

  const roles = ['Admin', 'Member', 'Viewer'];

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('equipe')}</h1>
          </div>
          <Button variant="primary" icon={<UserPlus />} onClick={() => setIsModalOpen(true)}>
            Adicionar Membro
          </Button>
        </div>

        <Card title="Membros da Equipe" description="Gerencie permissões e acessos">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 font-medium text-zinc-300">Nome</th>
                  <th className="py-4 px-4 font-medium text-zinc-300">E-mail</th>
                  <th className="py-4 px-4 font-medium text-zinc-300">Permissão</th>
                  <th className="py-4 px-4 font-medium text-zinc-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {membros.map((membro) => (
                  <tr key={membro.id} className="border-b border-zinc-800 hover:bg-zinc-900">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {membro.avatar ? (
                          <img src={membro.avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
                            {membro.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{membro.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-400">{membro.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        membro.role === 'Admin' ? 'bg-red-900/30 text-red-300' :
                        membro.role === 'Member' ? 'bg-zinc-800 text-zinc-300' :
                        'bg-blue-900/30 text-blue-300'
                      }`}>
                        {membro.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-800 rounded">
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button className="p-2 hover:bg-zinc-800 rounded">
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
          title="Adicionar Novo Membro"
          size="md"
        >
          <div className="space-y-6">
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Nome completo"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
            />
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="E-mail"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100"
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleAddMember}>
                Adicionar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}