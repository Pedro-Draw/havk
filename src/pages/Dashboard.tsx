import { lazy, Suspense, useMemo, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Clock,
  ListTodo,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  CheckCircle,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

const StatusCharts = lazy(() => import('../components/dashboard/StatusCharts'));

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
    default: 'border-[var(--border)] bg-[var(--hover)] text-[var(--text)]',
    success: 'border-[var(--border)] bg-[var(--hover)] text-[var(--text)]',
    warning: 'border-[var(--border)] bg-[var(--hover)] text-[var(--text)]',
    destructive: 'border-[var(--border)] bg-[var(--hover)] text-[var(--text)]',
    info: 'border-[var(--border)] bg-[var(--hover)] text-[var(--text)]',
    outline: 'border-[var(--border)] bg-transparent text-[var(--text-secondary)]',
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
      default:        return 'border-[var(--border)] bg-[var(--hover)] text-[var(--text-secondary)]';
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
      <div className="page-shell">
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
    <div className="page-shell">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          w-full min-w-0 px-3 py-3 sm:px-6 sm:py-8 lg:px-8
        `}
      >
        <div className="mx-auto max-w-7xl space-y-4 pb-12 sm:space-y-10">
          <section className="studio-hero">
            <p className="studio-kicker">Hoje</p>
            <h1>{user?.name?.split(' ')[0] || 'Havk'}</h1>
            <p>{metrics.total} demandas · {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="studio-stats">
              <div><strong>{metrics.atrasadas}</strong><span>Atrasadas</span></div>
              <div><strong>{metrics.emProgresso}</strong><span>Em andamento</span></div>
              <div><strong>{metrics.concluida}</strong><span>Concluídas</span></div>
              <div><strong>{metrics.bloqueada}</strong><span>Atenção</span></div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            {[
              { title: 'Atrasadas', items: demandas.filter((item) => item.prazo && new Date(item.prazo) < now && item.status !== 'concluida').slice(0, 4) },
              { title: 'Prioritárias', items: demandas.filter((item) => (item.priority === 'alta' || item.priority === 'urgente') && item.status !== 'concluida').slice(0, 4) },
              { title: 'Em andamento', items: demandas.filter((item) => item.status === 'em-progresso').slice(0, 4) },
            ].map((section) => (
              <Card key={section.title} title={section.title}>
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

          <div className="home-metrics grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
            <Tooltip content={t('totalDemandasDesc') || 'Total de demandas criadas no sistema'}>
              <Card>
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{t('totalDemandas')}</p>
                    <ListTodo className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <p className="text-3xl font-semibold text-[var(--text)]">{metrics.total}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('emProgressoDesc') || 'Demandas atualmente em execução'}>
              <Card>
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{t('emProgresso')}</p>
                    <Clock className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-3xl font-semibold text-[var(--text)]">{metrics.emProgresso}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('concluidasDesc') || 'Demandas finalizadas com sucesso'}>
              <Card>
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{t('concluidas')}</p>
                    <CheckCircle className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-3xl font-semibold text-[var(--text)]">{metrics.concluida}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('atrasadasDesc') || 'Demandas fora do prazo'}>
              <Card>
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{t('atrasadas')}</p>
                    <AlertTriangle className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-3xl font-semibold text-[var(--text)]">{metrics.atrasadas}</p>
                </div>
              </Card>
            </Tooltip>

            <Tooltip content={t('bloqueadasDesc') || 'Demandas bloqueadas por dependências ou impedimentos'}>
              <Card className="col-span-2 lg:col-span-1">
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{t('bloqueadas')}</p>
                    <AlertTriangle className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-3xl font-semibold text-[var(--text)]">{metrics.bloqueada}</p>
                </div>
              </Card>
            </Tooltip>
          </div>

          {!compact && (
            <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Carregando gráficos…</p>}>
              <StatusCharts statusData={statusData} />
            </Suspense>
          )}

          <div className="home-lists grid grid-cols-1 gap-4 lg:grid-cols-2">
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