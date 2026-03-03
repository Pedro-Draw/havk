import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { FolderKanban, Plus, X, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input'; // assumindo que você tem esse componente
import Textarea from '../components/ui/textarea'; // assumindo que você tem
import { useNavigate } from 'react-router-dom'; // para redirecionar

export default function Projetos() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mock de projetos (pode vir do store ou IndexedDB depois)
  const [projetos, setProjetos] = useState([
    { id: 1, name: 'Projeto Cliente A', status: 'ativo', demandas: 12, description: 'Projeto comercial para cliente externo' },
    { id: 2, name: 'Interno - Redesign', status: 'em andamento', demandas: 8, description: 'Redesign do produto interno' },
    { id: 3, name: 'Projeto Teste', status: 'concluído', demandas: 5, description: 'Projeto piloto para testes' },
  ]);

  // Modal de novo projeto
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'ativo',
  });

  const handleNovoProjeto = () => {
    setShowModal(true);
    setNewProject({ name: '', description: '', status: 'ativo' });
  };

  const handleVerProjeto = (id: number) => {
    navigate(`/projetos/${id}`); // rota exemplo – ajuste conforme sua estrutura
  };

  const handleSaveNewProject = () => {
    if (!newProject.name.trim()) {
      alert('O nome do projeto é obrigatório');
      return;
    }

    const novo = {
      id: Date.now(),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      status: newProject.status,
      demandas: 0,
    };

    setProjetos((prev) => [...prev, novo]);
    setShowModal(false);
    alert('Projeto criado com sucesso! (mock – pode salvar no IndexedDB depois)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header + lg:pl-64 para sidebar */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div className="mx-auto max-w-7xl pb-20">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <FolderKanban className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t('projetos') || 'Projetos'}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">
                  {projetos.length} projetos • Organize demandas e acompanhe progresso
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
              onClick={handleNovoProjeto}
            >
              Novo Projeto
            </Button>
          </div>

          {/* Grid de projetos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projetos.map((proj) => (
              <Card
                key={proj.id}
                title={proj.name}
                hoverable
                className="border-zinc-800 shadow-xl transition-all hover:shadow-2xl hover:border-zinc-700 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-1 space-y-5">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-zinc-400">Status:</span>
                    <span
                      className={`font-medium capitalize px-4 py-1.5 rounded-full ${
                        proj.status === 'ativo'
                          ? 'bg-green-900/40 text-green-300'
                          : proj.status === 'em andamento'
                          ? 'bg-blue-900/40 text-blue-300'
                          : 'bg-gray-800/60 text-gray-300'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-base">
                    <span className="text-zinc-400">Demandas associadas:</span>
                    <span className="font-medium text-lg text-zinc-100">
                      {proj.demandas}
                    </span>
                  </div>

                  <div className="mt-auto pt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      size="md"
                      className="py-4 text-base"
                      onClick={() => handleVerProjeto(proj.id)}
                    >
                      Ver Projeto
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Card "Criar novo projeto" */}
            <Card
              hoverable
              className="border-dashed border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors min-h-[280px] shadow-xl"
              onClick={handleNovoProjeto}
            >
              <div className="text-center py-12">
                <Plus className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
                <p className="text-xl font-medium text-zinc-400">
                  Criar novo projeto
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal simples de criação de projeto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 w-full max-w-lg rounded-2xl p-6 border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Novo Projeto</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white text-3xl"
              >
                <X />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Ex: Projeto Cliente XYZ"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Breve descrição do projeto..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Status Inicial
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="em andamento">Em andamento</option>
                  <option value="concluído">Concluído</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSaveNewProject}>
                  Criar Projeto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}