import { useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  BarChart3,
  Clock,
  ListTodo,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

// Função cn inline (clsx + tailwind-merge simulada simples)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Badge inline (adaptado do shadcn-ui, premium com mais variantes e hover)
const Badge = ({ 
  children, 
  variant = "default", 
  className = '', 
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; 
  className?: string; 
}) => {
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105";

  const variants = {
    default: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30",
    secondary: "bg-zinc-700/50 text-zinc-300 border-zinc-600/50 hover:bg-zinc-700/70",
    destructive: "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30",
    outline: "bg-transparent text-zinc-300 border-zinc-500/50 hover:border-zinc-300",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
  };

  return (
    <span 
      className={cn(base, variants[variant], className)} 
      {...props}
    >
      {children}
    </span>
  );
};

// Skeleton inline (com animação pulse premium)
const Skeleton = ({ className = '', ...props }: { className?: string }) => (
  <div 
    className={cn("animate-pulse rounded-xl bg-zinc-800/40 shadow-inner", className)} 
    {...props} 
  />
);

// Tooltip inline (para elementos, adaptado simples do shadcn com Radix-like)
import * as React from 'react';
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute z-50 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg shadow-lg border border-zinc-700 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full animate-fade-in">
          {content}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-8 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
};

// Cores premium para gráficos (gradientes e animações)
const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

// Interface expandida para Demanda (adicionando mais campos para premium)
interface Demanda {
  id: string;
  title: string;
  description?: string;
  status: 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada' | 'pendente';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente' | 'critica';
  prazo?: string;
  createdAt: string;
  assignee?: string; // Para mostrar responsável
  progress?: number; // 0-100 para barras de progresso
  tags?: string[]; // Para badges extras
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { demandas, isLoading, user } = useAppStore(); // Adicionei user para personalização

  const now = useMemo(() => new Date(), []);

  const metrics = useMemo(() => {
    if (!demandas?.length) return { total: 0, aberta: 0, emProgresso: 0, concluida: 0, atrasadas: 0, pendente: 0, bloqueada: 0 };

    const aberta = demandas.filter(d => d.status === 'aberta').length;
    const emProgresso = demandas.filter(d => d.status === 'em-progresso').length;
    const concluida = demandas.filter(d => d.status === 'concluida').length;
    const pendente = demandas.filter(d => d.status === 'pendente').length;
    const bloqueada = demandas.filter(d => d.status === 'bloqueada').length;
    const atrasadas = demandas.filter(
      d => d.prazo && new Date(d.prazo) < now && d.status !== 'concluida'
    ).length;

    return { total: demandas.length, aberta, emProgresso, concluida, atrasadas, pendente, bloqueada };
  }, [demandas, now]);

  const statusData = useMemo(() => [
    { name: t('aberta'), value: metrics.aberta, color: COLORS[0] },
    { name: t('emProgresso'), value: metrics.emProgresso, color: COLORS[1] },
    { name: t('concluida'), value: metrics.concluida, color: COLORS[2] },
    { name: t('pendente'), value: metrics.pendente, color: COLORS[3] },
    { name: t('bloqueada'), value: metrics.bloqueada, color: COLORS[4] },
    { name: t('atrasadas'), value: metrics.atrasadas, color: COLORS[5] },
  ].filter(d => d.value > 0), [metrics, t]);

