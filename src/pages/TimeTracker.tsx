import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  BarChart3,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

interface HistoryEntry {
  id: string;
  task: string;
  time: number;
  date: string;
}

export default function TimeTracker() {
  const { t } = useTranslation();

  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [taskName, setTaskName] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /* ================================
     LOAD PERSISTED DATA
  =================================*/
  useEffect(() => {
    const storedHistory = localStorage.getItem('timeTrackerHistory');
    const storedTime = localStorage.getItem('timeTrackerCurrentTime');
    const storedTask = localStorage.getItem('timeTrackerCurrentTask');

    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedTime) setTime(Number(storedTime));
    if (storedTask) setTaskName(storedTask);
  }, []);

  /* ================================
     SAVE DATA
  =================================*/
  useEffect(() => {
    localStorage.setItem('timeTrackerHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('timeTrackerCurrentTime', String(time));
  }, [time]);

  useEffect(() => {
    localStorage.setItem('timeTrackerCurrentTask', taskName);
  }, [taskName]);

  /* ================================
     TIMER
  =================================*/
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* ================================
     ACTIONS
  =================================*/

  const handleStartPause = () => {
    if (!taskName.trim()) return;
    setIsRunning((prev) => !prev);
  };

  // FINALIZA sessão mas NÃO zera o timer
  const handleStop = () => {
    if (time === 0 || !taskName.trim()) return;

    setIsRunning(false);

    setHistory((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        task: taskName.trim(),
        time,
        date: new Date().toLocaleString(),
      },
    ]);
  };

  // Reset manual
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setTaskName('');
  };

  const handleDeleteSession = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const totalTime = history.reduce((acc, cur) => acc + cur.time, 0);

  // Agrupar por tarefa
  const groupedByTask = history.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.task] = (acc[entry.task] || 0) + entry.time;
      return acc;
    },
    {}
  );

  /* ================================
     RENDER
  =================================*/

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">
            {t('timeTracker')}
          </h1>
        </div>

        {/* TIMER */}
        <Card
          title={t('timeTrackerTitle')}
          description={t('timeTrackerDescription')}
        >
          <div className="text-center py-10 space-y-6">

            <div className="text-7xl font-mono font-bold text-zinc-100">
              {formatTime(time)}
            </div>

            <Input
              value={taskName}
              onChange={(e) =>
                setTaskName((e.target as HTMLInputElement).value)
              }
              placeholder={t('taskNamePlaceholder')}
              className="max-w-md mx-auto"
            />

            <div className="flex justify-center gap-4 flex-wrap">

              <Button
                variant={isRunning ? 'secondary' : 'primary'}
                size="lg"
                icon={isRunning ? <Pause /> : <Play />}
                onClick={handleStartPause}
                disabled={!taskName.trim()}
              >
                {isRunning ? t('pause') : t('start')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                icon={<Square />}
                onClick={handleStop}
                disabled={time === 0}
              >
                {t('stop')}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                icon={<RotateCcw />}
                onClick={handleReset}
                disabled={time === 0}
              >
                {t('reset')}
              </Button>

            </div>
          </div>
        </Card>

        {/* ESTATÍSTICAS */}
        {history.length > 0 && (
          <Card title={t('statistics')} icon={<BarChart3 />}>
            <div className="text-zinc-300 space-y-4">

              <div>
                <p>
                  {t('totalTrackedTime')}:
                  <strong className="ml-2">
                    {formatTime(totalTime)}
                  </strong>
                </p>

                <p>
                  {t('totalSessions')}:
                  <strong className="ml-2">
                    {history.length}
                  </strong>
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <p className="text-zinc-400 text-sm">
                  {t('timePerTask')}
                </p>

                {Object.entries(groupedByTask).map(
                  ([task, seconds]) => (
                    <div
                      key={task}
                      className="flex justify-between text-sm"
                    >
                      <span>{task}</span>
                      <span>{formatTime(seconds)}</span>
                    </div>
                  )
                )}
              </div>

            </div>
          </Card>
        )}

        {/* HISTÓRICO */}
        {history.length > 0 && (
          <Card title={t('sessionHistory')}>
            <div className="space-y-3">

              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-100">
                      {entry.task}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {entry.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-mono text-zinc-300">
                      {formatTime(entry.time)}
                    </span>

                    <button
                      onClick={() =>
                        handleDeleteSession(entry.id)
                      }
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Button
                  variant="outline"
                  icon={<Trash2 />}
                  onClick={handleClearHistory}
                >
                  {t('clearHistory')}
                </Button>
              </div>

            </div>
          </Card>
        )}

      </div>
    </div>
  );
}