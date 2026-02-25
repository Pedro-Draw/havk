import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getAll } from '../db/indexedDB';

export default function Relatorios() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalDemandas: 0,
    mediaTempo: 0,
    conclusaoPorMes: {},
  });

  useEffect(() => {
    const loadStats = async () => {
      const demandas = await getAll<any>('demandas');
      const total = demandas.length;

      // Média de tempo (mock simples)
      const mediaTempo = demandas.length > 0
        ? demandas.reduce((sum: number, d: any) => sum + (d.tempoEstimado || 0), 0) / total
        : 0;

      // Conclusões por mês (mock)
      const conclusaoPorMes = demandas.reduce((acc: any, d: any) => {
        if (d.concluidaEm) {
          const mes = new Date(d.concluidaEm).toLocaleString('default', { month: 'short' });
          acc[mes] = (acc[mes] || 0) + 1;
        }
        return acc;
      }, {});

      setStats({ totalDemandas: total, mediaTempo, conclusaoPorMes });
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('relatorios')}</h1>
          </div>
          <Button variant="outline" icon={<Download />}>
            Exportar PDF/CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Visão Geral" description="Métricas principais">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-zinc-100">{stats.totalDemandas}</p>
                <p className="text-sm text-zinc-400 mt-2">{t('totalDemandas')}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-zinc-100">
                  {stats.mediaTempo.toFixed(1)} dias
                </p>
                <p className="text-sm text-zinc-400 mt-2">Média de tempo por demanda</p>
              </div>
            </div>
          </Card>

          <Card title="Conclusões por Mês" description="Evolução mensal">
            <div className="h-64 flex items-center justify-center text-zinc-500">
              Gráfico de barras (em desenvolvimento)
            </div>
          </Card>

          <Card title="Distribuição de Status" description="Pizza de status" className="lg:col-span-2">
            <div className="h-64 flex items-center justify-center text-zinc-500">
              Gráfico de pizza (em desenvolvimento)
            </div>
          </Card>

          <Card title="Produtividade da Equipe" description="Top performers" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-zinc-900 rounded-lg">
                <span>Equipe Dev</span>
                <span className="font-bold">42 demandas concluídas</span>
              </div>
              <div className="flex justify-between p-4 bg-zinc-900 rounded-lg">
                <span>Equipe Design</span>
                <span className="font-bold">28 demandas concluídas</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}