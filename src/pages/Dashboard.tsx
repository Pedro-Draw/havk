import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { BarChart3, Clock, ListTodo, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import { getAll } from '../db/indexedDB';

export default function Dashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      const demandas = await getAll<any>('demandas');
      const now = new Date();

      const total = demandas.length;
      const inProgress = demandas.filter((d) => d.status === 'em-progresso').length;
      const completed = demandas.filter((d) => d.status === 'concluida').length;
      const overdue = demandas.filter(
        (d) => d.prazo && new Date(d.prazo) < now && d.status !== 'concluida'
      ).length;

      setMetrics({ total, inProgress, completed, overdue });
    };

    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">{t('dashboard')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title={t('totalDemandas')} description={t('total')}>
            <div className="flex items-center gap-4">
              <ListTodo className="w-10 h-10 text-zinc-400" />
              <span className="text-4xl font-bold">{metrics.total}</span>
            </div>
          </Card>

          <Card title={t('emProgresso')} description={t('emProgresso')}>
            <div className="flex items-center gap-4">
              <Clock className="w-10 h-10 text-zinc-400" />
              <span className="text-4xl font-bold">{metrics.inProgress}</span>
            </div>
          </Card>

          <Card title={t('concluidas')} description={t('concluidas')}>
            <div className="flex items-center gap-4">
              <BarChart3 className="w-10 h-10 text-zinc-400" />
              <span className="text-4xl font-bold">{metrics.completed}</span>
            </div>
          </Card>

          <Card title={t('atrasadas')} description={t('atrasadas')}>
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <span className="text-4xl font-bold text-red-500">{metrics.overdue}</span>
            </div>
          </Card>
        </div>

        <div className="mt-12">
          <Card title="Demandas Recentes" description="Últimas 5 demandas criadas">
            <div className="space-y-4">
              {/* Placeholder para lista de demandas recentes */}
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <p className="text-zinc-400">Nenhuma demanda recente ainda. Crie uma nova!</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}