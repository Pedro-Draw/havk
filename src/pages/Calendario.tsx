import { useTranslation } from '../i18n/useTranslation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/ui/Card';

export default function Calendario() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('calendario')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-lg font-medium">
              {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}{' '}
              {currentYear}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-full">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="py-2 text-sm font-medium text-zinc-400">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="py-4" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                day === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`py-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${
                    isToday ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-300'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="mt-8">
          <Card title="Eventos do Mês">
            <p className="text-zinc-400">Nenhum evento agendado ainda.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}