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
    if (!taskName.trim()) {
      toast.error(t('digiteNomeTarefa') || 'Digite o nome da tarefa primeiro');
      return;
    }
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
        date: new Date().toLocaleString('pt-BR'),
      },
    ]);

    toast.success(t('sessaoRegistrada') || 'Sessão registrada no histórico');
  };

  // Reset manual
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setTaskName('');
    toast.success(t('timerResetado') || 'Timer resetado');
  };

  const handleDeleteSession = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    toast.success(t('sessaoExcluida') || 'Sessão excluída');
  };

  const handleClearHistory = () => {
    if (!confirm(t('confirmarLimparHistorico') || 'Tem certeza que deseja limpar todo o histórico?')) return;
    setHistory([]);
    toast.success(t('historicoLimpo') || 'Histórico limpo');
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
        <div className="mx-auto max-w-7xl pb-20 space-y-10">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <Clock className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t('timeTracker') || 'Rastreador de Tempo'}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">
                  Registre o tempo gasto em tarefas e acompanhe sua produtividade
                </p>
              </div>
            </div>
          </div>

          {/* TIMER PRINCIPAL */}
          <Card title={t('timeTrackerTitle')} className="border-zinc-800 shadow-2xl">
            <div className="text-center py-12 md:py-16 space-y-8">
              <div className="text-7xl md:text-9xl font-mono font-bold text-zinc-100 tracking-tight drop-shadow-lg">
                {formatTime(time)}
              </div>

              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={t('taskNamePlaceholder') || 'Nome da tarefa atual...'}
                className="max-w-lg mx-auto text-xl py-5"
              />

              <div className="flex flex-wrap justify-center gap-5">
                <Button
                  variant={isRunning ? 'secondary' : 'primary'}
                  size="xl"
                  icon={isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  onClick={handleStartPause}
                  disabled={!taskName.trim()}
                  className="min-w-[160px] py-6 text-lg"
                >
                  {isRunning ? t('pause') : t('start')}
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  icon={<Square className="w-6 h-6" />}
                  onClick={handleStop}
                  disabled={time === 0}
                  className="min-w-[160px] py-6 text-lg"
                >
                  {t('stop')}
                </Button>

                <Button
                  variant="ghost"
                  size="xl"
                  icon={<RotateCcw className="w-6 h-6" />}
                  onClick={handleReset}
                  disabled={time === 0}
                  className="min-w-[160px] py-6 text-lg"
                >
                  {t('reset')}
                </Button>
              </div>
            </div>
          </Card>

          {/* ESTATÍSTICAS */}
          {history.length > 0 && (
            <Card title={t('statistics')} icon={<BarChart3 className="w-6 h-6" />} className="border-zinc-800 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-5xl md:text-6xl font-bold text-indigo-400 mb-2">
                      {formatTime(totalTime)}
                    </p>
                    <p className="text-lg text-zinc-400">{t('totalTrackedTime')}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-4xl md:text-5xl font-bold text-zinc-100 mb-2">
                      {history.length}
                    </p>
                    <p className="text-lg text-zinc-400">{t('totalSessions')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-medium text-zinc-300 mb-4">
                    {t('timePerTask')}
                  </p>

                  <div className="space-y-3">
                    {Object.entries(groupedByTask)
                      .sort(([, a], [, b]) => b - a) // ordena por tempo decrescente
                      .map(([task, seconds]) => (
                        <div
                          key={task}
                          className="flex justify-between items-center text-base bg-zinc-900/50 p-4 rounded-xl border border-zinc-800"
                        >
                          <span className="font-medium truncate max-w-[70%]">
                            {task}
                          </span>
                          <span className="font-mono text-indigo-300">
                            {formatTime(seconds)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* HISTÓRICO */}
          {history.length > 0 && (
            <Card title={t('sessionHistory')} className="border-zinc-800 shadow-2xl">
              <div className="space-y-4 p-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-zinc-900/70 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-lg text-zinc-100">
                        {entry.task}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {entry.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-mono font-bold text-zinc-100">
                        {formatTime(entry.time)}
                      </span>

                      <button
                        onClick={() => handleDeleteSession(entry.id)}
                        className="p-3 hover:bg-zinc-800 rounded-xl transition-colors text-red-400 hover:text-red-300"
                        title="Excluir sessão"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-6 flex justify-end">
                  <Button
                    variant="outline"
                    size="lg"
                    icon={<Trash2 className="w-5 h-5" />}
                    onClick={handleClearHistory}
                  >
                    {t('clearHistory')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {history.length === 0 && !time && (
            <div className="text-center py-20 text-zinc-500">
              <Clock className="w-20 h-20 mx-auto mb-8 opacity-50" />
              <h3 className="text-2xl font-medium mb-4">
                {t('nenhumaSessaoAinda')}
              </h3>
              <p className="text-lg max-w-lg mx-auto">
                Inicie o timer acima e registre seu tempo em tarefas do dia a dia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}