import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, NotebookPen, FileText, Clock, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getItem } from '../db/indexedDB';

export default function DemandaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, translateUserContent } = useTranslation();
  const [demanda, setDemanda] = useState<any>(null);
  const [tab, setTab] = useState<'detalhes' | 'chat' | 'notas' | 'anexos' | 'historico'>('detalhes');

  useEffect(() => {
    const loadDemanda = async () => {
      if (id) {
        const data = await getItem('demandas', Number(id));
        setDemanda(data);
      }
    };
    loadDemanda();
  }, [id]);

  if (!demanda) return <div className="pt-20 text-center">{t('carregando')}</div>;

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">
            {translateUserContent(demanda.title || 'Demanda sem título')}
          </h1>
          <div className="flex gap-3">
            <Button variant="outline">{t('editar')}</Button>
            <Button variant="primary">{t('concluir')}</Button>
          </div>
        </div>

        <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto">
          {['detalhes', 'chat', 'notas', 'anexos', 'historico'].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                tab === key
                  ? 'border-b-2 border-zinc-100 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t(key) || key}
            </button>
          ))}
        </div>

        {tab === 'detalhes' && (
          <Card title={t('detalhes')}>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-zinc-400 mb-1">{t('descricao')}</h3>
                <p className="text-zinc-100">{translateUserContent(demanda.description || '')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">{t('prioridade')}</h3>
                  <p className="font-medium">{demanda.prioridade || 'Média'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">{t('responsavel')}</h3>
                  <p className="font-medium">{demanda.responsavel || 'Não atribuído'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">{t('prazo')}</h3>
                  <p className="font-medium">{demanda.prazo || 'Sem prazo'}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {tab === 'chat' && (
          <Card title={t('chatDaDemanda')}>
            <div className="h-96 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center">
              <p className="text-zinc-500">{t('chatEmDesenvolvimento')}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={t('digiteMensagem')}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100"
              />
              <Button variant="primary">{t('enviar')}</Button>
            </div>
          </Card>
        )}

        {tab === 'notas' && (
          <Card title={t('notasDaDemanda')}>
            <textarea
              className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder={t('escrevaNotasAqui')}
            />
            <div className="mt-4">
              <Button variant="primary">{t('salvar')}</Button>
            </div>
          </Card>
        )}

        {/* Outras abas como placeholder */}
        {tab === 'anexos' && <Card title={t('anexos')}>Em desenvolvimento</Card>}
        {tab === 'historico' && <Card title={t('historico')}>Em desenvolvimento</Card>}
      </div>
    </div>
  );
}