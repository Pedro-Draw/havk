import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  BarChart3,
  Clock,
  ListTodo,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  User,
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
import { cn } from '../lib/utils'; // assumindo que você tem essa função de classNames

// Badge premium (reutilizável)
const Badge = ({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
  className?: string;
}) => {
  const variants = {
    default: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
    destructive: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
    outline: 'bg-transparent text-zinc-300 border-zinc-600/50 hover:border-zinc-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs md:text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// Tooltip premium (hover elegante)
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute z-50 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900/95 rounded-xl shadow-2xl border border-zinc-700 -top-10 left-1/2 transform -translate-x-1/2 -translate-y-full animate-fade-in pointer-events-none">
          {content}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-8 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
};

// Skeleton premium com pulse suave
const Skeleton = ({ className = '', ...props }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-xl bg-zinc-800/40 shadow-inner', className)} {...props} />
);

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { demandas, user, isLoading, loadAll } = useAppStore();

  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  );

  useEffect(() => {
    loadAll(); // Carrega todas as entidades do IndexedDB no mount
  }, [loadAll]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const now = useMemo(() => new Date(), []);

  const metrics = useMemo(() => {
    if (!demandas?.length) return { total: 0, aberta: 0, emProgresso: 0, concluida: 0, atrasadas: 0, pendente: 0, bloqueada: 0 };

    const aberta = demandas.filter(d => d.status === 'aberta').length;
    const emProgresso = demandas.filter(d => d.status === 'em-progresso').length;
    const concluida = demandas.filter(d => d.status === 'concluida').length;
    const pendente = 0; // status 'pendente' não existe no tipo Demanda
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
    return [...demandas]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [demandas]);

  const upcomingDeadlines = useMemo(() => {
    return [...demandas]
      .filter(d => d.prazo && new Date(d.prazo) > now && d.status !== 'concluida')
      .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
      .slice(0, 6);
  }, [demandas, now]);

  const getPrioridadeColor = (pri?: string) => {
    switch (pri?.toLowerCase()) {
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
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className={`w-full min-w-0 px-3 py-3 sm:px-6 sm:py-8 lg:px-8`}>
          <div className="max-w-7xl mx-auto space-y-10 pb-12">
            <Skeleton className="h-14 w-80 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-[28rem] rounded-2xl" />
              <Skeleton className="h-[28rem] rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          w-full min-w-0 px-3 py-3 sm:px-6 sm:py-8 lg:px-8
        `}
      >
        <div className="mx-auto max-w-7xl space-y-4 pb-12 sm:space-y-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <div className="shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-3 shadow-lg sm:p-4">
                <BarChart3 className="h-6 w-6 text-indigo-400 sm:h-10 sm:w-10" />
              </div>
              <div className="min-w-0">
                <h1 className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                  {t('dashboard')}, {user?.name?.split(' ')[0] || 'Bem-vindo'}!
                </h1>
                <p className="mt-1 text-sm text-zinc-400 sm:mt-2 sm:text-lg">
                  {t('bemVindoMensagem') || 'Aqui está o panorama completo da sua operação'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 sm:px-5">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span>{metrics.concluida} {t('concluidasEstaSemana') || 'concluídas esta semana'}</span>
              <span className="hidden sm:inline">•</span>
              <span>{now.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <section className="grid gap-3 lg:grid-cols-3">
            {[
              { title: 'Atrasadas', items: demandas.filter((item) => item.prazo && new Date(item.prazo) < now && item.status !== 'concluida').slice(0, 4) },
              { title: 'Prioritárias', items: demandas.filter((item) => (item.priority === 'alta' || item.priority === 'urgente') && item.status !== 'concluida').slice(0, 4) },
              { title: 'Em andamento', items: demandas.filter((item) => item.status === 'em-progresso').slice(0, 4) },
            ].map((section) => (
              <Card key={section.title} title={section.title} description="Meu dia">
                {section.items.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Nada por aqui agora.</p>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <Link key={item.id} to={`/demandas/${item.id}`} className="block rounded-xl border px-3 py-2 text-sm hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                        {item.title || 'Sem título'}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </section>

          {/* Métricas principais - 5 cards premium */}
          <div className="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-5">
            <Tooltip content={t('totalDemandasDesc') || 'Total de demandas criadas no sistema'}>
              <Card className="bg-gradient-to-br from-indigo-950/50 to-zinc-950 border-indigo-900/40 hover:border-indigo-700/60 transition-all duration-300 group shadow-xl hover:shadow-indigo-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold sm:text-lg text-indigo-300">{t('totalDemandas')}</p>
                    <ListTodo className="h-5 w-5 sm:h-7 sm:w-7 text-indigo-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-3xl font-extrabold text-white sm:text-5xl">{metrics.total}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('emProgressoDesc') || 'Demandas atualmente em execução'}>
              <Card className="bg-gradient-to-br from-emerald-950/50 to-zinc-950 border-emerald-900/40 hover:border-emerald-700/60 transition-all duration-300 group shadow-xl hover:shadow-emerald-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold sm:text-lg text-emerald-300">{t('emProgresso')}</p>
                    <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-3xl font-extrabold text-white sm:text-5xl">{metrics.emProgresso}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('concluidasDesc') || 'Demandas finalizadas com sucesso'}>
              <Card className="bg-gradient-to-br from-blue-950/50 to-zinc-950 border-blue-900/40 hover:border-blue-700/60 transition-all duration-300 group shadow-xl hover:shadow-blue-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold sm:text-lg text-blue-300">{t('concluidas')}</p>
                    <CheckCircle className="h-5 w-5 sm:h-7 sm:w-7 text-blue-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-3xl font-extrabold text-white sm:text-5xl">{metrics.concluida}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('atrasadasDesc') || 'Demandas fora do prazo'}>
              <Card className={cn(
                'bg-gradient-to-br from-red-950/50 to-zinc-950 border-red-900/40 transition-all duration-300 group shadow-xl',
                metrics.atrasadas > 0 ? 'hover:border-red-700/60 hover:shadow-red-500/20' : 'hover:border-zinc-700/60'
              )}>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold sm:text-lg text-red-300">{t('atrasadas')}</p>
                    <AlertTriangle className={cn(
                      'h-5 w-5 sm:h-7 sm:w-7 group-hover:rotate-12 transition-transform',
                      metrics.atrasadas > 0 ? 'text-red-400' : 'text-zinc-400'
                    )} />
                  </div>
                  <p className={cn(
                    'mt-2 text-3xl font-extrabold sm:text-5xl',
                    metrics.atrasadas > 0 ? 'text-red-300' : 'text-white'
                  )}>
                    {metrics.atrasadas}
                  </p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('bloqueadasDesc') || 'Demandas bloqueadas por dependências ou impedimentos'}>
              <Card className="col-span-2 bg-gradient-to-br from-amber-950/50 to-zinc-950 border-amber-900/40 hover:border-amber-700/60 transition-all duration-300 group shadow-xl hover:shadow-amber-500/20 lg:col-span-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold sm:text-lg text-amber-300">{t('bloqueadas')}</p>
                    <AlertTriangle className="h-5 w-5 sm:h-7 sm:w-7 text-amber-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-3xl font-extrabold text-white sm:text-5xl">{metrics.bloqueada}</p>
                </div>
              </Card>
            </Tooltip>
          </div>

          {/* Gráficos premium */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pizza de status */}
            <Card title={t('distribuicaoStatus')} description={t('visaoGeralStatuses')} className="shadow-2xl border-zinc-800">
              <div className="h-64 p-1 sm:h-[28rem] sm:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={compact ? 42 : 80}
                      outerRadius={compact ? 68 : 130}
                      paddingAngle={4}
                      dataKey="value"
                      label={compact ? false : ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      animationDuration={1200}
                      animationBegin={300}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={3} />
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
                    <Legend
                      verticalAlign="bottom"
                      height={50}
                      formatter={(value) => <span className="text-zinc-300 text-base font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Barras de progresso */}
            <Card title={t('progressoDemandas')} description={t('evolucaoPorStatus')} className="shadow-2xl border-zinc-800">
              <div className="h-64 p-1 sm:h-[28rem] sm:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: compact ? 8 : 20, right: compact ? 8 : 30, left: 0, bottom: compact ? 8 : 20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: compact ? 10 : 13 }} interval={0} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: compact ? 10 : 13 }} width={compact ? 28 : 40} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        padding: '12px 16px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={50} formatter={(value) => <span className="text-zinc-300 text-base">{value}</span>} />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
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

          {/* Listas premium */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Demandas Recentes */}
            <Card title={t('demandasRecentes')} description={t('ultimasDemandasCriadas')} className="shadow-2xl border-zinc-800">
              <div className="space-y-4 mt-6">
                {recentDemandas.length === 0 ? (
                  <div className="p-10 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 text-center text-zinc-400 italic text-lg">
                    {t('nenhumaDemandaRecente')} Crie uma nova para começar!
                  </div>
                ) : (
                  recentDemandas.map((d) => (
                    <Link
                      key={d.id}
                      to={`/demandas/${d.id}`}
                      className="block p-6 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 group shadow-md hover:shadow-xl"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="line-clamp-2 flex-1 text-base font-semibold text-white transition-colors group-hover:text-indigo-300 sm:text-xl">
                            {d.title || 'Sem título'}
                          </p>
                          <ArrowUpRight className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Badge variant={getStatusVariant(d.status)}>
                            {t(d.status)}
                          </Badge>
                          {d.priority && (
                            <Badge className={getPrioridadeColor(d.priority)}>
                              {d.priority.toUpperCase()}
                            </Badge>
                          )}
                          {d.assignee && (
                            <Badge variant="outline" className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5" />
                              {d.assignee}
                            </Badge>
                          )}
                        </div>

                        {d.prazo && (
                          <div className="flex items-center gap-3 text-sm text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Prazo: {new Date(d.prazo).toLocaleDateString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Próximos Prazos */}
            <Card title={t('proximosPrazos')} description={t('vencemEmBreve')} className="shadow-2xl border-zinc-800">
              <div className="space-y-4 mt-6">
                {upcomingDeadlines.length === 0 ? (
                  <div className="p-10 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 text-center text-zinc-400 italic text-lg">
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
                        className="block p-6 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 group shadow-md hover:shadow-xl"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="line-clamp-2 flex-1 text-base font-semibold text-white transition-colors group-hover:text-indigo-300 sm:text-xl">
                              {d.title || 'Sem título'}
                            </p>
                            <ArrowUpRight className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                          </div>

                          <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <span className={cn('font-medium text-lg', urgencyColor)}>
                              {daysLeft} {daysLeft === 1 ? t('diaRestante') : t('diasRestantes')}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Badge variant={getStatusVariant(d.status)}>
                              {t(d.status)}
                            </Badge>
                            {d.priority && (
                              <Badge className={getPrioridadeColor(d.priority)}>
                                {d.priority.toUpperCase()}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-zinc-400">
                            Vence em: {new Date(d.prazo!).toLocaleDateString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
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