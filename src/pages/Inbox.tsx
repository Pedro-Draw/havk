import { useTranslation } from '../i18n/useTranslation';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';

export default function Inbox() {
  const { t } = useTranslation();

  // Mock de notificações
  const notifications = [
    { id: 1, type: 'success', title: 'Demanda concluída', message: 'Tarefa X finalizada', time: 'há 2h' },
    { id: 2, type: 'warning', title: 'Prazo próximo', message: 'Demanda Y vence amanhã', time: 'há 5h' },
    { id: 3, type: 'error', title: 'Atrasada', message: 'Demanda Z está atrasada', time: 'há 1 dia' },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('inbox')}</h1>
        </div>

        <Card title="Notificações" description="Tudo que precisa da sua atenção">
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                {notif.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />}
                {notif.type === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />}
                {notif.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />}

                <div className="flex-1">
                  <h3 className="font-medium text-zinc-100">{notif.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-zinc-500 mt-2">{notif.time}</p>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="text-center text-zinc-500 py-8">Nenhuma notificação no momento</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}