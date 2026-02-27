import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getAll, addItem, updateItem } from '../db/indexedDB';

type AppNotification = {
  id: string;
  demandaId?: number;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function Inbox() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // 🔥 GERA NOTIFICAÇÕES BASEADO NAS DEMANDAS
  useEffect(() => {
    const syncNotifications = async () => {
      const demandas = await getAll<any>('demandas');
      const existing = await getAll<AppNotification>('notifications');

      const now = new Date();
      const newNotifications: AppNotification[] = [];

      demandas.forEach((d: any) => {
        if (!d.prazo) return;

        const prazo = new Date(d.prazo);
        const diffDays =
          (prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        const alreadyExists = existing.some(
          (n) => n.demandaId === d.id
        );

        if (alreadyExists) return;

        if (d.status === 'concluida') {
          newNotifications.push({
            id: crypto.randomUUID(),
            demandaId: d.id,
            type: 'success',
            title: 'Demanda concluída',
            message: `${d.title} foi finalizada.`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        } else if (diffDays > 0 && diffDays <= 2) {
          newNotifications.push({
            id: crypto.randomUUID(),
            demandaId: d.id,
            type: 'warning',
            title: 'Prazo próximo',
            message: `${d.title} vence em breve.`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        } else if (diffDays < 0) {
          newNotifications.push({
            id: crypto.randomUUID(),
            demandaId: d.id,
            type: 'error',
            title: 'Demanda atrasada',
            message: `${d.title} está atrasada.`,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      });

      for (const notif of newNotifications) {
        await addItem('notifications', notif);
      }

      const updatedList = await getAll<AppNotification>('notifications');

      setNotifications(
        updatedList.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
    };

    syncNotifications();
  }, []);

  // 🔥 FILTROS
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread')
      return notifications.filter((n) => !n.read);

    if (filter === 'critical')
      return notifications.filter((n) => n.type === 'error');

    return notifications;
  }, [notifications, filter]);

  // 🔥 MARCAR COMO LIDA
  const markAsRead = async (notif: AppNotification) => {
    const updatedNotif = {
      ...notif,
      read: true,
    };

    await updateItem('notifications', updatedNotif);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? updatedNotif : n
      )
    );
  };

  // 🔥 MARCAR TODAS COMO LIDAS
  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({
      ...n,
      read: true,
    }));

    for (const notif of updated) {
      await updateItem('notifications', notif);
    }

    setNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">
              {t('inbox')}
            </h1>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <Card
          title="Notificações"
          description={`${unreadCount} não lidas`}
        >
          {/* FILTROS */}
          <div className="flex gap-3 mb-6">
            {['all', 'unread', 'critical'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === f
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {f === 'all'
                  ? 'Todas'
                  : f === 'unread'
                  ? 'Não lidas'
                  : 'Críticas'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  notif.read
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                {notif.type === 'success' && (
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                )}
                {notif.type === 'warning' && (
                  <AlertCircle className="w-6 h-6 text-yellow-500 mt-1" />
                )}
                {notif.type === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                )}

                <div className="flex-1">
                  <h3 className="font-medium text-zinc-100">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {notif.message}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <p className="text-center text-zinc-500 py-8">
                Nenhuma notificação
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}