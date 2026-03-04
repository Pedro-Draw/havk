// pages/Inbox.tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Bell, CheckCircle, AlertCircle, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

type NotificationType = 'success' | 'warning' | 'error';

interface AppNotification {
  id: string;
  demandaId?: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function Inbox() {
  const { t } = useTranslation();

  const {
    demandas,
    notifications,
    addNotification,
    updateNotification, // ← assumindo que você adicionou essa action no store
    isLoading,
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // GERA NOTIFICAÇÕES AUTOMÁTICAS BASEADO NAS DEMANDAS (ao montar + quando demandas mudam)
  useEffect(() => {
    const syncNotifications = async () => {
      const now = new Date();

      // Evita duplicatas: verifica se já existe notificação para essa demanda
      const existingByDemanda = new Map<string, AppNotification[]>();
      notifications.forEach((n) => {
        if (n.demandaId) {
          if (!existingByDemanda.has(n.demandaId)) existingByDemanda.set(n.demandaId, []);
          existingByDemanda.get(n.demandaId)!.push(n);
        }
      });

      const newNotifications: Omit<AppNotification, 'id'>[] = [];

      demandas.forEach((d) => {
        if (!d.prazo) return;

        const prazo = new Date(d.prazo);
        const diffDays = (prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        // Já existe alguma notificação para essa demanda?
        const hasExisting = existingByDemanda.has(d.id);

        // Só gera se não tiver nenhuma notificação associada ainda (ou você pode refinar para evitar repetição)
        if (hasExisting) return;

        if (d.status === 'concluida') {
          newNotifications.push({
            demandaId: d.id,
            type: 'success',
            title: 'Demanda concluída',
            message: `${d.title} foi finalizada com sucesso.`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        } else if (diffDays > 0 && diffDays <= 2) {
          newNotifications.push({
            demandaId: d.id,
            type: 'warning',
            title: 'Prazo próximo',
            message: `${d.title} vence em breve (${Math.ceil(diffDays)} dias).`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        } else if (diffDays < 0) {
          newNotifications.push({
            demandaId: d.id,
            type: 'error',
            title: 'Demanda atrasada',
            message: `${d.title} está atrasada há ${Math.abs(Math.floor(diffDays))} dias.`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      });

      // Adiciona as novas no store (já gera ID e salva no IndexedDB)
      for (const notif of newNotifications) {
        await addNotification(notif);
      }

      // O store já atualiza a lista automaticamente via Zustand
    };

    syncNotifications();

    // Atualiza a cada 5 minutos
    const interval = setInterval(syncNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [demandas, addNotification, notifications]);

  // FILTROS
  const filteredNotifications = useMemo(() => {
    let list = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filter === 'unread') {
      list = list.filter((n) => !n.read);
    }
    if (filter === 'critical') {
      list = list.filter((n) => n.type === 'error');
    }

    return list;
  }, [notifications, filter]);

  const markAsRead = async (notif: AppNotification) => {
    try {
      await updateNotification(notif.id, { read: true });
      toast.success('Marcada como lida');
    } catch (err) {
      toast.error('Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notif of notifications) {
        if (!notif.read) {
          await updateNotification(notif.id, { read: true });
        }
      }
      toast.success('Todas marcadas como lidas');
    } catch (err) {
      toast.error('Erro ao marcar todas');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-20">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <Bell className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t('inbox') || 'Inbox'}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">
                  {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={markAllAsRead}
                icon={<Check className="w-5 h-5" />}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <Card title="Notificações" className="border-zinc-800 shadow-2xl bg-zinc-900/70 rounded-2xl">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['all', 'unread', 'critical'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-6 py-3 rounded-xl text-base font-medium transition-all ${
                    filter === f
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {f === 'all'
                    ? 'Todas'
                    : f === 'unread'
                    ? 'Não lidas'
                    : 'Críticas / Atrasadas'}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="space-y-5">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <Bell className="w-16 h-16 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-medium mb-3">
                    Nenhuma notificação {filter !== 'all' ? 'nesta categoria' : 'ainda'}
                  </p>
                  <p className="text-lg">
                    {filter === 'unread'
                      ? 'Você está em dia!'
                      : filter === 'critical'
                      ? 'Nenhuma demanda crítica ou atrasada no momento'
                      : 'Novas notificações aparecerão aqui automaticamente'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`
                      flex items-start gap-5 p-6 rounded-2xl border transition-all duration-200
                      ${notif.read
                        ? 'bg-zinc-900/70 border-zinc-800'
                        : 'bg-zinc-800/90 border-zinc-700 shadow-md'}
                      hover:border-zinc-600
                    `}
                  >
                    {notif.type === 'success' && (
                      <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                    )}
                    {notif.type === 'warning' && (
                      <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
                    )}
                    {notif.type === 'error' && (
                      <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-zinc-100 mb-2">
                        {notif.title}
                      </h3>
                      <p className="text-base text-zinc-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-sm text-zinc-500 mt-3">
                        {new Date(notif.createdAt).toLocaleString('pt-BR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium mt-1"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}