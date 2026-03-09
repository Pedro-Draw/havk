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
  Filter,
  Users,
  Clock,
  TrendingUp,
  Trophy,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import 'chart.js/auto';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';

// Registrar Chart.js
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
  topUsuarios: Array<{ nome: string; concluidas: number; totalAtribuidas: number }>;
  periodoInicio: string;
  periodoFim: string;
  sprintInicio?: string;
  sprintFim?: string;
  produtividadePorDev: Array<{ nome: string; concluidas: number; total: number; mediaDias: number }>;
}

const CORES_STATUS = {
  aberta: '#3b82f6',
  'em-progresso': '#f59e0b',
  concluida: '#10b981',
  bloqueada: '#ef4444',
  atrasada: '#f97316',
  default: '#6b7280',
};

const CORES_PRIORIDADE = {
  baixa: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#b91c1c',
};

const parseDueDate = (dueDate: string | undefined | null): Date | null => {
  if (!dueDate) return null;
  const str = String(dueDate).trim();

  let dt = new Date(str);
  if (!isNaN(dt.getTime())) return dt;

  const parsedBR = parse(str, 'dd/MM/yyyy', new Date());
  if (!isNaN(parsedBR.getTime())) return parsedBR;

  const parsedBRFull = parse(str, 'dd/MM/yyyy HH:mm', new Date());
  if (!isNaN(parsedBRFull.getTime())) return parsedBRFull;

  const parsedISO = parse(str, 'yyyy-MM-dd', new Date());
  if (!isNaN(parsedISO.getTime())) return parsedISO;

  return null;
};

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
            d.sprintInicio && isWithinInterval(new Date(d.sprintInicio), { start: dataInicio, end: new Date(sprintAtual.sprintFim) })
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
        if (!d?.dueDate || d?.status === 'concluida') return false;
        const prazo = parseDueDate(d.dueDate);
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
        const resp = d?.assignee || 'Sem responsável';
        acc[resp] = (acc[resp] || 0) + 1;
        return acc;
      }, {});

      const totalPorUsuario = demandasFiltradas.reduce<Record<string, number>>((acc, d) => {
        const resp = d?.assignee || 'Sem responsável';
        acc[resp] = (acc[resp] || 0) + 1;
        return acc;
      }, {});

      const topUsuarios = Object.entries(porUsuarioRaw)
        .map(([nome, concluidas]) => ({
          nome,
          concluidas,
          totalAtribuidas: totalPorUsuario[nome] || concluidas,
        }))
        .sort((a, b) => b.concluidas - a.concluidas)
        .slice(0, 5);

      const produtividadePorDev = Object.entries(totalPorUsuario)
        .map(([nome, total]) => {
          const concluidasDev = porUsuarioRaw[nome] || 0;
          const concluidasDevList = concluidas.filter(d => d?.assignee === nome);
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

export default function Relatorios() {
  const { t } = useTranslation();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState('todos');
  const reportRef = useRef<HTMLDivElement>(null);

  const { stats, demandasFiltradasBase, loading, error } = useRelatoriosData(periodo);

  const demandasFiltradas = useMemo(() => {
    let lista = demandasFiltradasBase;

    if (filtroTexto) {
      const texto = filtroTexto.toLowerCase();
      lista = lista.filter(d =>
        (d.titulo || '').toLowerCase().includes(texto) ||
        (d.assignee || '').toLowerCase().includes(texto) ||
        (d.status || '').toLowerCase().includes(texto) ||
        (d.prioridade || '').toLowerCase().includes(texto)
      );
    }

    if (filtroStatus !== 'todos') {
      lista = lista.filter(d => d.status === filtroStatus);
    }

    if (filtroResponsavel !== 'todos') {
      lista = lista.filter(d => d.assignee === filtroResponsavel);
    }

    if (filtroPrioridade !== 'todos') {
      lista = lista.filter(d => d.prioridade === filtroPrioridade);
    }

    return lista;
  }, [demandasFiltradasBase, filtroTexto, filtroStatus, filtroResponsavel, filtroPrioridade]);

  const responsaveisUnicos = useMemo(() => {
    const set = new Set(demandasFiltradasBase.map(d => d.assignee || 'Sem responsável'));
    return ['todos', ...Array.from(set)];
  }, [demandasFiltradasBase]);

  const prioridadesUnicas = useMemo(() => {
    const set = new Set(demandasFiltradasBase.map(d => d.prioridade || 'Sem prioridade'));
    return ['todos', ...Array.from(set)];
  }, [demandasFiltradasBase]);

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
      ['ID', 'Título', 'Responsável', 'Status', 'Prioridade', 'Criado em', 'Prazo'],
      ...demandasFiltradas.map(d => [
        d.id,
        d.titulo || '',
        d.assignee || 'Sem responsável',
        d.status || 'Pendente',
        d.prioridade || 'Sem prioridade',
        d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm') : '',
        d.dueDate || 'Sem prazo',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalhesData), 'Detalhes');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `relatorio-havk-${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);

    toast.success('Excel profissional exportado!');
  };

  const exportarPDF = async () => {
    if (!reportRef.current) {
      toast.error('Área do relatório não encontrada');
      return;
    }

    const toastId = toast.loading('Gerando PDF profissional (aguarde renderização completa)...');

    try {
      // Delay maior para garantir que todos os gráficos e elementos estejam prontos
      await new Promise(resolve => setTimeout(resolve, 4000));

      const clone = reportRef.current.cloneNode(true) as HTMLElement;
      clone.style.background = 'linear-gradient(to bottom, #0f172a 0%, #020617 100%)';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.width = '1800px'; // mais largo para capturar tudo sem corte
      clone.style.padding = '120px 100px';
      clone.style.fontFamily = 'Helvetica, Arial, sans-serif';
      clone.style.color = '#e2e8f0';
      clone.style.boxSizing = 'border-box';
      document.body.appendChild(clone);

      // =============================
// CORREÇÃO REAL DOS GRÁFICOS
// =============================

// pega os canvas originais
const originalCanvas = reportRef.current.querySelectorAll('canvas');

// pega os canvas do clone
const cloneCanvas = clone.querySelectorAll('canvas');

originalCanvas.forEach((canvas, index) => {

  const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png', 1);

  const img = new Image();
  img.src = dataUrl;

  const parent = cloneCanvas[index]?.parentElement;

  if (parent) {

    parent.innerHTML = '';

    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';

    parent.appendChild(img);

  }

});

      // Delay extra após resize
      await new Promise(r => setTimeout(r, 1200));

      const canvas = await html2canvas(clone, {
        scale: 3.5, // qualidade altíssima
        useCORS: true,
        logging: false,
        backgroundColor: null,
        allowTaint: true,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header personalizado com degradê
      const headerGradient = pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 100, 'F');
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pageWidth, 90, 'F');

      // Logo Havk grande e centralizado
      const logoImg = new Image();
      logoImg.crossOrigin = 'Anonymous';
      logoImg.src = '/logo.png';

      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = () => {
          console.warn('Logo não carregou');
          resolve();
        };
      });

      const logoW = 70;
      const logoH = 70;
      pdf.addImage(logoImg, 'PNG', (pageWidth - logoW) / 2, 15, logoW, logoH, undefined, 'FAST');

      // Título principal
      pdf.setFontSize(32);
      pdf.setTextColor(226, 232, 240);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE DEMANDAS', pageWidth / 2, 120, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Havk Intelligence Systems', pageWidth / 2, 140, { align: 'center' });

      // Data e período
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 165, { align: 'center' });
      pdf.text(`Período analisado: ${stats.periodoInicio} – ${stats.periodoFim}`, pageWidth / 2, 180, { align: 'center' });

      // Linha divisória
      pdf.setLineWidth(1);
      pdf.setDrawColor(59, 130, 246);
      pdf.line(30, 195, pageWidth - 30, 195);

      // Conteúdo principal (captura completa do relatório)
      const contentRatio = Math.min((pageWidth - 40) / canvas.width, (pageHeight - 220) / canvas.height);
      const contentX = (pageWidth - canvas.width * contentRatio) / 2;
      pdf.addImage(imgData, 'PNG', contentX, 210, canvas.width * contentRatio, canvas.height * contentRatio, undefined, 'FAST');

      // Rodapé
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Havk Intelligence Systems | Relatório Confidencial | Página 1/1', pageWidth / 2, pageHeight - 15, { align: 'center' });

      pdf.save(`relatorio-havk-pro-${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);

      toast.dismiss(toastId);
      toast.success('PDF profissional gerado com sucesso! (logo grande, gráficos nítidos, layout moderno)');
    } catch (err) {
      console.error('Erro ao gerar PDF avançado:', err);
      toast.dismiss(toastId);
      toast.error('Erro ao gerar PDF completo. Gerando versão simplificada...');

      // Fallback mais bonito
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const logoImg = new Image();
      logoImg.src = '/logo.png';
      await new Promise(r => { logoImg.onload = r; });

      pdf.addImage(logoImg, 'PNG', 105 - 30, 15, 60, 60);

      pdf.setFontSize(26);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Relatório de Demandas - Havk', 105, 95, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 105, 110, { align: 'center' });
      pdf.text(`Período: ${stats.periodoInicio} – ${stats.periodoFim}`, 105, 122, { align: 'center' });

      let y = 150;
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text('Resumo Geral', 20, y); y += 12;

      pdf.setFontSize(12);
      pdf.text(`Total de Demandas: ${stats.totalDemandas}`, 25, y); y += 10;
      pdf.text(`Demandas Concluídas: ${stats.demandasConcluidas}`, 25, y); y += 10;
      pdf.text(`Demandas Bloqueadas: ${stats.demandasBloqueadas}`, 25, y); y += 10;
      pdf.text(`Demandas Atrasadas: ${stats.demandasAtrasadas}`, 25, y); y += 10;
      pdf.text(`Taxa de Conclusão: ${stats.taxaConclusao}%`, 25, y); y += 10;
      pdf.text(`Média de Tempo: ${stats.mediaTempoConclusaoDias.toFixed(1)} dias`, 25, y); y += 20;

      if (stats.topUsuarios.length > 0) {
        pdf.setFontSize(16);
        pdf.text('Top Performers', 20, y); y += 12;
        pdf.setFontSize(12);
        stats.topUsuarios.forEach((u, i) => {
          pdf.text(`${i + 1}. ${u.nome} — ${u.concluidas} concluídas (${u.totalAtribuidas} atribuídas)`, 25, y); y += 10;
        });
      }

      pdf.save(`relatorio-havk-fallback-${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
      toast.success('PDF simplificado gerado (com logo)');
    }
  };

  const opcoesPeriodo = [
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'tudo', label: 'Todo o histórico' },
    { value: 'sprint', label: 'Sprint Atual' },
  ];

  const barMultiData = {
    labels: stats.conclusoesPorMes.map(m => m.mes),
    datasets: [
      { label: 'Concluídas', data: stats.conclusoesPorMes.map(m => m.quantidade), backgroundColor: '#10b981' },
      { label: 'Atrasadas', data: stats.conclusoesPorMes.map(() => stats.demandasAtrasadas / stats.conclusoesPorMes.length || 0), backgroundColor: '#ef4444' },
    ],
  };

  const lineData = {
    labels: stats.conclusoesPorMes.map(m => m.mes),
    datasets: [{
      label: 'Evolução de Conclusões',
      data: stats.conclusoesPorMes.map(m => m.quantidade),
      borderColor: '#3b82f6',
      tension: 0.4,
      fill: false,
    }],
  };

  const doughnutData = {
    labels: stats.distribuicaoStatus.map(s => s.name),
    datasets: [{
      data: stats.distribuicaoStatus.map(s => s.value),
      backgroundColor: Object.values(CORES_STATUS),
      borderWidth: 2,
      borderColor: '#1e293b',
    }],
  };

  const radarData = {
    labels: stats.produtividadePorDev.map(d => d.nome),
    datasets: [
      {
        label: 'Concluídas',
        data: stats.produtividadePorDev.map(d => d.concluidas),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Atribuídas',
        data: stats.produtividadePorDev.map(d => d.total),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e2e8f0' } },
      title: { display: true, color: '#e2e8f0' },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-sky-400" />
          <p className="mt-6 text-xl text-zinc-300">Carregando relatório profissional...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="max-w-lg text-center bg-gradient-to-br from-red-950 to-zinc-950 border-red-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="mt-6 text-2xl font-bold text-white">Erro ao carregar relatório</h2>
          <p className="mt-4 text-zinc-300">{error}</p>
          <Button className="mt-8 bg-red-600 hover:bg-red-700" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div ref={reportRef} className="max-w-[1600px] mx-auto pb-20 space-y-10">
          {/* Logo e Cabeçalho */}
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
                  Exportar Excel
                </Button>
                <Button variant="outline" icon={<Download className="w-5 h-5" />} onClick={exportarPDF}>
                  Exportar PDF
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
                  { value: 'todos', label: 'Todos os status' },
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

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[
              { title: 'Total Demandas', value: stats.totalDemandas, color: 'text-white' },
              { title: 'Concluídas', value: stats.demandasConcluidas, color: 'text-emerald-400' },
              { title: 'Taxa Conclusão', value: `${stats.taxaConclusao}%`, color: 'text-sky-400' },
              { title: 'Média Tempo', value: `${stats.mediaTempoConclusaoDias.toFixed(1)} dias`, color: 'text-indigo-400' },
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
                <TrendingUp className="w-8 h-8" /> Relatório de Sprint Atual
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700">
                  <p className="text-indigo-300 text-sm mb-2">Início da Sprint</p>
                  <p className="text-2xl font-bold text-white">{stats.sprintInicio}</p>
                </div>
                <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700">
                  <p className="text-indigo-300 text-sm mb-2">Fim da Sprint</p>
                  <p className="text-2xl font-bold text-white">{stats.sprintFim}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Evolução e Atrasos" description="Concluídas vs Atrasadas por mês" className="bg-zinc-900/80 border-zinc-800">
              <div className="h-96 pt-6">
                <Bar data={barMultiData} options={chartOptions} />
              </div>
            </Card>

            <Card title="Distribuição de Status" description="Situação atual detalhada" className="bg-zinc-900/80 border-zinc-800">
              <div className="h-96 pt-6">
                <Doughnut data={doughnutData} options={chartOptions} />
              </div>
            </Card>

            <Card title="Produtividade por Desenvolvedor" description="Comparativo concluídas vs atribuídas" className="lg:col-span-2 bg-zinc-900/80 border-zinc-800">
              <div className="h-96 pt-6">
                <Radar data={radarData} options={{ ...chartOptions, scales: { r: { ticks: { color: '#94a3b8' } } } }} />
              </div>
            </Card>

            <Card title="Evolução Temporal" description="Tendência de conclusões" className="lg:col-span-2 bg-zinc-900/80 border-zinc-800">
              <div className="h-96 pt-6">
                <Line data={lineData} options={chartOptions} />
              </div>
            </Card>
          </div>

          {/* Top Performers */}
          <Card title="Top Performers" description="Desenvolvedores mais produtivos" className="bg-gradient-to-br from-emerald-950 to-zinc-950 border-emerald-800">
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.topUsuarios.map((user, idx) => (
                <div
                  key={user.nome}
                  className="p-6 bg-zinc-900/70 rounded-2xl border border-zinc-800 hover:border-emerald-700 transition-all shadow-lg hover:shadow-emerald-900/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-xl">{user.nome}</p>
                        <p className="text-zinc-400 text-sm">{user.totalAtribuidas} atribuídas</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">
                      {user.concluidas}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tabela */}
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
                <Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} options={[
                  { value: 'todos', label: 'Todos status' },
                  { value: 'aberta', label: 'Aberta' },
                  { value: 'em-progresso', label: 'Em progresso' },
                  { value: 'concluida', label: 'Concluída' },
                  { value: 'bloqueada', label: 'Bloqueada' },
                ]} className="w-48" />
                <Select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)} options={responsaveisUnicos.map(r => ({ value: r, label: r }))} className="w-56" />
                <Select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} options={prioridadesUnicas.map(p => ({ value: p, label: p }))} className="w-48" />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead className="bg-zinc-900/90 sticky top-0">
                    <tr>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">ID</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Título</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Responsável</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Status</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Prioridade</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Criado</th>
                      <th className="px-6 py-5 text-left font-medium text-zinc-300">Prazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {demandasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 italic text-lg">
                          Nenhuma demanda encontrada com os filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      demandasFiltradas.map(d => (
                        <tr key={d.id} className="hover:bg-zinc-800/60 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap font-medium">{d.id}</td>
                          <td className="px-6 py-5">{d.titulo || '—'}</td>
                          <td className="px-6 py-5">{d.assignee || 'Sem responsável'}</td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              d.status === 'concluida' ? 'bg-emerald-900/50 text-emerald-300' :
                              d.status === 'bloqueada' ? 'bg-red-900/50 text-red-300' :
                              d.status === 'em-progresso' ? 'bg-amber-900/50 text-amber-300' :
                              'bg-zinc-700/50 text-zinc-300'
                            }`}>
                              {d.status || 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              d.prioridade === 'alta' ? 'bg-red-900/50 text-red-300' :
                              d.prioridade === 'media' ? 'bg-amber-900/50 text-amber-300' :
                              d.prioridade === 'baixa' ? 'bg-emerald-900/50 text-emerald-300' :
                              'bg-zinc-700/50 text-zinc-300'
                            }`}>
                              {d.prioridade || 'Sem prioridade'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {d.dueDate ? (
                              (() => {
                                const prazo = parseDueDate(d.dueDate);
                                return prazo ? format(prazo, 'dd/MM/yyyy HH:mm') : d.dueDate;
                              })()
                            ) : 'Sem prazo'}
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