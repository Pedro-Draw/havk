// pages/Calendario.tsx
import { useTranslation } from '../i18n/useTranslation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { fromDateInputValue, toDateInputValue } from '../lib/kanban';
import toast from 'react-hot-toast';
import { confirmAction } from '../lib/confirm';

type CalendarView = 'mes' | 'semana' | 'dia' | 'agenda';

type EventType = 'demanda' | 'objetivo';

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  description?: string;
  date: string;          // ISO string (prazo ou deadline)
  priority?: string;
  status?: string;
  completed?: boolean;
}

function EventRow({ event, onDelete, compact = false }: { event: CalendarEvent; onDelete: () => void; compact?: boolean }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{event.type === 'demanda' ? 'Demanda' : 'Objetivo'} · {event.title}</p>
        {!compact && event.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{event.description}</p>}
      </div>
      <button type="button" className="touch-target shrink-0 text-red-400" aria-label="Excluir" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function Calendario() {
  const { t } = useTranslation();
  const {
    demandas,
    objetivos,
    addDemanda,
    addObjetivo,
    deleteDemanda,
    deleteObjetivo,
    isLoading,
  } = useAppStore();

  const today = new Date();
  const [view, setView] = useState<CalendarView>(() =>
    window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'mes'
  );
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'demanda' as EventType,
    title: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const selectedDate = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay)
    : null;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  /* ===============================
     Todos os eventos do mês (demandas + objetivos)
  =============================== */
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Demandas com prazo
    demandas.forEach(d => {
      if (d.prazo) {
        events.push({
          id: d.id,
          type: 'demanda',
          title: d.title,
          description: d.description,
          date: d.prazo,
          priority: d.priority,
          status: d.status,
        });
      }
      // Opcional: se quiser mostrar também prazoInicio como evento separado
    });

    // Objetivos com deadline
    objetivos.forEach(o => {
      if (o.deadline) {
        events.push({
          id: o.id,
          type: 'objetivo',
          title: o.title,
          description: undefined,
          date: o.deadline,
          priority: undefined,
          status: o.completed ? 'concluido' : 'pendente',
          completed: o.completed,
        });
      }
    });

    return events;
  }, [demandas, objetivos]);

  const eventKey = (value: string) => toDateInputValue(value);

  const eventsByDay = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};

    allEvents.forEach((event) => {
      const [year, month, day] = eventKey(event.date).split('-').map(Number);
      if (month - 1 === currentMonth && year === currentYear) {
        map[day] = (map[day] || 0) + 1;
      }
    });

    return map;
  }, [allEvents, currentMonth, currentYear]);

  const selectedEvents = useMemo<CalendarEvent[]>(() => {
    if (!selectedDay) return [];
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return allEvents.filter((event) => eventKey(event.date) === key);
  }, [selectedDay, allEvents, currentMonth, currentYear]);

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    const weekday = start.getDay();
    start.setDate(start.getDate() + (weekday === 0 ? -6 : 1 - weekday));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const agendaDays = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    allEvents.forEach((event) => {
      const key = eventKey(event.date);
      if (!key) return;
      groups.set(key, [...(groups.get(key) || []), event]);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [allEvents]);

  /* ===============================
     Criar novo evento
  =============================== */
  const handleCreate = async () => {
    if (!selectedDate || !form.title.trim()) {
      toast.error('Título e data são obrigatórios');
      return;
    }

    try {
      if (form.type === 'demanda') {
        await addDemanda({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          status: 'aberta',
          prazo: fromDateInputValue(toDateInputValue(selectedDate.toISOString())),
          // prazoInicio: selectedDate.toISOString(), // opcional
        });
        toast.success('Demanda criada no calendário');
      } else if (form.type === 'objetivo') {
        await addObjetivo({
          title: form.title.trim(),
          completed: false,
          deadline: fromDateInputValue(toDateInputValue(selectedDate.toISOString())),
        });
        toast.success('Objetivo criado no calendário');
      }

      setIsModalOpen(false);
      setForm({ type: 'demanda', title: '', description: '', priority: 'media' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar evento');
    }
  };

  const removeEvent = async (event: CalendarEvent) => {
    const accepted = await confirmAction({
      title: 'Excluir este item?',
      message: `"${event.title}" será removido desta empresa.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (!accepted) return;
    if (event.type === 'demanda') await deleteDemanda(event.id);
    else await deleteObjetivo(event.id);
  };

  const shiftCursor = (days: number) => {
    setCursor((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      setCurrentMonth(next.getMonth());
      setCurrentYear(next.getFullYear());
      setSelectedDay(next.getDate());
      return next;
    });
  };

  const openDay = (date: Date) => {
    setCursor(date);
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
    setSelectedDay(date.getDate());
    setView('dia');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="w-full min-w-0 px-3 py-3 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl pb-16">
          {/* Modal Novo Evento */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex bg-black/70 sm:items-center sm:justify-center sm:p-4">
              <div className="flex h-[100dvh] w-full flex-col space-y-5 overflow-y-auto border border-zinc-800 bg-zinc-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Novo Evento neste dia</h2>
                  <X
                    className="cursor-pointer text-zinc-400 hover:text-white"
                    size={24}
                    onClick={() => setIsModalOpen(false)}
                  />
                </div>

                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                >
                  <option value="demanda">Demanda</option>
                  <option value="objetivo">Objetivo</option>
                </select>

                <input
                  placeholder="Título do evento *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                />

                <textarea
                  placeholder="Descrição (opcional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none min-h-[80px] resize-y"
                />

                {form.type === 'demanda' && (
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                )}

                <div className="sticky bottom-0 flex justify-end gap-3 bg-zinc-900 pt-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!form.title.trim()}
                  >
                    Criar Evento
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Calendário Principal */}
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6 text-indigo-400 sm:h-8 sm:w-8" />
                  <h1 className="text-2xl font-bold sm:text-3xl">{t('calendario') || 'Calendário'}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['agenda', 'dia', 'semana', 'mes'] as CalendarView[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`touch-target rounded-xl px-3 text-sm capitalize ${view === item ? 'glass-button glass-button-primary' : 'glass-button glass-button-secondary'}`}
                      onClick={() => setView(item)}
                    >
                      {item === 'mes' ? 'Mês' : item}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => (view === 'mes' ? prevMonth() : shiftCursor(view === 'semana' ? -7 : -1))}
                    className="glass-icon"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-medium min-w-[140px] text-center">
                    {new Date(currentYear, currentMonth).toLocaleString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => (view === 'mes' ? nextMonth() : shiftCursor(view === 'semana' ? 7 : 1))}
                    className="glass-icon"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {view === 'agenda' && (
                <div className="space-y-4">
                  {agendaDays.length === 0 ? (
                    <Card className="p-8 text-center text-zinc-400">Nenhum prazo ou objetivo com data.</Card>
                  ) : agendaDays.map(([day, events]) => (
                    <section key={day}>
                      <button type="button" className="mb-2 text-sm font-semibold text-indigo-300" onClick={() => openDay(new Date(`${day}T12:00:00`))}>
                        {day.split('-').reverse().join('/')}
                      </button>
                      <div className="space-y-2">
                        {events.map((event) => (
                          <EventRow key={`${event.type}-${event.id}`} event={event} onDelete={() => removeEvent(event)} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {view === 'semana' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                  {weekDays.map((date) => {
                    const key = toDateInputValue(date.toISOString());
                    const events = allEvents.filter((event) => eventKey(event.date) === key);
                    return (
                      <Card key={key} className="min-h-28 border-zinc-800 p-3">
                        <button type="button" className="mb-2 text-sm font-semibold" onClick={() => openDay(date)}>
                          {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                        </button>
                        <div className="space-y-2">
                          {events.map((event) => (
                            <EventRow key={`${event.type}-${event.id}`} event={event} onDelete={() => removeEvent(event)} compact />
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {view === 'dia' && (
                <Card className="border-zinc-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{cursor.toLocaleDateString('pt-BR')}</h2>
                    <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Novo</Button>
                  </div>
                  {selectedEvents.length === 0 ? (
                    <p className="py-8 text-center text-zinc-500">Nada neste dia.</p>
                  ) : selectedEvents.map((event) => (
                    <EventRow key={`${event.type}-${event.id}`} event={event} onDelete={() => removeEvent(event)} />
                  ))}
                </Card>
              )}

              <Card className={`shadow-xl border-zinc-800 overflow-hidden ${view === 'mes' ? '' : 'hidden'}`}>
                <div className="grid grid-cols-7 gap-px bg-zinc-800/50 p-1">
                  {/* Dias da semana */}
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
                    <div
                      key={dia}
                      className="text-center py-3 text-sm font-medium text-zinc-400 bg-zinc-900/80"
                    >
                      {dia}
                    </div>
                  ))}

                  {/* Dias vazios antes do 1º */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-zinc-950/50" />
                  ))}

                  {/* Dias do mês */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasEvents = eventsByDay[day];
                    const isToday =
                      day === today.getDate() &&
                      currentMonth === today.getMonth() &&
                      currentYear === today.getFullYear();
                    const isSelected = day === selectedDay;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`
                          relative min-h-16 cursor-pointer rounded-lg p-1 transition-all sm:min-h-[100px] sm:p-2
                          ${isSelected ? 'bg-indigo-600/30 border border-indigo-500/50' : 'hover:bg-zinc-800/50'}
                          ${isToday ? 'bg-zinc-800/70 font-bold' : ''}
                        `}
                      >
                        <span className={`text-sm sm:text-lg ${isToday ? 'text-indigo-400' : ''}`}>
                          {day}
                        </span>

                        {hasEvents ? (
                          <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
                            {hasEvents}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Sidebar - Detalhes do dia selecionado */}
            <div className="lg:col-span-4">
              <Card title="Eventos do Dia" className="shadow-xl border-zinc-800 h-full">
                {!selectedDay ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center">Selecione um dia no calendário para ver ou adicionar eventos.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Button
                      variant="primary"
                      fullWidth
                      icon={<Plus size={16} />}
                      onClick={() => setIsModalOpen(true)}
                    >
                      Novo Evento neste dia
                    </Button>

                    {selectedEvents.length === 0 ? (
                      <p className="text-center text-zinc-500 py-8">
                        Nenhum evento agendado para {selectedDay}/{currentMonth + 1}/{currentYear}.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvents.map((e) => (
                          <div
                            key={e.id}
                            className="p-4 bg-zinc-900/70 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-zinc-100 flex items-center gap-2">
                                  {e.type === 'demanda' ? '📋' : '🎯'} {e.title}
                                </h4>
                                {e.description && (
                                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                    {e.description}
                                  </p>
                                )}
                                <div className="text-xs text-zinc-500 mt-2 flex flex-wrap gap-2">
                                  <span>
                                    {e.type === 'demanda' ? 'Demanda' : 'Objetivo'}
                                  </span>
                                  {e.priority && (
                                    <span className="px-2 py-0.5 bg-zinc-800 rounded-full">
                                      Prioridade {e.priority}
                                    </span>
                                  )}
                                  {e.status && (
                                    <span className="px-2 py-0.5 bg-zinc-800 rounded-full">
                                      {e.status}
                                    </span>
                                  )}
                                  {e.completed && (
                                    <span className="text-green-400">✓ Concluído</span>
                                  )}
                                </div>
                              </div>

                              {/* TODO: implementar delete */}
                              <button
                                type="button"
                                className="touch-target text-red-400"
                                aria-label="Excluir"
                                onClick={() => removeEvent(e)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}