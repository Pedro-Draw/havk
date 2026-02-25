import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { GanttChart, ZoomIn, ZoomOut } from 'lucide-react';
import Card from '../components/ui/Card';
import { getAll } from '../db/indexedDB';

export default function Gantt() {
  const { t } = useTranslation();
  const [demandas, setDemandas] = useState<any[]>([]);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadDemandas = async () => {
      const data = await getAll<any>('demandas');
      setDemandas(data.filter((d) => d.prazo)); // só demandas com prazo
    };
    loadDemandas();
  }, []);

  const getDaysDiff = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <GanttChart className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('gantt')}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom(zoom + 0.2)} className="p-2 hover:bg-zinc-800 rounded">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} className="p-2 hover:bg-zinc-800 rounded">
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px] py-4">
              {/* Cabeçalho de meses/dias */}
              <div className="grid grid-cols-[200px_repeat(30,_minmax(40px,_1fr))] gap-px bg-zinc-800 text-xs text-zinc-400 mb-2">
                <div className="bg-zinc-900 p-2 font-medium">Demanda</div>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="text-center p-2">
                    Dia {i + 1}
                  </div>
                ))}
              </div>

              {/* Linhas de demandas */}
              {demandas.map((demanda) => {
                const startDay = 1; // simplificado
                const duration = Math.min(30, getDaysDiff(demanda.prazoInicio || new Date(), demanda.prazo) || 5);

                return (
                  <div
                    key={demanda.id}
                    className="grid grid-cols-[200px_repeat(30,_minmax(40px,_1fr))] gap-px bg-zinc-900 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="p-3 font-medium text-zinc-100 truncate border-r border-zinc-800">
                      {demanda.title}
                    </div>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isInRange = i >= startDay && i < startDay + duration;
                      return (
                        <div
                          key={i}
                          className={`h-10 border-b border-zinc-800 ${
                            isInRange ? 'bg-zinc-700' : 'bg-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {demandas.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  Nenhuma demanda com prazo para exibir no Gantt
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}