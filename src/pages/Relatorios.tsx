// pages/Relatorios.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  BarChart3,
  Calendar,
  RefreshCw,
  AlertCircle,
  Download,
  Search,
  TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import {
  format,
  subDays,
  startOfYear,
  isWithinInterval,
  parse,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore } from '../store/useAppStore';
// html2canvas não utilizado nesta página

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

type PeriodoFiltro = '30d' | '90d' | 'este-ano' | 'tudo' | 'sprint';

interface Estatisticas {
  totalDemandas: number;
  demandasConcluidas: number;
  demandasBloqueadas: number;
  demandasAtrasadas: number;
  taxaConclusao: number;
  mediaTempoConclusaoDias: number;
  conclusoesPorMes: Array<{ mes: string; quantidade: number }>;
  distribuicaoStatus: Array<{ name: string; value: number }>;
  topUsuarios: Array<{ nome: string; concluidas: number; totalAtribuidas: number; mediaDias: number }>;
  periodoInicio: string;
  periodoFim: string;
  sprintInicio?: string;
  sprintFim?: string;
  produtividadePorDev: Array<{ nome: string; concluidas: number; total: number; mediaDias: number }>;
}

// ────────────────────────────────────────────────
// PALETA DE CORES AJUSTADA – mais distinta, vibrante e agradável
// ────────────────────────────────────────────────
const CORES_STATUS = {
  aberta:      '#60a5fa',
  'em-progresso': '#10b981',
  concluida:   '#22c55e',
  bloqueada:   '#8b5cf6',
  atrasada:    '#ef4444',
  cancelada:   '#6b7280',
  default:     '#9ca3af',
};

const _CORES_PRIORIDADE = {
  baixa:     '#10b981',
  media:     '#f59e0b',
  alta:      '#f97316',
  urgente:   '#dc2626',
  critica:   '#b91c1c',
  default:   '#9ca3af',
};

const _PALETA_DESTAQUE = [
  '#3b82f6',   '#10b981',   '#f59e0b',   '#ec4899',   '#8b5cf6',
  '#14b8a6',   '#f97316',   '#ef4444',   '#6366f1',   '#f472b6',
];

const _PALETA_DESTAQUE_SOFISTICADA = [
  '#6366f1',   '#10b981',   '#f59e0b',   '#ec4899',   '#06b6d4',
  '#8b5cf6',   '#f97316',   '#64748b',
];

// Função de parse corrigida para evitar -1 dia (força horário local São Paulo)
const parseDueDate = (dueDate: string | undefined | null): Date | null => {
  if (!dueDate) return null;
  const str = String(dueDate).trim();

  // Tenta parse direto (ISO ou formatos reconhecidos)
  let dt = new Date(str);
  if (!isNaN(dt.getTime())) return dt;

  // Formato BR sem hora: dd/MM/yyyy
  const matchBR = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBR) {
    const [_, day, month, year] = matchBR;
    // Construtor local (ano, mês-1, dia, 0h local)
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
  }

  // Formato BR com hora: dd/MM/yyyy HH:mm
  const matchBRFull = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (matchBRFull) {
    const [_, day, month, year, hour, minute] = matchBRFull;
    // Força horário local São Paulo
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
  }

  // Formato ISO yyyy-MM-dd
  const parsedISO = parse(str, 'yyyy-MM-dd', new Date());
  if (!isNaN(parsedISO.getTime())) return parsedISO;

  // Último fallback
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
};

const getTitulo = (d: any) => d.titulo ?? d.title ?? d.nome ?? d.description ?? '—';
const getResponsavel = (d: any) => d.assignee ?? d.responsavel ?? d.assignedTo ?? d.responsável ?? d.assigned ?? 'Sem responsável';
const getPrazoRaw = (d: any) => d.dueDate ?? d.prazo ?? d.deadline ?? d.due_date ?? null;
const getPrioridade = (d: any) =>
  d.prioridade ??
  d.priority ??
  d.nivelPrioridade ??
  d.level ??
  d.importancia ??
  d.prioridadeNivel ??
  'Sem prioridade';

