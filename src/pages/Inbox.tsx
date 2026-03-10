// pages/Inbox.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import {
  Bell,
  BellRing,
  CheckCircle,
  AlertCircle,
  Check,
  Trash2,
  Search,
  Eye,
  X,
  Undo2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import clsx from 'clsx';

type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'system';

interface AppNotification {
  id: string;
  demandaId?: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

type FilterType =
  | 'all'
  | 'unread'
  | 'read'          // ← novo filtro
  | 'atrasadas'
  | 'proximas'
  | 'concluidas'
  | 'demanda'
  | 'dashboard'
  | 'configuracoes'
  | 'sistema';

export default function Inbox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    demandas,
    notifications,
    addNotification,
    updateNotification,
    deleteNotification,
    clearNotifications,
    isLoading,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(20);

  // Permissão push
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendDeviceNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/image/splash.png' });
    }
  };

  // Geração de notificações (mantida como estava na sua última versão)
  useEffect(() => {
    const syncNotifications = async () => {
      const now = new Date();
      const hasNotificationOfType = new Map<string, Set<NotificationType>>();

      notifications.forEach((n) => {
        if (n.demandaId) {
          if (!hasNotificationOfType.has(n.demandaId)) {
            hasNotificationOfType.set(n.demandaId, new Set());
          }
          hasNotificationOfType.get(n.demandaId)!.add(n.type);
        }
      });

      const newNotifications: Omit<AppNotification, 'id'>[] = [];

      for (const d of demandas) {
        if (!d.prazo) continue;
        const prazo = new Date(d.prazo);
        const diffDays = (prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const existingTypes = hasNotificationOfType.get(d.id) || new Set();

        if (d.status === 'concluida') {
          if (!existingTypes.has('success')) {
            newNotifications.push({
              demandaId: d.id,
              type: 'success',
              title: 'Demanda concluída',
              message: `${d.title} foi finalizada com sucesso.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        } else if (diffDays > 0 && diffDays <= 2) {
          if (!existingTypes.has('warning')) {
            newNotifications.push({
              demandaId: d.id,
              type: 'warning',
              title: 'Prazo próximo',
              message: `${d.title} vence em ${Math.ceil(diffDays)} dias.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        } else if (diffDays <= 0) {
          if (!existingTypes.has('error')) {
            newNotifications.push({
              demandaId: d.id,
              type: 'error',
              title: 'Demanda atrasada',
              message: `${d.title} está atrasada há ${Math.abs(Math.floor(diffDays))} dias.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      }

      for (const notif of newNotifications) {
        await addNotification(notif);
        toast(notif.title, { icon: '🔔' });
        sendDeviceNotification(notif.title, notif.message);
      }
    };

    syncNotifications();
    const interval = setInterval(syncNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [demandas, notifications, addNotification]);

  // Processamento das notificações + novo filtro "read"
  const processedNotifications = useMemo(() => {
    let list = [...notifications];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((n) =>
        n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term)
      );
    }

    switch (filter) {
      case 'unread':
        list = list.filter((n) => !n.read);
        break;
      case 'read':                // ← novo filtro
        list = list.filter((n) => n.read);
        break;
      case 'atrasadas':
        list = list.filter((n) => n.type === 'error');
        break;
      case 'proximas':
        list = list.filter((n) => n.type === 'warning');
        break;
      case 'concluidas':
        list = list.filter((n) => n.type === 'success');
        break;
      case 'demanda':
        list = list.filter((n) => !!n.demandaId && n.type !== 'success');
        break;
      case 'dashboard':
        list = list.filter((n) => n.type === 'info' && n.message.toLowerCase().includes('dashboard'));
        break;
      case 'configuracoes':
        list = list.filter((n) => n.type === 'info' && n.message.toLowerCase().includes('configura'));
        break;
      case 'sistema':
        list = list.filter((n) => n.type === 'system' || (!n.demandaId && n.type === 'info'));
        break;
      default:
        // 'all'
        break;
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [notifications, filter, searchTerm]);

  const displayed = processedNotifications.slice(0, visibleCount);
  const hasMore = visibleCount < processedNotifications.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const markSelectedAsRead = async () => {
    for (const id of selectedIds) {
      const n = notifications.find((x) => x.id === id);
      if (n && !n.read) await updateNotification(id, { read: true });
    }
    toast.success('Selecionadas marcadas como lidas');
    cancelSelectMode();
  };

  const markSelectedAsUnread = async () => {
    for (const id of selectedIds) {
      const n = notifications.find((x) => x.id === id);
      if (n && n.read) await updateNotification(id, { read: false });
    }
    toast.success('Selecionadas marcadas como não lidas');
    cancelSelectMode();
  };

  const deleteSelected = async () => {
    if (!confirm(`Excluir ${selectedIds.size} notificação(ões)?`)) return;
    for (const id of selectedIds) await deleteNotification(id);
    toast.success('Selecionadas excluídas');
    cancelSelectMode();
  };

  const toggleRead = async (notif: AppNotification) => {
    await updateNotification(notif.id, { read: !notif.read });
    toast.success(notif.read ? 'Marcada como não lida' : 'Marcada como lida');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-opacity-70" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-16 sm:pt-20 lg:pl-64 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-7xl pb-16 sm:pb-24">

          {/* Cabeçalho responsivo */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6 mb-8 sm:mb-12">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-indigo-500/20 shadow-lg shadow-indigo-950/30">
                <BellRing className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-300 bg-clip-text text-transparent">
                  Central de Notificações
                </h1>
                <p className="text-zinc-400 mt-1 text-sm sm:text-base font-medium">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
              {unreadCount > 0 && (
                <Button variant="outline" size="md" className="text-sm sm:text-base border-indigo-500/40 hover:border-indigo-400 flex-1 sm:flex-none">
                  <Check className="w-4 h-4 mr-2" />
                  Marcar todas
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={clearNotifications}
                  className="text-sm sm:text-base border-red-500/30 hover:border-red-400 text-red-300 hover:text-red-200 flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar tudo
                </Button>
              )}
            </div>
          </header>

          <Card className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black/40 rounded-2xl sm:rounded-3xl overflow-hidden">

            {/* Barra superior – busca + selecionar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-zinc-800/70">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-12 bg-zinc-950/60 border-zinc-700 focus:border-indigo-500/70 focus:ring-indigo-500/30 rounded-xl text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-0">
                <Button
                  variant={selectMode ? 'solid' : 'outline'}
                  size="md"
                  onClick={() => {
                    setSelectMode(!selectMode);
                    if (selectMode) setSelectedIds(new Set());
                  }}
                  className={clsx(
                    "w-full sm:w-auto min-w-[120px] sm:min-w-[140px] text-sm sm:text-base",
                    selectMode && "bg-indigo-600 hover:bg-indigo-500 border-none"
                  )}
                >
                  {selectMode ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </>
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              </div>
            </div>

            {/* Tabs com rolagem horizontal obrigatória */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
              <div className="flex gap-2 px-5 sm:px-6 py-4 border-b border-zinc-800/50 min-w-max">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'unread', label: 'Não lidas' },
                  { id: 'read', label: 'Lidas' },                  // ← novo filtro
                  { id: 'atrasadas', label: 'Atrasadas' },
                  { id: 'proximas', label: 'Próximos prazos' },
                  { id: 'concluidas', label: 'Concluídas' },
                  { id: 'demanda', label: 'Demandas' },
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'configuracoes', label: 'Configurações' },
                  { id: 'sistema', label: 'Sistema' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id as FilterType)}
                    className={clsx(
                      "px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                      filter === item.id
                        ? "bg-gradient-to-r from-indigo-600/80 to-indigo-500/80 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/30"
                        : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/70 border border-zinc-700/50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="p-4 sm:p-6 space-y-4 min-h-[50vh]">
              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-zinc-500">
                  <Bell className="w-16 h-16 sm:w-20 sm:h-20 mb-6 opacity-40" strokeWidth={1.2} />
                  <p className="text-lg sm:text-xl font-medium">Nenhuma notificação encontrada</p>
                  {searchTerm && <p className="mt-3 text-xs sm:text-sm">Tente ajustar os termos de busca</p>}
                </div>
              ) : (
                displayed.map((notif) => {
                  const isSelected = selectedIds.has(notif.id);
                  const typeStyles = {
                    success: 'bg-green-950/30 border-green-800/40 text-green-300',
                    warning: 'bg-amber-950/30 border-amber-800/40 text-amber-300',
                    error:   'bg-red-950/30 border-red-800/40 text-red-300',
                    info:    'bg-blue-950/30 border-blue-800/40 text-blue-300',
                    system:  'bg-purple-950/30 border-purple-800/40 text-purple-300',
                  }[notif.type] || 'bg-zinc-800/50 border-zinc-700/70 text-zinc-300';

                  return (
                    <div
                      key={notif.id}
                      className={clsx(
                        "group relative flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-200 backdrop-blur-sm text-sm sm:text-base",
                        notif.read ? "bg-zinc-900/40 border-zinc-800/60" : "bg-zinc-800/50 border-zinc-700/70",
                        isSelected && "border-indigo-500/70 bg-indigo-950/20 ring-1 ring-indigo-500/40",
                        selectMode && "hover:bg-zinc-800/70",
                        "hover:shadow-xl hover:shadow-black/30"
                      )}
                    >
                      {selectMode && (
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(notif.id)}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-zinc-600 checked:bg-indigo-600 checked:border-indigo-500 focus:ring-indigo-500/50 bg-zinc-900/80"
                          />
                        </div>
                      )}

                      <div className={clsx("flex-shrink-0 p-2.5 sm:p-3 rounded-lg sm:rounded-xl", typeStyles.split(' ')[0])}>
                        {notif.type === 'success' && <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />}
                        {notif.type === 'warning' && <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />}
                        {notif.type === 'error'   && <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />}
                        {notif.type === 'info'    && <Bell className="w-6 h-6 sm:w-7 sm:h-7" />}
                        {notif.type === 'system'  && <Settings className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={clsx(
                          "font-semibold leading-tight",
                          !notif.read ? "text-white" : "text-zinc-300",
                          "text-base sm:text-lg"
                        )}>
                          {notif.title}
                        </h3>
                        <p className="mt-1.5 sm:mt-2 text-zinc-300/90 line-clamp-2 text-sm sm:text-base">
                          {notif.message}
                        </p>
                        <time className="mt-2 sm:mt-3 block text-xs text-zinc-500">
                          {new Date(notif.createdAt).toLocaleString('pt-BR', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </time>
                      </div>

                      <div className={clsx(
                        "flex flex-col gap-2 sm:gap-3 items-end opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        selectMode && "opacity-70 group-hover:opacity-70",
                        "text-xs sm:text-sm"
                      )}>
                        {notif.demandaId && (
                          <button
                            onClick={() => navigate(`/demandas/${notif.demandaId}`)}
                            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            <Eye size={14} className="sm:size-4" /> Ver demanda
                          </button>
                        )}

                        <button
                          onClick={() => toggleRead(notif)}
                          className={clsx(
                            "flex items-center gap-1.5 font-medium",
                            notif.read ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"
                          )}
                        >
                          {notif.read ? (
                            <>
                              <Undo2 size={14} /> Desmarcar leitura
                            </>
                          ) : (
                            'Marcar como lida'
                          )}
                        </button>

                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {hasMore && (
                <div className="flex justify-center py-8 sm:py-10">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setVisibleCount((c) => c + 20)}
                    className="px-8 sm:px-10 border-zinc-700 hover:border-zinc-500 text-sm sm:text-base"
                  >
                    Carregar mais
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Barra flutuante de ações em massa - ajustada para mobile */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-1/2 right-4 sm:right-auto sm:-translate-x-1/2 z-50 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/60 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-center gap-4 sm:gap-6">
          <span className="text-zinc-300 font-medium text-sm sm:text-base">
            {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
          </span>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
            <Button
              variant="solid"
              size="sm"
              onClick={markSelectedAsRead}
              className="bg-emerald-600 hover:bg-emerald-500 border-none flex-1 sm:flex-none min-w-[110px] sm:min-w-[140px] text-xs sm:text-sm"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Lidas
            </Button>

            <Button
              variant="solid"
              size="sm"
              onClick={markSelectedAsUnread}
              className="bg-amber-600 hover:bg-amber-500 border-none flex-1 sm:flex-none min-w-[110px] sm:min-w-[140px] text-xs sm:text-sm"
            >
              <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Não lidas
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelected}
              className="border-red-600/70 text-red-300 hover:bg-red-950/40 flex-1 sm:flex-none min-w-[110px] sm:min-w-[140px] text-xs sm:text-sm"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}