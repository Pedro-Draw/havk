import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  GanttChart,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  User,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { getAll } from '../db/indexedDB';
import {
  format,
  addDays,
  differenceInDays,
  startOfDay,
  isSameDay,
  isWeekend,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas'; // npm i html2canvas

type DemandaStatus = 'planned' | 'in_progress' | 'done' | 'blocked' | 'delayed';
type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, etc.

type Demanda = {
  id: number;
  title: string;
  prazo: string; // ISO
  prazoInicio?: string;
  progresso?: number; // 0-100
  status?: DemandaStatus;
  prioridade?: 'low' | 'medium' | 'high' | 'critical';
  parentId?: number; // para hierarquia
  recursos?: string[]; // usernames ou nomes
  dependencies?: { to: number; type: DependencyType; lag?: number }[]; // dependências
  baselineInicio?: string;
  baselineFim?: string;
};

const statusColors: Record<DemandaStatus, { bg: string; text: string }> = {
  planned: { bg: 'bg-blue-600/70', text: 'text-blue-300' },
  in_progress: { bg: 'bg-indigo-600/80', text: 'text-indigo-200' },
  done: { bg: 'bg-green-600/80', text: 'text-green-200' },
  blocked: { bg: 'bg-amber-600/80', text: 'text-amber-200' },
  delayed: { bg: 'bg-red-600/80', text: 'text-red-200' },
};

const prioridadeBorder: Record<string, string> = {
  low: 'border-l-4 border-l-gray-500',
  medium: 'border-l-4 border-l-blue-500',
  high: 'border-l-4 border-l-orange-500',
  critical: 'border-l-4 border-l-red-600',
};

export default function Gantt() {
  const { t } = useTranslation();
  const [demandasRaw, setDemandasRaw] = useState<Demanda[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]); // filtradas e ordenadas
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.5); // px por dia
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getAll<Demanda>('demandas');
      const filtered = data.filter((d) => d.prazo);
      setDemandasRaw(filtered);
      setLoading(false);
    };
    load();
  }, []);

  const normalize = (date?: string | Date) => startOfDay(date ? new Date(date) : new Date());

  const { tree, minDate, maxDate, totalUnits, unitLabel, scale } = useMemo(() => {
    let filtered = demandasRaw.filter(
      (d) => !search || d.title.toLowerCase().includes(search.toLowerCase())
    );

    // Build tree structure
    const map = new Map<number, Demanda & { children?: Demanda[] }>();
    const roots: typeof map extends Map<any, infer V> ? V[] : never[] = [];

    filtered.forEach((d) => map.set(d.id, { ...d }));
    filtered.forEach((d) => {
      const item = map.get(d.id)!;
      if (d.parentId && map.has(d.parentId)) {
        const parent = map.get(d.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    // Flatten for rendering + calculate expanded state
    const flat: (Demanda & { level: number; isParent: boolean })[] = [];
    const traverse = (items: typeof roots, level = 0) => {
      items.forEach((item) => {
        flat.push({ ...item, level, isParent: !!item.children?.length });
        if (item.children && expanded.has(item.id)) {
          traverse(item.children, level + 1);
        }
      });
    };
    traverse(roots);

    // Dates
    let min = new Date(Math.min(...flat.map((d) => normalize(d.prazoInicio || d.prazo).getTime())));
    let max = new Date(Math.max(...flat.map((d) => normalize(d.prazo).getTime())));

    min = addDays(min, -5);
    max = addDays(max, 10);

    let total = differenceInDays(max, min) + 1;
    let step = 1;
    let label = 'Dia';

    if (viewMode === 'week') {
      step = 7;
      total = Math.ceil(total / 7);
      label = 'Semana';
    } else if (viewMode === 'month') {
      const months = differenceInMonths(max, min) + 2;
      total = months;
      step = 30; // approx
      label = 'Mês';
    }

    return {
      tree: flat,
      minDate: min,
      maxDate: max,
      totalUnits: Math.max(30, total),
      unitLabel: label,
      scale: step,
    };
  }, [demandasRaw, search, viewMode, expanded]);

  const todayOffset = differenceInDays(new Date(), minDate);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = 'gantt-export.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const autoFit = () => {
    if (!gridRef.current) return;
    const w = gridRef.current.clientWidth - 260;
    setZoom(w / totalUnits / 1.2);
  };

  useEffect(() => {
    autoFit();
    window.addEventListener('resize', autoFit);
    return () => window.removeEventListener('resize', autoFit);
  }, [totalUnits, viewMode]);

  const handleScroll = () => {
    if (gridRef.current && headerRef.current) {
      headerRef.current.scrollLeft = gridRef.current.scrollLeft;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100">
      <div className="max-w-[98vw] mx-auto" ref={containerRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <GanttChart className="w-10 h-10 text-zinc-300" />
            <h1 className="text-3xl font-bold">{t('gantt.title', 'Gantt Avançado')}</h1>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar demanda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
            >
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>

            <button onClick={() => setZoom(z => z + 0.3)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><ZoomIn className="w-5 h-5" /></button>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.3))} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><ZoomOut className="w-5 h-5" /></button>
            <button onClick={autoFit} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><Maximize className="w-5 h-5" /></button>
            <button onClick={handleExportPNG} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium flex items-center gap-2">
              Export PNG
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-5 mb-6 text-sm">
          {Object.entries(statusColors).map(([key, { bg }]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${bg}`} />
              {key === 'planned' ? 'Planejado' : key === 'in_progress' ? 'Em andamento' : key === 'done' ? 'Concluído' : key === 'blocked' ? 'Bloqueado' : 'Atrasado'}
            </div>
          ))}
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-700/60 rounded" /> Caminho Crítico</div>
        </div>

        <Card className="overflow-hidden border border-zinc-800 bg-zinc-900">
          {/* Header */}
          <div ref={headerRef} className="overflow-x-hidden bg-zinc-950 border-b border-zinc-800 sticky top-0 z-20">
            {/* Meses / Semanas */}
            <div
              className="grid text-xs font-medium text-zinc-400"
              style={{ gridTemplateColumns: `260px repeat(${totalUnits}, minmax(${zoom * 1.2}px, 1fr))` }}
            >
              <div className="p-3 border-r border-zinc-800 bg-zinc-950 sticky left-0 z-10">Demanda / WBS</div>
              {Array.from({ length: totalUnits }).map((_, i) => {
                let date;
                if (viewMode === 'month') {
                  date = addMonths(minDate, i);
                  return (
                    <div key={i} className="p-2 text-center border-r border-zinc-800 last:border-r-0">
                      {format(date, 'MMM yyyy', { locale: ptBR })}
                    </div>
                  );
                }
                date = addDays(minDate, i * (viewMode === 'week' ? 7 : 1));
                return (
                  <div
                    key={i}
                    className={`p-1.5 text-center border-r border-zinc-800 last:border-r-0 ${isWeekend(date) ? 'bg-zinc-950/70' : ''} ${isSameDay(date, new Date()) ? 'bg-red-900/40 text-white font-bold' : ''}`}
                  >
                    {viewMode === 'week' ? `Sem ${format(date, 'w')}` : format(date, 'd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          <div
            ref={gridRef}
            className="overflow-auto max-h-[70vh] relative"
            onScroll={handleScroll}
          >
            <div style={{ minWidth: `${260 + totalUnits * zoom * 1.2}px`, height: `${demandas.length * 54}px` }}>
              <div
                className="grid relative"
                style={{ gridTemplateColumns: `260px repeat(${totalUnits}, minmax(${zoom * 1.2}px, 1fr))` }}
              >
                {demandas.map((task) => {
                  const start = normalize(task.prazoInicio || task.prazo);
                  const end = normalize(task.prazo);
                  const duration = Math.max(1, differenceInDays(end, start) + 1);
                  const offset = differenceInDays(start, minDate);

                  const left = offset * zoom * 1.2;
                  const width = duration * zoom * 1.2;

                  const isMilestone = isSameDay(start, end);
                  const status = task.status || 'planned';
                  const color = statusColors[status];
                  const isCritical = false; // TODO: calcular caminho crítico real

                  return (
                    <div
                      key={task.id}
                      className={`h-14 border-b border-zinc-800 group relative ${task.level > 0 ? 'pl-' + (task.level * 4) : ''}`}
                      style={{ gridColumn: '1 / -1' }}
                    >
                      {/* Coluna esquerda (título + controles) */}
                      <div className={`p-3 flex items-center gap-2 border-r border-zinc-800 bg-zinc-950/90 sticky left-0 z-10 ${prioridadeBorder[task.prioridade || 'medium']}`}>
                        {task.isParent && (
                          <button onClick={() => toggleExpand(task.id)}>
                            {expanded.has(task.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                        <span className="font-medium truncate flex-1">{task.title}</span>
                        {task.recursos?.map((r, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs" title={r}>
                            {r[0]?.toUpperCase()}
                          </div>
                        ))}
                      </div>

                      {/* Barra */}
                      <div
                        className={`absolute top-3 h-8 rounded shadow-lg flex items-center ${color.bg} ${isCritical ? 'ring-2 ring-red-500' : ''} group-hover:ring-2 group-hover:ring-white/30 transition-all`}
                        style={{ left: `${260 + left}px`, width: `${width}px`, minWidth: isMilestone ? '20px' : '40px' }}
                      >
                        {isMilestone ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rotate-45 shadow-lg" />
                          </div>
                        ) : (
                          task.progresso ? (
                            <div className="h-full bg-white/25 rounded-l" style={{ width: `${task.progresso}%` }} />
                          ) : null
                        )}
                      </div>

                      {/* Baseline (plano original) */}
                      {task.baselineInicio && task.baselineFim && (
                        <div
                          className="absolute top-1/2 h-1 bg-gray-500/70 rounded-full"
                          style={{
                            left: `${260 + differenceInDays(normalize(task.baselineInicio), minDate) * zoom * 1.2}px`,
                            width: `${Math.max(1, differenceInDays(normalize(task.baselineFim), normalize(task.baselineInicio)) + 1) * zoom * 1.2}px`,
                          }}
                        />
                      )}

                      {/* Dependências (setas simples) */}
                      {task.dependencies?.map((dep, idx) => {
                        const target = demandas.find(d => d.id === dep.to);
                        if (!target) return null;
                        // TODO: calcular posições reais e desenhar SVG arrow
                        return <div key={idx} className="absolute text-xs text-zinc-500">→ Dep {dep.type}</div>;
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-70 z-10 pointer-events-none"
                style={{ left: `${260 + todayOffset * zoom * 1.2}px` }}
              />

              {demandas.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
                  <AlertCircle className="w-16 h-16 opacity-50" />
                  <p className="text-lg">Nenhuma demanda encontrada</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}