  const recentDemandas = useMemo(() => {
    return [...(demandas || [])]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6); // Mais itens para premium
  }, [demandas]);

  const upcomingDeadlines = useMemo(() => {
    return [...(demandas || [])]
      .filter(d => d.prazo && new Date(d.prazo) > now && d.status !== 'concluida')
      .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
      .slice(0, 6);
  }, [demandas, now]);

  const getPrioridadeColor = (pri?: string) => {
    switch (pri) {
      case 'critica': return 'bg-purple-600/30 text-purple-300 border-purple-600/40 hover:bg-purple-600/40';
      case 'urgente': return 'bg-red-600/30 text-red-300 border-red-600/40 hover:bg-red-600/40';
      case 'alta':    return 'bg-orange-600/30 text-orange-300 border-orange-600/40 hover:bg-orange-600/40';
      case 'media':   return 'bg-yellow-600/30 text-yellow-300 border-yellow-600/40 hover:bg-yellow-600/40';
      default:        return 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50 hover:bg-zinc-700/70';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'concluida': return 'success';
      case 'em-progresso': return 'info';
      case 'bloqueada': return 'destructive';
      case 'pendente': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto space-y-10 pb-12">
          <Skeleton className="h-12 w-72 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal aqui: pt-20 para header fixo + lg:pl-64 para compensar sidebar fixa no desktop */}
      <div 
        className={`
          pt-20 
          lg:pl-64 
          px-4 sm:px-6 lg:px-8 
          transition-all duration-300
        `}
      >
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
          {/* Cabeçalho premium com saudação personalizada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
              {t('dashboard')}, {user?.name || 'Pedro'}!
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-300">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span>{metrics.concluida} {t('concluidasEstaSemana')}</span>
              <span className="hidden sm:inline">|</span>
              <span>{now.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Métricas principais com tooltips e gradientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <Tooltip content={t('totalDemandasDesc')}>
              <Card className="bg-gradient-to-br from-indigo-900/30 to-zinc-950 border-indigo-800/50 hover:border-indigo-600/70 transition-all duration-300 group shadow-lg hover:shadow-indigo-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-indigo-300">{t('totalDemandas')}</p>
                    <ListTodo className="h-6 w-6 text-indigo-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-4xl font-bold mt-2 text-white">{metrics.total}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('emProgressoDesc')}>
              <Card className="bg-gradient-to-br from-emerald-900/30 to-zinc-950 border-emerald-800/50 hover:border-emerald-600/70 transition-all duration-300 group shadow-lg hover:shadow-emerald-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-emerald-300">{t('emProgresso')}</p>
                    <Clock className="h-6 w-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-4xl font-bold mt-2 text-white">{metrics.emProgresso}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('concluidasDesc')}>
              <Card className="bg-gradient-to-br from-blue-900/30 to-zinc-950 border-blue-800/50 hover:border-blue-600/70 transition-all duration-300 group shadow-lg hover:shadow-blue-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-blue-300">{t('concluidas')}</p>
                    <BarChart3 className="h-6 w-6 text-blue-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-4xl font-bold mt-2 text-white">{metrics.concluida}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('atrasadasDesc')}>
              <Card className={cn(
                "bg-gradient-to-br from-red-900/30 to-zinc-950 border-red-800/50 transition-all duration-300 group shadow-lg",
                metrics.atrasadas > 0 ? "hover:border-red-600/70 hover:shadow-red-500/20" : "hover:border-zinc-600/70"
              )}>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-red-300">{t('atrasadas')}</p>
                    <AlertTriangle className={cn(
                      "h-6 w-6 group-hover:rotate-12 transition-transform",
                      metrics.atrasadas > 0 ? "text-red-400" : "text-zinc-400"
                    )} />
                  </div>
                  <p className={cn(
                    "text-4xl font-bold mt-2",
                    metrics.atrasadas > 0 ? "text-red-300" : "text-white"
                  )}>
                    {metrics.atrasadas}
                  </p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('bloqueadasDesc')}>
              <Card className="bg-gradient-to-br from-amber-900/30 to-zinc-950 border-amber-800/50 hover:border-amber-600/70 transition-all duration-300 group shadow-lg hover:shadow-amber-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-amber-300">{t('bloqueadas')}</p>
                    <AlertTriangle className="h-6 w-6 text-amber-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-4xl font-bold mt-2 text-white">{metrics.bloqueada}</p>
                </div>
              </Card>
            </Tooltip>
          </div>

          {/* Gráficos premium com legendas e tooltips custom */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição de Status com animação */}
            <Card title={t('distribuicaoStatus')} description={t('visaoGeralStatuses')} className="h-[28rem] shadow-xl border-zinc-800">
              <div className="h-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      animationDuration={800}
                      animationBegin={0}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}
                      labelStyle={{ color: '#d4d4d8' }}
                      itemStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Progresso por Status com barras animadas */}
            <Card title={t('progressoDemandas')} description={t('evolucaoSemanal')} className="h-[28rem] shadow-xl border-zinc-800">
              <div className="h-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>} />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]} 
                      animationDuration={1200}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Seções de listas com busca rápida e filtros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demandas Recentes com tags e progress bar */}
            <Card
              title={t('demandasRecentes')}
              description={t('ultimas6Demandas')}
              className="shadow-xl border-zinc-800"
            >
              <div className="space-y-4 mt-6 p-4">
                {recentDemandas.length === 0 ? (
                  <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 text-center text-zinc-400 italic">
                    {t('nenhumaDemandaRecente')} Crie uma nova para começar!
                  </div>
                ) : (
                  recentDemandas.map((d) => (
                    <Link
                      key={d.id}
                      to={`/demandas/${d.id}`}
                      className="block p-5 bg-zinc-900/50 hover:bg-zinc-800/70 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 group shadow-md hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors truncate">
                            {d.title || 'Sem título'}
                          </p>
                          <ArrowUpRight className="h-5 w-5 text-zinc-500 group-hover:text-blue-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant={getStatusVariant(d.status)}>
                            {t(d.status)}
                          </Badge>
                          {d.prioridade && (
                            <Badge className={getPrioridadeColor(d.prioridade)}>
                              {d.prioridade.toUpperCase()}
                            </Badge>
                          )}
                          {d.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {d.progress !== undefined && (
                          <div className="w-full bg-zinc-800 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${d.progress}%` }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>{d.assignee ? `Atribuído a: ${d.assignee}` : 'Sem responsável'}</span>
                          <span>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Próximos Prazos com countdown e prioridade visual */}
            <Card
              title={t('proximosPrazos')}
              description={t('vencemEmBreve')}
              className="shadow-xl border-zinc-800"
            >
              <div className="space-y-4 mt-6 p-4">
                {upcomingDeadlines.length === 0 ? (
                  <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 text-center text-zinc-400 italic">
                    {t('nenhumPrazoProximo')} Ótimo trabalho!
                  </div>
                ) : (
                  upcomingDeadlines.map((d) => {
                    const daysLeft = Math.ceil(
                      (new Date(d.prazo!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const urgencyColor = daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-zinc-300';

                    return (
                      <Link
                        key={d.id}
                        to={`/demandas/${d.id}`}
                        className="block p-5 bg-zinc-900/50 hover:bg-zinc-800/70 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 group shadow-md hover:shadow-lg"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors truncate">
                              {d.title || 'Sem título'}
                            </p>
                            <ArrowUpRight className="h-5 w-5 text-zinc-500 group-hover:text-blue-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-zinc-400" />
                            <span className={cn("font-medium", urgencyColor)}>
                              {daysLeft} {daysLeft === 1 ? t('diaRestante') : t('diasRestantes')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={getStatusVariant(d.status)}>
                              {t(d.status)}
                            </Badge>
                            {d.prioridade && (
                              <Badge className={getPrioridadeColor(d.prioridade)}>
                                {d.prioridade.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            Vence em: {new Date(d.prazo!).toLocaleDateString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}