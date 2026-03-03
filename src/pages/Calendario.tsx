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

type EventType = 'demanda' | 'objetivo' | 'evento';

export default function Calendario() {
  const { t } = useTranslation();
  const { demandas, objetivos, addDemanda, addObjetivo } = useAppStore();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'demanda' as EventType,
    title: '',
    description: '',
    priority: 'media',
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const selectedDate = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay)
    : null;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  /* ===============================
     EVENTOS
  =============================== */

  const allEvents = useMemo(() => {
    return [
      ...demandas.map((d: any) => ({ ...d, type: 'demanda' })),
      ...objetivos.map((o: any) => ({ ...o, type: 'objetivo' })),
    ];
  }, [demandas, objetivos]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, number> = {};

    allEvents.forEach((e: any) => {
      if (!e.date) return;
      const date = new Date(e.date);
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        map[date.getDate()] = (map[date.getDate()] || 0) + 1;
      }
    });

    return map;
  }, [allEvents, currentMonth, currentYear]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];

    return allEvents.filter((e: any) => {
      if (!e.date) return false;
      const date = new Date(e.date);
      return (
        date.getDate() === selectedDay &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }, [selectedDay, allEvents, currentMonth, currentYear]);

  /* ===============================
     CRIAR EVENTO
  =============================== */

  const handleCreate = async () => {
    if (!selectedDate || !form.title.trim()) return;

    if (form.type === 'demanda') {
      await addDemanda({
        title: form.title,
        description: form.description,
        status: 'pendente',
        priority: form.priority,
        date: selectedDate.toISOString(),
      });
    }

    if (form.type === 'objetivo') {
      await addObjetivo({
        title: form.title,
        completed: false,
        date: selectedDate.toISOString(),
      });
    }

    setToast('Evento criado com sucesso!');
    setIsModalOpen(false);
    setForm({ type: 'demanda', title: '', description: '', priority: 'media' });

    setTimeout(() => setToast(null), 3000);
  };

  /* ===============================
     UI
  =============================== */

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div className="mx-auto max-w-7xl pb-16">
          {toast && (
            <div className="fixed top-6 right-6 bg-indigo-600 px-6 py-3 rounded-xl shadow-xl z-50 animate-fade-in">
              {toast}
            </div>
          )}

          {/* MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-zinc-900 w-full max-w-lg rounded-2xl p-6 border border-zinc-800 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Novo Evento</h2>
                  <X
                    className="cursor-pointer text-zinc-400 hover:text-white"
                    size={24}
                    onClick={() => setIsModalOpen(false)}
                  />
                </div>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as EventType })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                >
                  <option value="demanda">Demanda</option>
                  <option value="objetivo">Objetivo</option>
                </select>

                <input
                  placeholder="Título do evento"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                />

                <textarea
                  placeholder="Descrição (opcional)"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none min-h-[80px]"
                />

                {form.type === 'demanda' && (
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-zinc-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
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
            {/* CALENDÁRIO PRINCIPAL */}
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-indigo-400" />
                  <h1 className="text-3xl font-bold">{t('calendario')}</h1>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
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
                    onClick={nextMonth}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <Card className="shadow-xl border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-7 gap-px bg-zinc-800/50 p-1">
                  {/* Cabeçalho dos dias da semana */}
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
                    <div
                      key={dia}
                      className="text-center py-3 text-sm font-medium text-zinc-400 bg-zinc-900/80"
                    >
                      {dia}
                    </div>
                  ))}

                  {/* Dias vazios no início */}
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
                          relative min-h-[100px] p-2 rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'bg-indigo-600/30 border border-indigo-500/50' : 'hover:bg-zinc-800/50'}
                          ${isToday ? 'bg-zinc-800/70 font-bold' : ''}
                        `}
                      >
                        <span className={`text-lg ${isToday ? 'text-indigo-400' : ''}`}>
                          {day}
                        </span>

                        {hasEvents && (
                          <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
                            {hasEvents}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* SIDEBAR - Detalhes do Dia */}
            <div className="lg:col-span-4">
              <Card title="Detalhes do Dia Selecionado" className="shadow-xl border-zinc-800 h-full">
                {!selectedDay ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>Selecione um dia no calendário para ver ou adicionar eventos.</p>
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
                        Nenhum evento agendado para este dia.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvents.map((e: any) => (
                          <div
                            key={e.id}
                            className="p-4 bg-zinc-900/70 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-zinc-100">{e.title}</h4>
                                {e.description && (
                                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                    {e.description}
                                  </p>
                                )}
                                <span className="text-xs text-zinc-500 mt-2 block">
                                  {e.type === 'demanda' ? 'Demanda' : 'Objetivo'}
                                  {e.priority && ` • Prioridade ${e.priority}`}
                                </span>
                              </div>
                              <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
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