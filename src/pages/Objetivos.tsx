import { useTranslation } from '../i18n/useTranslation';
import { Target, Plus, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Objetivos() {
  const { t } = useTranslation();

  const objetivos = [
    { id: 1, title: 'Aumentar produtividade em 30%', progress: 65, deadline: '30/06/2026' },
    { id: 2, title: 'Concluir 100 demandas no trimestre', progress: 42, deadline: '31/03/2026' },
    { id: 3, title: 'Implementar OKRs na equipe', progress: 90, deadline: '15/04/2026' },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('objetivos')}</h1>
          </div>
          <Button variant="primary" icon={<Plus />}>
            Novo Objetivo
          </Button>
        </div>

        <div className="space-y-6">
          {objetivos.map((obj) => (
            <Card key={obj.id} title={obj.title} hoverable>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-zinc-400">Progresso</div>
                  <div className="text-lg font-bold text-zinc-100">{obj.progress}%</div>
                </div>

                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-100 rounded-full transition-all"
                    style={{ width: `${obj.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Prazo: {obj.deadline}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Em andamento
                  </span>
                </div>

                <Button variant="outline" size="sm" fullWidth>
                  Atualizar Progresso
                </Button>
              </div>
            </Card>
          ))}

          {objetivos.length === 0 && (
            <Card>
              <div className="text-center py-12 text-zinc-500">
                Nenhum objetivo definido ainda
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}