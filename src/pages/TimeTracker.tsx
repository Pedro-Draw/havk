import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Clock, Play, Pause, Square, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function TimeTracker() {
  const { t } = useTranslation();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [history, setHistory] = useState<{ task: string; time: number; date: string }[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (time > 0 && taskName.trim()) {
      setHistory((prev) => [
        ...prev,
        { task: taskName.trim(), time, date: new Date().toLocaleString() },
      ]);
    }
    setTime(0);
    setTaskName('');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setTaskName('');
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('timeTracker')}</h1>
        </div>

        <Card title="Rastreador de Tempo" description="Registre o tempo gasto em tarefas">
          <div className="text-center py-12">
            <div className="text-7xl font-mono font-bold text-zinc-100 mb-8">
              {formatTime(time)}
            </div>

            <Input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Nome da tarefa atual..."
              className="max-w-md mx-auto mb-8"
            />

            <div className="flex justify-center gap-4">
              <Button
                variant={isRunning ? 'secondary' : 'primary'}
                size="lg"
                icon={isRunning ? <Pause /> : <Play />}
                onClick={handleStartPause}
              >
                {isRunning ? 'Pausar' : 'Iniciar'}
              </Button>

              <Button variant="outline" size="lg" icon={<Square />} onClick={handleStop}>
                Parar
              </Button>

              <Button variant="ghost" size="lg" icon={<RotateCcw />} onClick={handleReset}>
                Resetar
              </Button>
            </div>
          </div>
        </Card>

        {history.length > 0 && (
          <Card title="Histórico de Sessões" className="mt-8">
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-100">{entry.task}</p>
                    <p className="text-sm text-zinc-500">{entry.date}</p>
                  </div>
                  <span className="text-lg font-mono text-zinc-300">{formatTime(entry.time)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}