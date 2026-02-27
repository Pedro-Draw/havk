import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { GanttChart, ZoomIn, ZoomOut } from 'lucide-react';
import Card from '../components/ui/Card';
import { getAll } from '../db/indexedDB';

type Demanda = {
  id: number;
  title: string;
  prazo: string;
  prazoInicio?: string;
};

export default function Gantt() {
  const { t } = useTranslation();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadDemandas = async () => {
      const data = await getAll<Demanda>('demandas');
      setDemandas(data.filter((d) => d.prazo));
    };

    loadDemandas();
  }, []);

  // Normaliza data (remove hora)
  const normalizeDate = (date: string | Date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const getDaysDiff = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Define base do timeline (menor data início)
  const baseDate = useMemo(() => {
    if (demandas.length === 0) return normalizeDate(new Date());

    const dates = demandas.map((d) =>
      normalizeDate(d.prazoInicio || d.prazo)
    );

    return new Date(Math.min(...dates.map((d) => d.getTime())));
  }, [demandas]);

  const totalDays = 30; // pode expandir depois

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <GanttChart className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('gantt')}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setZoom((z) => z + 0.2)}
              className="p-2 hover:bg-zinc-800 rounded"
            >
              <ZoomIn className="w-5 h-5 text-zinc-300" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="p-2 hover:bg-zinc-800 rounded"
            >
              <ZoomOut className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <div
              className="py-4"
              style={{
                minWidth: `${200 + totalDays * 40 * zoom}px`,
              }}
            >
              {/* Cabeçalho */}
              <div
                className="grid gap-px bg-zinc-800 text-xs text-zinc-400 mb-2"
                style={{
                  gridTemplateColumns: `200px repeat(${totalDays}, minmax(${40 *
                    zoom}px, 1fr))`,
                }}
              >
                <div className="bg-zinc-900 p-2 font-medium">Demanda</div>
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div key={i} className="text-center p-2">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Linhas */}
              {demandas.map((demanda) => {
                const start = normalizeDate(
                  demanda.prazoInicio || demanda.prazo
                );
                const end = normalizeDate(demanda.prazo);

                const offset = getDaysDiff(baseDate, start) - 1;
                const duration = getDaysDiff(start, end);

                return (
                  <div
                    key={demanda.id}
                    className="grid gap-px bg-zinc-900 hover:bg-zinc-800 transition-colors"
                    style={{
                      gridTemplateColumns: `200px repeat(${totalDays}, minmax(${40 *
                        zoom}px, 1fr))`,
                    }}
                  >
                    <div className="p-3 font-medium text-zinc-100 truncate border-r border-zinc-800">
                      {demanda.title}
                    </div>

                    {Array.from({ length: totalDays }).map((_, i) => {
                      const isInRange =
                        i >= offset && i < offset + duration;

                      return (
                        <div
                          key={i}
                          className={`h-10 border-b border-zinc-800 ${
                            isInRange
                              ? 'bg-zinc-700'
                              : 'bg-transparent'
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