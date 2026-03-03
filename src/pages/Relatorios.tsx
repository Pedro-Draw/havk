import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  BarChart3,
  Calendar,
  RefreshCw,
  AlertCircle,
  Download,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { getAll, Demanda } from '../db/indexedDB';
import { format, subDays, startOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type PeriodoFiltro = '30d' | '90d' | 'este-ano' | 'tudo';

interface Estatisticas {
  totalDemandas: number;
  demandasConcluidas: number;
  taxaConclusao: number;
  mediaTempoConclusaoDias: number;
  conclusoesPorMes: Array<{ mes: string; quantidade: number }>;
  distribuicaoStatus: Array<{ name: string; value: number }>;
  topUsuarios: Array<{ nome: string; concluidas: number }>;
}

const CORES_STATUS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

const useRelatoriosData = (periodo: PeriodoFiltro) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Estatisticas>({
    totalDemandas: 0,
    demandasConcluidas: 0,
    taxaConclusao: 0,
    mediaTempoConclusaoDias: 0,
    conclusoesPorMes: [],
    distribuicaoStatus: [],
    topUsuarios: [],
  });

  useEffect(() => {
    let mounted = true;

    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        const todasDemandas = await getAll<Demanda>('demandas');

        const agora = new Date();
        let demandasFiltradas = todasDemandas;

        if (periodo !== 'tudo') {
          let dataInicio: Date;

          if (periodo === '30d') dataInicio = subDays(agora, 30);
          else if (periodo === '90d') dataInicio = subDays(agora, 90);
          else if (periodo === 'este-ano') dataInicio = startOfYear(agora);

          demandasFiltradas = todasDemandas.filter((d) =>
            d.createdAt && isWithinInterval(new Date(d.createdAt), { start: dataInicio, end: agora })
          );
        }

        const concluidas = demandasFiltradas.filter((d) => d.status === 'concluida' || d.concluidaEm);

        const total = demandasFiltradas.length;
        const concluidasCount = concluidas.length;
        const taxa = total > 0 ? Math.round((concluidasCount / total) * 100) : 0;

        const temposConclusao = concluidas
          .filter((d) => d.createdAt && d.concluidaEm)
          .map((d) => {
            const ini = new Date(d.createdAt!);
            const fim = new Date(d.concluidaEm!);
            return (fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24);
          });

        const mediaDias =
          temposConclusao.length > 0
            ? temposConclusao.reduce((a, b) => a + b, 0) / temposConclusao.length
            : 0;

        const porMesRaw = concluidas.reduce<Record<string, number>>((acc, d) => {
          if (d.concluidaEm) {
            const data = new Date(d.concluidaEm);
            const chave = format(data, 'MMM yyyy', { locale: ptBR });
            acc[chave] = (acc[chave] || 0) + 1;
          }
          return acc;
        }, {});

        const conclusoesPorMes = Object.entries(porMesRaw)
          .map(([mes, qtd]) => ({ mes, quantidade: qtd }))
          .sort((a, b) => {
            const dataA = new Date(a.mes);
            const dataB = new Date(b.mes);
            return dataA.getTime() - dataB.getTime();
          });

        const statusCount = demandasFiltradas.reduce<Record<string, number>>((acc, d) => {
          const st = d.status || 'sem-status';
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {});

        const distribuicaoStatus = Object.entries(statusCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const porUsuarioRaw = concluidas.reduce<Record<string, number>>((acc, d) => {
          const resp = d.responsavel || 'Sem responsável';
          acc[resp] = (acc[resp] || 0) + 1;
          return acc;
        }, {});

        const topUsuarios = Object.entries(porUsuarioRaw)
          .map(([nome, concluidas]) => ({ nome, concluidas }))
          .sort((a, b) => b.concluidas - a.concluidas)
          .slice(0, 5);

        if (mounted) {
          setStats({
            totalDemandas: total,
            demandasConcluidas: concluidasCount,
            taxaConclusao: taxa,
            mediaTempoConclusaoDias: mediaDias,
            conclusoesPorMes,
            distribuicaoStatus,
            topUsuarios,
          });
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar os relatórios. Tente novamente.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    carregarDados();

    return () => {
      mounted = false;
    };
  }, [periodo]);

  return { stats, loading, error };
};

export default function Relatorios() {
  const { t } = useTranslation();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const reportRef = useRef<HTMLDivElement>(null);

  const { stats, loading, error } = useRelatoriosData(periodo);

  const exportarCSV = () => {
    const headers = [
      'Mês/Ano',
      'Demandas Concluídas',
      'Total Demandadas',
      'Taxa de Conclusão (%)',
      'Média Dias Conclusão',
    ];

    const rows = [
      [
        periodo === 'tudo' ? 'Todo o período' : periodo,
        stats.demandasConcluidas,
        stats.totalDemandas,
        stats.taxaConclusao,
        stats.mediaTempoConclusaoDias.toFixed(1),
      ],
    ];

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `relatorio-demandas-${format(new Date(), 'yyyy-MM-dd')}.csv`);

    toast.success('CSV exportado com sucesso!');
  };

  const exportarPDF = async () => {
    if (!reportRef.current) {
      toast.error('Área do relatório não encontrada');
      return;
    }

    const toastId = toast.loading('Gerando PDF (pode demorar alguns segundos)...');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const clone = reportRef.current.cloneNode(true) as HTMLElement;
      clone.style.backgroundColor = '#0a0a0a';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        allowTaint: true,
        removeContainer: true,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pageWidth / imgWidth, (pageHeight - 40) / imgHeight);
      const imgX = (pageWidth - imgWidth * ratio) / 2;
      const imgY = 20;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      pdf.save(`relatorio-demandas-${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

      toast.dismiss(toastId);
      toast.success('PDF gerado e baixado!');
    } catch (err) {
      console.error('Erro completo ao gerar PDF:', err);
      toast.dismiss(toastId);
      toast.error('Erro ao gerar PDF. Verifique o console e tente novamente.');
    }
  };

  const opcoesPeriodo = [
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'tudo', label: 'Todo o histórico' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-zinc-400" />
          <p className="mt-4 text-zinc-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-white">Erro ao carregar</h2>
          <p className="mt-2 text-zinc-400">{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div ref={reportRef} className="max-w-7xl mx-auto pb-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-zinc-800 rounded-xl">
                <BarChart3 className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t('relatorios')}</h1>
                <p className="text-zinc-400 text-sm mt-1">Análise de desempenho e produtividade</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
                options={opcoesPeriodo}
                icon={<Calendar className="w-4 h-4" />}
                className="w-56"
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportarCSV}>
                  CSV
                </Button>
                <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportarPDF}>
                  PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <p className="text-sm text-zinc-400">Total de Demandas</p>
              <p className="text-3xl font-bold mt-1">{stats.totalDemandas}</p>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <p className="text-sm text-zinc-400">Demandas Concluídas</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">{stats.demandasConcluidas}</p>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <p className="text-sm text-zinc-400">Taxa de Conclusão</p>
              <p className="text-3xl font-bold mt-1 text-sky-400">{stats.taxaConclusao}%</p>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <p className="text-sm text-zinc-400">Média de Tempo</p>
              <p className="text-3xl font-bold mt-1">
                {stats.mediaTempoConclusaoDias.toFixed(1)} <span className="text-xl">dias</span>
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Evolução de Conclusões" description="Últimos meses" className="h-full">
              {stats.conclusoesPorMes.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-zinc-500">
                  Nenhum dado no período selecionado
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={stats.conclusoesPorMes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="mes" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        labelStyle={{ color: '#e4e4e7' }}
                      />
                      <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Distribuição por Status" description="Situação atual das demandas">
              {stats.distribuicaoStatus.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-zinc-500">
                  Nenhum dado no período selecionado
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer>
                    <RePieChart>
                      <Pie
                        data={stats.distribuicaoStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.distribuicaoStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_STATUS[index % CORES_STATUS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" wrapperStyle={{ color: '#d4d4d8' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Top Performers" description="Responsáveis com mais conclusões" className="lg:col-span-2">
              <div className="space-y-3 mt-4">
                {stats.topUsuarios.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">Nenhum dado disponível</p>
                ) : (
                  stats.topUsuarios.map((user, idx) => (
                    <div
                      key={user.nome}
                      className="flex items-center justify-between p-4 bg-zinc-900/70 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{user.nome}</span>
                      </div>
                      <div className="text-emerald-400 font-bold">{user.concluidas} concluídas</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}