const useRelatoriosData = (periodo: PeriodoFiltro) => {
  const { demandas: demandasRaw = [], isLoading } = useAppStore();
  const demandas = demandasRaw ?? [];
  const [stats, setStats] = useState<Estatisticas>({
    totalDemandas: 0,
    demandasConcluidas: 0,
    demandasBloqueadas: 0,
    demandasAtrasadas: 0,
    taxaConclusao: 0,
    mediaTempoConclusaoDias: 0,
    conclusoesPorMes: [],
    distribuicaoStatus: [],
    topUsuarios: [],
    periodoInicio: '',
    periodoFim: '',
    produtividadePorDev: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    try {
      const agora = new Date();
      let dataInicio = new Date(0);
      let sprintInicio: string | undefined;
      let sprintFim: string | undefined;
      let demandasFiltradas = demandas;

      if (periodo === 'sprint') {
        const sprintAtual = demandas
          .filter(d => d.sprint)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
        if (sprintAtual?.sprintInicio && sprintAtual?.sprintFim) {
          dataInicio = new Date(sprintAtual.sprintInicio);
          sprintInicio = format(dataInicio, 'dd/MM/yyyy', { locale: ptBR });
          sprintFim = format(new Date(sprintAtual.sprintFim), 'dd/MM/yyyy', { locale: ptBR });
          demandasFiltradas = demandas.filter(d =>
            d.sprintInicio && isWithinInterval(new Date(d.sprintInicio), { start: dataInicio, end: new Date((sprintAtual as any).sprintFim) })
          );
        }
      } else if (periodo !== 'tudo') {
        if (periodo === '30d') dataInicio = subDays(agora, 30);
        else if (periodo === '90d') dataInicio = subDays(agora, 90);
        else if (periodo === 'este-ano') dataInicio = startOfYear(agora);
        demandasFiltradas = demandas.filter((d) =>
          d?.createdAt && isWithinInterval(new Date(d.createdAt), { start: dataInicio, end: agora })
        );
      } else if (demandas.length > 0) {
        const datas = demandas
          .filter(d => d?.createdAt)
          .map(d => new Date(d.createdAt!).getTime());
        if (datas.length > 0) {
          dataInicio = new Date(Math.min(...datas));
        }
      }

      const periodoInicioStr = format(dataInicio, 'dd/MM/yyyy', { locale: ptBR });
      const periodoFimStr = sprintFim || format(agora, 'dd/MM/yyyy', { locale: ptBR });

      const concluidas = demandasFiltradas.filter((d) => d?.status === 'concluida');
      const bloqueadas = demandasFiltradas.filter((d) => d?.status === 'bloqueada').length;
      const atrasadas = demandasFiltradas.filter((d) => {
        const prazoRaw = getPrazoRaw(d);
        if (!prazoRaw || d?.status === 'concluida') return false;
        const prazo = parseDueDate(prazoRaw);
        return prazo !== null && prazo < agora;
      }).length;

      const total = demandasFiltradas.length;
      const concluidasCount = concluidas.length;
      const taxa = total > 0 ? Math.round((concluidasCount / total) * 100) : 0;

      const temposConclusao = concluidas
        .filter((d) => d?.createdAt && d?.updatedAt)
        .map((d) => differenceInDays(new Date(d.updatedAt!), new Date(d.createdAt!)));

      const mediaDias = temposConclusao.length > 0
        ? temposConclusao.reduce((a, b) => a + b, 0) / temposConclusao.length
        : 0;

      const porMesRaw = concluidas.reduce<Record<string, number>>((acc, d) => {
        if (d?.updatedAt) {
          const data = new Date(d.updatedAt);
          const chave = format(data, 'MMM yyyy', { locale: ptBR });
          acc[chave] = (acc[chave] || 0) + 1;
        }
        return acc;
      }, {});

      const conclusoesPorMes = Object.entries(porMesRaw)
        .map(([mes, qtd]) => ({ mes, quantidade: qtd }))
        .sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());

      const statusCount = demandasFiltradas.reduce<Record<string, number>>((acc, d) => {
        const st = d?.status || 'sem-status';
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {});

      const distribuicaoStatus = Object.entries(statusCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const porUsuarioRaw = concluidas.reduce<Record<string, number>>((acc, d) => {
        const resp = getResponsavel(d);
        acc[resp] = (acc[resp] || 0) + 1;
        return acc;
      }, {});

      const totalPorUsuario = demandasFiltradas.reduce<Record<string, number>>((acc, d) => {
        const resp = getResponsavel(d);
        acc[resp] = (acc[resp] || 0) + 1;
        return acc;
      }, {});

      const topUsuarios = Object.entries(porUsuarioRaw)
        .map(([nome, concluidasCount]) => ({
          nome,
          concluidas: concluidasCount,
          totalAtribuidas: totalPorUsuario[nome] || concluidasCount,
          mediaDias: 0,
        }))
        .sort((a, b) => b.concluidas - a.concluidas)
        .slice(0, 5);

      const produtividadePorDev = Object.entries(totalPorUsuario)
        .map(([nome, total]) => {
          const concluidasDev = porUsuarioRaw[nome] || 0;
          const concluidasDevList = concluidas.filter(d => getResponsavel(d) === nome);
          const mediaDev = concluidasDevList.length > 0
            ? concluidasDevList.reduce((sum, d) => {
                if (d?.createdAt && d?.updatedAt) {
                  return sum + differenceInDays(new Date(d.updatedAt!), new Date(d.createdAt!));
                }
                return sum;
              }, 0) / concluidasDevList.length
            : 0;
          return { nome, concluidas: concluidasDev, total, mediaDias: mediaDev };
        })
        .sort((a, b) => b.concluidas - a.concluidas);

      setStats({
        totalDemandas: total,
        demandasConcluidas: concluidasCount,
        demandasBloqueadas: bloqueadas,
        demandasAtrasadas: atrasadas,
        taxaConclusao: taxa,
        mediaTempoConclusaoDias: mediaDias,
        conclusoesPorMes,
        distribuicaoStatus,
        topUsuarios,
        periodoInicio: periodoInicioStr,
        periodoFim: periodoFimStr,
        sprintInicio,
        sprintFim,
        produtividadePorDev,
      });
      setError(null);
    } catch (err) {
      console.error('Erro ao processar relatórios:', err);
      setError('Não foi possível carregar os relatórios. Tente novamente.');
    }
  }, [demandas, periodo, isLoading]);

  let demandasFiltradasBase = demandas;
  if (periodo !== 'tudo') {
    const agora = new Date();
    let dataInicio: Date;
    if (periodo === '30d') dataInicio = subDays(agora, 30);
    else if (periodo === '90d') dataInicio = subDays(agora, 90);
    else if (periodo === 'este-ano') dataInicio = startOfYear(agora);
    else dataInicio = new Date(0);
    demandasFiltradasBase = demandas.filter((d) =>
      d?.createdAt && isWithinInterval(new Date(d.createdAt), { start: dataInicio, end: agora })
    );
  }

  return { stats, demandasFiltradasBase, loading: isLoading, error };
};

async function getImageData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url + '?' + new Date().getTime();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject('Não foi possível criar contexto');
      }
    };
    img.onerror = reject;
  });
}

