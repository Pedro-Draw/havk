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
    <div className="min-h-screen pt-24 px-6 bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {toast && (
        <div className="fixed top-6 right-6 bg-indigo-600 px-6 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 w-full max-w-lg rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Novo Evento</h2>
              <X
                className="cursor-pointer"
                onClick={() => setIsModalOpen(false)}
              />
            </div>

            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as EventType })
              }
              className="w-full bg-zinc-800 p-3 rounded-lg"
            >
              <option value="demanda">Demanda</option>
              <option value="objetivo">Objetivo</option>
            </select>

            <input
              placeholder="Título"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full bg-zinc-800 p-3 rounded-lg"
            />

            <textarea
              placeholder="Descrição"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full bg-zinc-800 p-3 rounded-lg"
            />

            {form.type === 'demanda' && (
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="w-full bg-zinc-800 p-3 rounded-lg"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            )}

            <Button onClick={handleCreate}>Criar</Button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">

        {/* CALENDÁRIO */}
        <div className="col-span-8">
          <div className="flex justify-between mb-8">
            <div className="flex items-center gap-3">
              <CalendarIcon />
              <h1 className="text-3xl font-bold">
                {t('calendario')}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={prevMonth}><ChevronLeft /></button>
              <span>
                {new Date(currentYear, currentMonth).toLocaleString('pt-BR', {
                  month: 'long',
                })}{' '}
                {currentYear}
              </span>
              <button onClick={nextMonth}><ChevronRight /></button>
            </div>
          </div>

          <Card>
            <div className="grid grid-cols-7 gap-2 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvents = eventsByDay[day];

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className="relative py-4 rounded-xl cursor-pointer hover:bg-zinc-800"
                  >
                    {day}
                    {hasEvents && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-indigo-600 px-2 rounded-full">
                        {hasEvents}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="col-span-4">
          <Card title="Detalhes do Dia">
            {!selectedDay && (
              <p className="text-zinc-500">
                Selecione um dia.
              </p>
            )}

            {selectedDay && (
              <div className="space-y-4">
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Novo Evento
                </Button>

                {selectedEvents.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-3 bg-zinc-800 rounded-lg"
                  >
                    <div className="flex justify-between">
                      <span>{e.title}</span>
                      <Trash2
                        size={16}
                        className="cursor-pointer text-red-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}