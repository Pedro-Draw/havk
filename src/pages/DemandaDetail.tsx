import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, NotebookPen, FileText, Clock, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getItem, getAll, addItem, updateItem } from '../db/indexedDB';

export default function DemandaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, translateUserContent } = useTranslation();

  const [demanda, setDemanda] = useState<any>(null);
  const [tab, setTab] =
    useState<'detalhes' | 'chat' | 'notas' | 'anexos' | 'historico'>('detalhes');

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [nota, setNota] = useState('');

  useEffect(() => {
    const loadDemanda = async () => {
      if (id) {
        const data = await getItem('demandas', Number(id));
        setDemanda(data);

        const allChats = await getAll<any>('chatMensagens');
        const filteredChats = allChats.filter(
          (c) => String(c.demandaId) === String(id)
        );
        setChatMessages(filteredChats);

        const allNotas = await getAll<any>('notas');
        const notaExistente = allNotas.find(
          (n) => String(n.demandaId) === String(id)
        );
        if (notaExistente) {
          setNota(notaExistente.content || '');
        }
      }
    };

    loadDemanda();
  }, [id]);

  const handleConcluir = async () => {
    if (!demanda) return;

    const updated = { ...demanda, status: 'concluida' };
    await updateItem('demandas', updated);
    setDemanda(updated);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    const message = {
      demandaId: id,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    await addItem('chatMensagens', message);
    setChatMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const handleSaveNota = async () => {
    if (!id) return;

    const allNotas = await getAll<any>('notas');
    const existing = allNotas.find(
      (n) => String(n.demandaId) === String(id)
    );

    if (existing) {
      const updated = { ...existing, content: nota };
      await updateItem('notas', updated);
    } else {
      await addItem('notas', {
        demandaId: id,
        content: nota,
        createdAt: new Date().toISOString(),
      });
    }

    alert(t('salvoComSucesso') || 'Salvo com sucesso!');
  };

  if (!demanda)
    return <div className="pt-20 text-center text-zinc-400">{t('carregando')}</div>;

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">
            {translateUserContent(demanda.title || 'Demanda sem título')}
          </h1>

          <div className="flex gap-3">
            <Button variant="outline">{t('editar')}</Button>
            <Button variant="primary" onClick={handleConcluir}>
              {t('concluir')}
            </Button>
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
                <h3 className="text-sm text-zinc-400 mb-1">
                  {t('descricao')}
                </h3>
                <p className="text-zinc-100">
                  {translateUserContent(demanda.description || '')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">
                    {t('prioridade')}
                  </h3>
                  <p className="font-medium">
                    {demanda.prioridade || 'Média'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">
                    {t('responsavel')}
                  </h3>
                  <p className="font-medium">
                    {demanda.responsavel || 'Não atribuído'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-zinc-400 mb-1">
                    {t('prazo')}
                  </h3>
                  <p className="font-medium">
                    {demanda.prazo || 'Sem prazo'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {tab === 'chat' && (
          <Card title={t('chatDaDemanda')}>
            <div className="h-96 overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-800 p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-zinc-500">
                  {t('nenhumaMensagemAinda') || 'Nenhuma mensagem ainda.'}
                </p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="bg-zinc-800 p-3 rounded-lg text-zinc-100 text-sm"
                  >
                    {translateUserContent(msg.message)}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('digiteMensagem')}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100"
              />
              <Button variant="primary" onClick={handleSendMessage}>
                {t('enviar')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'notas' && (
          <Card title={t('notasDaDemanda')}>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder={t('escrevaNotasAqui')}
            />

            <div className="mt-4">
              <Button variant="primary" onClick={handleSaveNota}>
                {t('salvar')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'anexos' && (
          <Card title={t('anexos')}>
            {t('emDesenvolvimento') || 'Em desenvolvimento'}
          </Card>
        )}

        {tab === 'historico' && (
          <Card title={t('historico')}>
            {t('emDesenvolvimento') || 'Em desenvolvimento'}
          </Card>
        )}
      </div>
    </div>
  );
}