export default function Relatorios() {
  useTranslation(); // reservado para futuras traduções
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState('todos');

  const reportRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<any>(null);
  const lineChartRef = useRef<any>(null);
  const doughnutChartRef = useRef<any>(null);
  const radarChartRef = useRef<any>(null);

  const { stats, demandasFiltradasBase, loading, error } = useRelatoriosData(periodo);

  const demandasFiltradas = useMemo(() => {
    let lista = demandasFiltradasBase;
    if (filtroTexto) {
      const texto = filtroTexto.toLowerCase();
      lista = lista.filter(d =>
        (getTitulo(d) || '').toLowerCase().includes(texto) ||
        (getResponsavel(d) || '').toLowerCase().includes(texto) ||
        (d.status || '').toLowerCase().includes(texto) ||
        (getPrioridade(d) || '').toLowerCase().includes(texto) ||
        (d.createdBy || '').toLowerCase().includes(texto)
      );
    }
    if (filtroStatus !== 'todos') lista = lista.filter(d => d.status === filtroStatus);
    if (filtroResponsavel !== 'todos') lista = lista.filter(d => getResponsavel(d) === filtroResponsavel);
    if (filtroPrioridade !== 'todos') lista = lista.filter(d => getPrioridade(d) === filtroPrioridade);
    return lista;
  }, [demandasFiltradasBase, filtroTexto, filtroStatus, filtroResponsavel, filtroPrioridade]);

  const responsaveisUnicos = useMemo(() => {
    const set = new Set(demandasFiltradasBase.map(d => getResponsavel(d)));
    return ['todos', ...Array.from(set)];
  }, [demandasFiltradasBase]);

  const prioridadesUnicas = useMemo(() => {
    const set = new Set(demandasFiltradasBase.map(d => getPrioridade(d)));
    return ['todos', ...Array.from(set).sort()];
  }, [demandasFiltradasBase]);

  const statusData = [
    { name: 'Aberta', value: stats.distribuicaoStatus.find(s => s.name === 'aberta')?.value || 0, color: CORES_STATUS.aberta },
    { name: 'Em Progresso', value: stats.distribuicaoStatus.find(s => s.name === 'em-progresso')?.value || 0, color: CORES_STATUS['em-progresso'] },
    { name: 'Concluída', value: stats.demandasConcluidas || 0, color: CORES_STATUS.concluida },
    { name: 'Bloqueada', value: stats.demandasBloqueadas || 0, color: CORES_STATUS.bloqueada },
    { name: 'Atrasada', value: stats.demandasAtrasadas || 0, color: CORES_STATUS.atrasada },
  ].filter(item => item.value > 0);

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e2e8f0', font: { size: 13 } } },
      tooltip: { backgroundColor: 'rgba(30,41,59,0.95)' },
    },
  };

  const cartesianOptions = {
    ...baseOptions,
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
    },
  };

  const _doughnutOptions = { ...baseOptions };

  const _radarOptions = {
    ...baseOptions,
    scales: {
      r: {
        beginAtZero: true,
        angleLines: { color: '#4b5563' },
        grid: { color: '#4b5563' },
        pointLabels: { font: { size: 13 }, color: '#d1d5db' },
        ticks: { color: '#9ca3af', backdropColor: 'transparent', stepSize: 5 },
      },
    },
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const resumoData = [
      ['Relatório de Demandas - Havk SaaS'],
      [`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`],
      [`Período: ${stats.periodoInicio} – ${stats.periodoFim}`],
      [],
      ['Resumo Geral'],
      ['Item', 'Valor'],
      ['Total de Demandas', stats.totalDemandas],
      ['Demandas Concluídas', stats.demandasConcluidas],
      ['Demandas Bloqueadas', stats.demandasBloqueadas],
      ['Demandas Atrasadas', stats.demandasAtrasadas],
      ['Taxa de Conclusão', `${stats.taxaConclusao}%`],
      ['Média de Tempo', `${stats.mediaTempoConclusaoDias.toFixed(1)} dias`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');

    const topData = [
      ['Top Performers'],
      ['Posição', 'Nome', 'Concluídas', 'Total Atribuídas'],
      ...stats.topUsuarios.map((u, i) => [i + 1, u.nome, u.concluidas, u.totalAtribuidas]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topData), 'Top Performers');

    const prodData = [
      ['Produtividade por Desenvolvedor'],
      ['Nome', 'Concluídas', 'Total Atribuídas', 'Média Dias por Tarefa'],
      ...stats.produtividadePorDev.map(d => [d.nome, d.concluidas, d.total, d.mediaDias.toFixed(1)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), 'Produtividade');

    const detalhesData = [
      ['Detalhes das Demandas'],
      ['ID', 'Título', 'Criado por', 'Responsável', 'Status', 'Prioridade', 'Criado em', 'Prazo'],
      ...demandasFiltradas.map(d => [
        d.id?.slice(0, 8) || '',
        getTitulo(d),
        d.createdBy || 'Desconhecido',
        getResponsavel(d),
        d.status || 'Pendente',
        getPrioridade(d),
        d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm') : '',
        (() => {
          const prazoRaw = getPrazoRaw(d);
          if (!prazoRaw) return 'Sem prazo';
          const parsed = parseDueDate(prazoRaw);
          if (!parsed || isNaN(parsed.getTime())) return String(prazoRaw).slice(0, 16) || '—';
          return format(parsed, 'dd/MM/yyyy HH:mm');
        })(),
      ]),
    ];
    const wsDetalhes = XLSX.utils.aoa_to_sheet(detalhesData);
    wsDetalhes['!freeze'] = { xSplit: 1, ySplit: 2 };
    XLSX.utils.book_append_sheet(wb, wsDetalhes, 'Detalhes');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), `relatorio-havk-${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    toast.success('Excel exportado com sucesso!');
  };

  const exportarPDF = async () => {
    const toastId = toast.loading('Gerando PDF otimizado...');
    try {
      let logoData = '';
      try {
        logoData = await getImageData('/logo.png');
      } catch {}

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin + 5;

      const addHeader = () => {
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageWidth, 8, 'F');
        if (logoData) pdf.addImage(logoData, 'PNG', margin, 1.5, 5, 5);
        pdf.setFontSize(8.5);
        pdf.setTextColor(200, 200, 240);
        pdf.text('Havk Intelligence Systems', margin + 7, 5.8);
      };

      const addFooter = (page: number, total: number) => {
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 140, 160);
        pdf.text(
          `Página ${page} de ${total} • ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          margin,
          pageHeight - 4
        );
      };

      // Capa
      addHeader();
      if (logoData) pdf.addImage(logoData, 'PNG', pageWidth / 2 - 12, 28, 24, 24);
      pdf.setFontSize(18);
      pdf.setTextColor(30, 40, 80);
      pdf.text('Relatório de Demandas', pageWidth / 2, 65, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${stats.periodoInicio} – ${stats.periodoFim}`, pageWidth / 2, 75, { align: 'center' });

      pdf.addPage();

      // Conteúdo principal
      addHeader();
      y = margin + 4;
      pdf.setFontSize(14);
      pdf.setTextColor(30, 40, 80);
      pdf.text('Resumo Geral', margin, y);
      y += 7;

      pdf.setFontSize(9.5);
      pdf.setTextColor(40, 50, 70);
      const resumoLinhas = [
        `Total de demandas ............. ${stats.totalDemandas}`,
        `Concluídas .................... ${stats.demandasConcluidas} (${stats.taxaConclusao}%)`,
        `Bloqueadas .................... ${stats.demandasBloqueadas}`,
        `Atrasadas ..................... ${stats.demandasAtrasadas}`,
        `Média de tempo de conclusão ... ${stats.mediaTempoConclusaoDias.toFixed(1)} dias`,
      ];
      resumoLinhas.forEach((linha) => {
        pdf.text(linha, margin + 3, y);
        y += 5;
      });

      y += 3;
      pdf.setFontSize(12);
      pdf.text('Distribuição por Status', margin, y);
      y += 6;
      pdf.setFontSize(9);
      stats.distribuicaoStatus.forEach((s) => {
        pdf.text(`• ${s.name.padEnd(18)} ${s.value}`, margin + 5, y);
        y += 4.5;
      });

      if (periodo === 'sprint' && stats.sprintInicio) {
        y += 4;
        pdf.setFontSize(12);
        pdf.text('Sprint Atual', margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.text(`Início: ${stats.sprintInicio}`, margin + 5, y); y += 4.5;
        pdf.text(`Fim: ${stats.sprintFim}`, margin + 5, y); y += 4.5;
      }

      // Gráficos compactos
      pdf.addPage();
      addHeader();
      y = margin + 4;
      pdf.setFontSize(14);
      pdf.text('Visualizações', margin, y);
      y += 8;

      const chartWidth = pageWidth - margin * 2;
      const chartHeightIdeal = 60;
      const maxYBeforeNewPage = pageHeight - chartHeightIdeal - 30;

      const addCompactChart = (title: string, ref: any, aspectRatio = 1.6) => {
        if (y > maxYBeforeNewPage) {
          pdf.addPage();
          addHeader();
          y = margin + 4;
        }
        pdf.setFontSize(11);
        pdf.text(title, margin, y);
        y += 6;
        const img = ref?.current?.toBase64Image('image/png', 1);
        if (img) {
          const targetHeight = Math.min(chartHeightIdeal, chartWidth / aspectRatio);
          pdf.addImage(img, 'PNG', margin, y, chartWidth, targetHeight);
          y += targetHeight + 8;
        }
      };

      addCompactChart('Evolução Mensal (concluídas + atrasos)', barChartRef, 1.65);
      addCompactChart('Distribuição por Status', doughnutChartRef, 1.0);
      addCompactChart('Produtividade por Desenvolvedor', radarChartRef, 1.1);
      addCompactChart('Tendência de Conclusões', lineChartRef, 1.65);

      // Tabelas
      if (y > pageHeight - 110) {
        pdf.addPage();
        addHeader();
        y = margin + 4;
      }

      pdf.setFontSize(13);
      pdf.text('Top Performers', margin, y);
      y += 7;

      autoTable(pdf, {
        startY: y,
        head: [['#', 'Nome', 'Conc.', 'Atrib.']],
        body: stats.topUsuarios.map((u, i) => [i + 1, u.nome, u.concluidas, u.totalAtribuidas]),
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2.8, overflow: 'ellipsize' },
        margin: { left: margin, right: margin },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 70 } },
      });

      y = (pdf as any).lastAutoTable.finalY + 8;

      pdf.setFontSize(13);
      pdf.text('Produtividade por Dev', margin, y);
      y += 7;

      autoTable(pdf, {
        startY: y,
        head: [['Nome', 'Conc.', 'Atrib.', 'Média dias']],
        body: stats.produtividadePorDev.map((d) => [
          d.nome,
          d.concluidas,
          d.total,
          d.mediaDias.toFixed(1),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2.8 },
        margin: { left: margin, right: margin },
        columnStyles: { 0: { cellWidth: 65 } },
      });

      y = (pdf as any).lastAutoTable.finalY + 8;

      if (demandasFiltradas.length <= 120) {
        if (y > pageHeight - 100) {
          pdf.addPage();
          addHeader();
          y = margin + 4;
        }

        pdf.setFontSize(13);
        pdf.text('Demandas Filtradas', margin, y);
        y += 7;

        autoTable(pdf, {
          startY: y,
          head: [['ID', 'Título', 'Resp.', 'Status', 'Prior.', 'Prazo']],
          body: demandasFiltradas.map((d) => [
            d.id?.slice(0, 8) || '',
            getTitulo(d).slice(0, 45) + (getTitulo(d).length > 45 ? '…' : ''),
            getResponsavel(d).split(' ')[0] || '—',
            d.status || '—',
            getPrioridade(d).slice(0, 1).toUpperCase() || '—',
            (() => {
              const prazoRaw = getPrazoRaw(d);
              if (!prazoRaw) return '—';
              const parsed = parseDueDate(prazoRaw);
              if (!parsed || isNaN(parsed.getTime())) return String(prazoRaw).slice(0, 10) || '—';
              return format(parsed, 'dd/MM/yy');
            })(),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8.5 },
          styles: { fontSize: 7.8, cellPadding: 2.5, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: 65 },
            2: { cellWidth: 28 },
            3: { cellWidth: 22 },
            4: { cellWidth: 14 },
            5: { cellWidth: 22 },
          },
          margin: { left: margin, right: margin },
          pageBreak: 'auto',
          rowPageBreak: 'avoid',
        });
      }

      const totalPages = (pdf as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addHeader();
        addFooter(i, totalPages);
      }

      pdf.save(`relatorio-havk-${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
      toast.dismiss(toastId);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Falha ao gerar PDF');
    }
  };

  const opcoesPeriodo = [
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'tudo', label: 'Todo histórico' },
    { value: 'sprint', label: 'Sprint Atual' },
  ];

  const barMultiData = {
    labels: stats.conclusoesPorMes.map(m => m.mes),
    datasets: [
      {
        label: 'Concluídas',
        data: stats.conclusoesPorMes.map(m => m.quantidade),
        backgroundColor: CORES_STATUS.concluida,
        borderColor: CORES_STATUS.concluida,
        borderWidth: 1,
      },
      {
        label: 'Atrasadas (média estimada)',
        data: stats.conclusoesPorMes.map(() => stats.demandasAtrasadas / (stats.conclusoesPorMes.length || 1)),
        backgroundColor: CORES_STATUS.atrasada,
        borderColor: CORES_STATUS.atrasada,
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: stats.conclusoesPorMes.map(m => m.mes),
    datasets: [{
      label: 'Evolução de Conclusões',
      data: stats.conclusoesPorMes.map(m => m.quantidade),
      borderColor: CORES_STATUS.aberta,
      backgroundColor: 'rgba(96, 165, 250, 0.18)',
      tension: 0.4,
      pointBackgroundColor: CORES_STATUS.aberta,
      pointBorderColor: '#111827',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  };

  const _doughnutData = {
    labels: stats.distribuicaoStatus.map(s => {
      if (s.name === 'aberta') return 'Aberta';
      if (s.name === 'em-progresso') return 'Em Progresso';
      if (s.name === 'concluida') return 'Concluída';
      if (s.name === 'bloqueada') return 'Bloqueada';
      return s.name.charAt(0).toUpperCase() + s.name.slice(1);
    }),
    datasets: [{
      data: stats.distribuicaoStatus.map(s => s.value),
      backgroundColor: [
        CORES_STATUS.aberta,
        CORES_STATUS['em-progresso'],
        CORES_STATUS.concluida,
        CORES_STATUS.bloqueada,
      ].slice(0, stats.distribuicaoStatus.length),
      borderColor: '#111827',
      borderWidth: 2,
      hoverOffset: 16,
    }],
  };

  const radarData = {
    labels: stats.produtividadePorDev.map(d => d.nome),
    datasets: [
      {
        label: 'Concluídas',
        data: stats.produtividadePorDev.map(d => d.concluidas),
        backgroundColor: 'rgba(52, 211, 153, 0.25)',
        borderColor: CORES_STATUS.concluida,
        pointBackgroundColor: CORES_STATUS.concluida,
        pointBorderColor: '#111827',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: CORES_STATUS.concluida,
      },
      {
        label: 'Atribuídas',
        data: stats.produtividadePorDev.map(d => d.total),
        backgroundColor: 'rgba(96, 165, 250, 0.25)',
        borderColor: CORES_STATUS.aberta,
        pointBackgroundColor: CORES_STATUS.aberta,
        pointBorderColor: '#111827',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: CORES_STATUS.aberta,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-sky-400" />
          <p className="mt-6 text-xl text-zinc-300">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="max-w-lg text-center bg-gradient-to-br from-red-950 to-zinc-950 border-red-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="mt-6 text-2xl font-bold text-white">Erro</h2>
          <p className="mt-4 text-zinc-300">{error}</p>
          <Button className="mt-8 bg-red-600 hover:bg-red-700" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div ref={reportRef} className="max-w-[1600px] mx-auto pb-20 space-y-10">

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-gradient-to-br from-sky-900 to-indigo-900 rounded-2xl shadow-2xl">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  Relatórios Havk
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">Análise avançada de desempenho e produtividade</p>
                <p className="text-zinc-300 mt-1">
                  Período: <span className="font-semibold">{stats.periodoInicio} – {stats.periodoFim}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
                options={opcoesPeriodo}
                icon={<Calendar className="w-5 h-5" />}
                className="w-64 bg-zinc-800 border-zinc-700"
              />
              <div className="flex gap-3">
                <Button variant="outline" icon={<Download className="w-5 h-5" />} onClick={exportarExcel}>
                  Excel
                </Button>
                <Button variant="outline" icon={<Download className="w-5 h-5" />} onClick={exportarPDF}>
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 p-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
                <Input
                  placeholder="Buscar título, responsável..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-12 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500"
                />
              </div>
              <Select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos status' },
                  { value: 'aberta', label: 'Aberta' },
                  { value: 'em-progresso', label: 'Em progresso' },
                  { value: 'concluida', label: 'Concluída' },
                  { value: 'bloqueada', label: 'Bloqueada' },
                ]}
                className="w-48 bg-zinc-800 border-zinc-700"
              />
              <Select
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                options={responsaveisUnicos.map(r => ({ value: r, label: r }))}
                className="w-56 bg-zinc-800 border-zinc-700"
              />
              <Select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                options={prioridadesUnicas.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
                className="w-48 bg-zinc-800 border-zinc-700"
              />
            </div>
          </Card>

          {/* Cards KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[
              { title: 'Total Demandas', value: stats.totalDemandas, color: 'text-white' },
              { title: 'Concluídas', value: stats.demandasConcluidas, color: 'text-emerald-400' },
              { title: 'Taxa %', value: `${stats.taxaConclusao}%`, color: 'text-sky-400' },
              { title: 'Média Dias', value: `${stats.mediaTempoConclusaoDias.toFixed(1)}`, color: 'text-indigo-400' },
              { title: 'Bloqueadas', value: stats.demandasBloqueadas, color: 'text-orange-400' },
              { title: 'Atrasadas', value: stats.demandasAtrasadas, color: 'text-red-400' },
            ].map((item, i) => (
              <Card
                key={i}
                className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-zinc-600 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <p className="text-sm text-zinc-400 mb-1">{item.title}</p>
                <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              </Card>
            ))}
          </div>

          {/* Sprint */}
          {periodo === 'sprint' && stats.sprintInicio && (
            <Card className="bg-gradient-to-br from-indigo-950 to-purple-950 border-indigo-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8" /> Sprint Atual
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700">
                  <p className="text-indigo-300 text-sm mb-2">Início</p>
                  <p className="text-2xl font-bold text-white">{stats.sprintInicio}</p>
                </div>
                <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700">
                  <p className="text-indigo-300 text-sm mb-2">Fim</p>
                  <p className="text-2xl font-bold text-white">{stats.sprintFim}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card
              title="Evolução e Atrasos"
              description="Concluídas vs Atrasadas"
              className="bg-zinc-900/80 border-zinc-800"
            >
              <div className="h-80 pt-6">
                <Bar
                  ref={barChartRef}
                  data={{
                    ...barMultiData,
                    datasets: barMultiData.datasets.map((dataset) => ({
                      ...dataset,
                      borderRadius: 8,
                      borderSkipped: false,
                      barThickness: 28,
                      hoverBorderWidth: 2,
                    })),
                  }}
                  options={{
                    ...cartesianOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    animation: {
                      duration: 1200,
                      easing: 'easeOutQuart',
                    },
                    plugins: {
                      ...cartesianOptions?.plugins,
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#d4d4d8',
                          font: {
                            size: 14,
                            weight: 600 as any,
                          },
                          padding: 20,
                          boxWidth: 18,
                          boxHeight: 18,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                      tooltip: {
                        backgroundColor: '#18181b',
                        borderColor: '#3f3f46',
                        borderWidth: 1,
                        padding: 14,
                        cornerRadius: 10,
                        titleColor: '#f4f4f5',
                        titleFont: {
                          weight: 700 as any,
                          size: 14,
                        },
                        bodyColor: '#d4d4d8',
                        bodyFont: {
                          size: 13,
                        },
                        displayColors: true,
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: '#a1a1aa',
                          font: {
                            size: 13,
                            weight: 500 as any,
                          },
                        },
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255,255,255,0.06)',
                          // drawBorder: false // deprecated,
                        },
                        ticks: {
                          color: '#a1a1aa',
                          padding: 8,
                          font: {
                            size: 13,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card>

            <Card
              title="Distribuição por Status"
              description="Situação atual"
              className="bg-zinc-900/80 border-zinc-800"
            >
              <div className="h-[28rem] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={130}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: any) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      animationDuration={1200}
                      animationBegin={300}
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>

                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
                      itemStyle={{ color: '#d1d5db' }}
                    />

                    <RechartsLegend
                      verticalAlign="bottom"
                      height={50}
                      formatter={(value) => (
                        <span className="text-zinc-300 text-base font-medium">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Produtividade por Dev" description="Concluídas vs Atribuídas" className="lg:col-span-2 bg-zinc-900/80 border-zinc-800">
              <div className="h-[380px] pt-6 px-4">
                <Radar
                  ref={radarChartRef}
                  data={radarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "nearest", intersect: false },
                    animation: { duration: 1200, easing: "easeOutQuart" },
                    plugins: {
                      legend: {
                        position: "top",
                        align: "center",
                        labels: { color: "#e4e4e7", font: { size: 14, weight: 600 as any }, padding: 20, usePointStyle: true, pointStyle: "circle", boxWidth: 10, boxHeight: 10 }
                      },
                      tooltip: {
                        backgroundColor: "#18181b",
                        borderColor: "#3f3f46",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 10,
                        titleColor: "#f4f4f5",
                        bodyColor: "#d4d4d8",
                        titleFont: { weight: 700 as any }
                      }
                    },
                    scales: {
                      r: {
                        angleLines: { color: "rgba(255,255,255,0.12)" },
                        grid: { color: "rgba(255,255,255,0.08)" },
                        pointLabels: { color: "#d4d4d8", font: { size: 14, weight: 500 as any } },
                        ticks: { display: false, backdropColor: "transparent" }
                      }
                    },
                    elements: {
                      line: { borderWidth: 3 },
                      point: { radius: 4, hoverRadius: 6, borderWidth: 2 }
                    }
                  }}
                />
              </div>
            </Card>

            <Card title="Evolução Temporal" description="Tendência de conclusões" className="lg:col-span-2 bg-zinc-900/80 border-zinc-800">
              <div className="h-80 pt-6 px-4">
                <Line
                  ref={lineChartRef}
                  data={lineData}
                  options={{
                    ...cartesianOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    animation: { duration: 1200, easing: "easeOutQuart" },

                    plugins: {
                      ...cartesianOptions?.plugins,
                      legend: {
                        position: "top",
                        labels: {
                          color: "#d4d4d8",
                          font: { size: 14, weight: 600 as any },
                          padding: 18,
                          usePointStyle: true,
                          pointStyle: "circle"
                        }
                      },
                      tooltip: {
                        backgroundColor: "#18181b",
                        borderColor: "#3f3f46",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 10,
                        titleColor: "#f4f4f5",
                        bodyColor: "#d4d4d8",
                        titleFont: { weight: 700 as any }
                      }
                    },

                    elements: {
                      line: {
                        borderWidth: 3,
                        tension: 0.4
                      },
                      point: {
                        radius: 4,
                        hoverRadius: 7,
                        borderWidth: 2
                      }
                    },

                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: "#a1a1aa", font: { size: 13, weight: 500 as any } }
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.06)" },
                        ticks: { color: "#a1a1aa", padding: 8 }
                      }
                    }
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Top Performers */}
          <Card
            title="Top Performers"
            description="Melhores desempenhos"
            className="bg-gradient-to-br from-emerald-950/40 to-zinc-950 border-emerald-900/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-6">
              {stats.topUsuarios.map((user, idx) => {
                const performance =
                  user.totalAtribuidas > 0
                    ? Math.round((user.concluidas / user.totalAtribuidas) * 100)
                    : 0;

                return (
                  <div
                    key={user.nome}
                    className="group bg-zinc-900/70 backdrop-blur-sm p-5 rounded-xl border border-zinc-800 hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-900/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100">{user.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {user.totalAtribuidas} atribuídas
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {user.concluidas}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                        style={{ width: `${performance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Performance</span>
                      <span className="text-emerald-400 font-semibold">
                        {performance}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tabela de detalhes */}
          <Card title="Detalhes das Demandas" description="Lista filtrável e completa" className="bg-zinc-900/80 border-zinc-800">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
                  <Input
                    placeholder="Buscar título, responsável..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="pl-12 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500"
                  />
                </div>
                <Select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  options={[
                    { value: 'todos', label: 'Todos status' },
                    { value: 'aberta', label: 'Aberta' },
                    { value: 'em-progresso', label: 'Em progresso' },
                    { value: 'concluida', label: 'Concluída' },
                    { value: 'bloqueada', label: 'Bloqueada' },
                  ]}
                  className="w-48"
                />
                <Select
                  value={filtroResponsavel}
                  onChange={e => setFiltroResponsavel(e.target.value)}
                  options={responsaveisUnicos.map(r => ({ value: r, label: r }))}
                  className="w-56"
                />
                <Select
                  value={filtroPrioridade}
                  onChange={e => setFiltroPrioridade(e.target.value)}
                  options={prioridadesUnicas.map(p => ({ value: p, label: p }))}
                  className="w-48"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead className="bg-zinc-900/90 sticky top-0">
                    <tr>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-24">ID</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Título</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-40">Criado por</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-40">Responsável</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-32">Status</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-32">Prioridade</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-36">Criado</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300 w-36">Prazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {demandasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 italic text-lg">
                          Nenhuma demanda encontrada
                        </td>
                      </tr>
                    ) : (
                      demandasFiltradas.map(d => (
                        <tr key={d.id} className="hover:bg-zinc-800/60 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap font-medium text-zinc-400">
                            {d.id?.slice(0,8) || '—'}
                          </td>
                          <td className="px-6 py-5">
                            {getTitulo(d)}
                          </td>
                          <td className="px-6 py-5">
                            {d.createdBy || '—'}
                          </td>
                          <td className="px-6 py-5">
                            {getResponsavel(d)}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              d.status === 'concluida' ? 'bg-emerald-900/50 text-emerald-300' :
                              d.status === 'bloqueada' ? 'bg-red-900/50 text-red-300' :
                              d.status === 'em-progresso' ? 'bg-amber-900/50 text-amber-300' :
                              'bg-zinc-700/50 text-zinc-300'
                            }`}>
                              {d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              String(getPrioridade(d)).toLowerCase().includes('alta') || 
                              String(getPrioridade(d)).toLowerCase().includes('urgente') 
                                ? 'bg-red-900/50 text-red-300' :
                              String(getPrioridade(d)).toLowerCase().includes('média') || 
                              String(getPrioridade(d)).toLowerCase().includes('media') 
                                ? 'bg-amber-900/50 text-amber-300' :
                              String(getPrioridade(d)).toLowerCase().includes('baixa') 
                                ? 'bg-emerald-900/50 text-emerald-300' :
                              'bg-zinc-700/50 text-zinc-300'
                            }`}>
                              {getPrioridade(d)}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-zinc-400">
                            {d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-zinc-400">
                            {(() => {
                              const prazoRaw = getPrazoRaw(d);
                              if (!prazoRaw) return 'Sem prazo';
                              const parsed = parseDueDate(prazoRaw);
                              if (!parsed || isNaN(parsed.getTime())) {
                                return String(prazoRaw).slice(0, 16) || '—';
                              }
                              return format(parsed, 'dd/MM/yyyy HH:mm');
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}