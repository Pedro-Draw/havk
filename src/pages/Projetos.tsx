import { useTranslation } from '../i18n/useTranslation';
import { FolderKanban, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Projetos() {
  const { t } = useTranslation();

  // Mock de projetos
  const projetos = [
    { id: 1, name: 'Projeto Cliente A', status: 'ativo', demandas: 12 },
    { id: 2, name: 'Interno - Redesign', status: 'em andamento', demandas: 8 },
    { id: 3, name: 'Projeto Teste', status: 'concluído', demandas: 5 },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('projetos')}</h1>
          </div>
          <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
            Novo Projeto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map((proj) => (
            <Card key={proj.id} title={proj.name} hoverable>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Status:</span>
                  <span className="capitalize">{proj.status}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Demandas:</span>
                  <span>{proj.demandas}</span>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  Ver Projeto
                </Button>
              </div>
            </Card>
          ))}

          <Card hoverable className="border-dashed border-zinc-700 flex items-center justify-center h-full">
            <div className="text-center py-12">
              <Plus className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">Criar novo projeto</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}