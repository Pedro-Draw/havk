import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import {
  MessageSquare,
  NotebookPen,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  Send,
  ArrowLeft,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { getItem, getAll, addItem, updateItem } from '../db/indexedDB';

interface Demanda {
  id: string | number;
  title: string;
  description: string;
  status: 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  prazo?: string;
  responsavel?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatMessage {
  id?: string | number;
  demandaId: string | number;
  message: string;
  createdAt: string;
  sender?: string; // futuro: 'user' | 'equipe' | etc.
}

interface Nota {
  id?: string | number;
  demandaId: string | number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export default function DemandaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, translateUserContent } = useTranslation();

  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<'detalhes' | 'chat' | 'notas' | 'anexos' | 'historico'>('detalhes');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [nota, setNota] = useState('');
  const [notaOriginal, setNotaOriginal] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editedDemanda, setEditedDemanda] = useState<Partial<Demanda>>({});

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError(t('idNaoEncontrado') || 'ID da demanda não encontrado');
        setLoading(false);
        return;
      }

      try {
        const demandaData = await getItem<Demanda>('demandas', id);
        if (!demandaData) {
          setError(t('demandaNaoEncontrada') || 'Demanda não encontrada');
          setLoading(false);
          return;
        }
        setDemanda(demandaData);
        setEditedDemanda(demandaData);

        // Carregar mensagens do chat da demanda
        const allChats = await getAll<ChatMessage>('chatMensagens');
        const filteredChats = allChats
          .filter((c) => String(c.demandaId) === String(id))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(filteredChats);

        // Carregar nota da demanda
        const allNotas = await getAll<Nota>('notas');
        const notaExistente = allNotas.find((n) => String(n.demandaId) === String(id));
        if (notaExistente) {
          setNota(notaExistente.content || '');
          setNotaOriginal(notaExistente.content || '');
        }
      } catch (err) {
        console.error(err);
        setError(t('erroCarregarDados') || 'Erro ao carregar dados da demanda');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, t]);

  // Scroll automático no chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !demanda) return;

    const messageObj: ChatMessage = {
      demandaId: id,
      message: newMessage,
      createdAt: new Date().toISOString(),
      sender: 'Você', // futuro: integrar com user atual
    };

    try {
      await addItem('chatMensagens', messageObj);
      setChatMessages((prev) => [...prev, messageObj]);
      setNewMessage('');
      toast.success(t('mensagemEnviada') || 'Mensagem enviada');
    } catch (err) {
      toast.error(t('erroEnviarMensagem') || 'Erro ao enviar mensagem');
    }
  };

  const handleSaveNota = async () => {
    if (!id || nota === notaOriginal) return;

    try {
      const allNotas = await getAll<Nota>('notas');
      const existing = allNotas.find((n) => String(n.demandaId) === String(id));

      if (existing) {
        const updatedNota = { ...existing, content: nota, updatedAt: new Date().toISOString() };
        await updateItem('notas', updatedNota);
      } else {
        await addItem('notas', {
          demandaId: id,
          content: nota,
          createdAt: new Date().toISOString(),
        });
      }

      setNotaOriginal(nota);
      toast.success(t('notaSalva') || 'Nota salva com sucesso');
    } catch (err) {
      toast.error(t('erroSalvarNota') || 'Erro ao salvar nota');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancelar edição
      setEditedDemanda(demanda || {});
      setIsEditing(false);
    } else {
      setEditedDemanda(demanda || {});
      setIsEditing(true);
    }
  };

  const handleSaveDemanda = async () => {
    if (!demanda || !id) return;

    try {
      const updated = {
        ...demanda,
        ...editedDemanda,
        updatedAt: new Date().toISOString(),
      };

      await updateItem('demandas', updated);
      setDemanda(updated);
      setIsEditing(false);
      toast.success(t('demandaAtualizada') || 'Demanda atualizada com sucesso');
    } catch (err) {
      toast.error(t('erroAtualizarDemanda') || 'Erro ao atualizar demanda');
    }
  };

  const handleConcluirOuReabrir = async () => {
    if (!demanda || !id) return;

    const newStatus = demanda.status === 'concluida' ? 'aberta' : 'concluida';
    try {
      const updated = {
        ...demanda,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await updateItem('demandas', updated);
      setDemanda(updated);
      toast.success(
        newStatus === 'concluida'
          ? t('demandaConcluida')
          : t('demandaReaberta') || 'Demanda reaberta'
      );
    } catch (err) {
      toast.error(t('erroAtualizarStatus') || 'Erro ao atualizar status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-100"></div>
      </div>
    );
  }

  if (error || !demanda) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('erro')}</h2>
        <p>{error || t('demandaNaoEncontrada')}</p>
        <Button variant="primary" className="mt-6" as="a" href="/">
          {t('voltarAoDashboard')}
        </Button>
      </div>
    );
  }

  const prioridadeColor = {
    urgente: 'text-red-400 bg-red-900/30',
    alta: 'text-orange-400 bg-orange-900/30',
    media: 'text-yellow-400 bg-yellow-900/30',
    baixa: 'text-green-400 bg-green-900/30',
  }[demanda.prioridade?.toLowerCase() || 'media'] || 'text-zinc-400 bg-zinc-800/30';

  const statusColor = {
    concluida: 'text-emerald-400 bg-emerald-900/30',
    'em-progresso': 'text-blue-400 bg-blue-900/30',
    aberta: 'text-indigo-400 bg-indigo-900/30',
    bloqueada: 'text-red-400 bg-red-900/30',
  }[demanda.status] || 'text-zinc-400 bg-zinc-800/30';

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" as="a" href="/" className="p-2">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            {isEditing ? (
              <input
                value={editedDemanda.title || ''}
                onChange={(e) => setEditedDemanda({ ...editedDemanda, title: e.target.value })}
                className="text-3xl font-bold bg-zinc-800 border border-zinc-700 rounded px-3 py-1 w-full max-w-xl focus:outline-none focus:border-zinc-500"
                placeholder={t('tituloDaDemanda')}
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold">
                {translateUserContent(demanda.title || t('semTitulo'))}
              </h1>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant={isEditing ? 'secondary' : 'outline'}
              onClick={handleToggleEdit}
              icon={isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            >
              {isEditing ? t('cancelar') : t('editar')}
            </Button>

            <Button
              variant="primary"
              onClick={isEditing ? handleSaveDemanda : handleConcluirOuReabrir}
              icon={isEditing ? <Save className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            >
              {isEditing ? t('salvarAlteracoes') : demanda.status === 'concluida' ? t('reabrir') : t('concluir')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-800 mb-6 scrollbar-hide">
          {['detalhes', 'chat', 'notas', 'anexos', 'historico'].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`
                flex items-center gap-2 px-5 py-3 font-medium whitespace-nowrap transition-colors
                ${tab === key
                  ? 'border-b-2 border-zinc-100 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}
              `}
            >
              {key === 'detalhes' && <FileText className="w-4 h-4" />}
              {key === 'chat' && <MessageSquare className="w-4 h-4" />}
              {key === 'notas' && <NotebookPen className="w-4 h-4" />}
              {key === 'anexos' && <FileText className="w-4 h-4" />}
              {key === 'historico' && <Clock className="w-4 h-4" />}
              {t(key) || key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        {tab === 'detalhes' && (
          <div className="space-y-6">
            <Card title={t('informacoesPrincipais')} className="border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">{t('status')}</label>
                  {isEditing ? (
                    <select
                      value={editedDemanda.status || demanda.status}
                      onChange={(e) => setEditedDemanda({ ...editedDemanda, status: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-zinc-500"
                    >
                      <option value="aberta">{t('aberta')}</option>
                      <option value="em-progresso">{t('emProgresso')}</option>
                      <option value="concluida">{t('concluida')}</option>
                      <option value="bloqueada">{t('bloqueada')}</option>
                    </select>
                  ) : (
                    <p className={`font-medium px-3 py-1 rounded-full inline-block ${statusColor}`}>
                      {t(demanda.status)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-zinc-400 block mb-1">{t('prioridade')}</label>
                  {isEditing ? (
                    <select
                      value={editedDemanda.prioridade || demanda.prioridade}
                      onChange={(e) => setEditedDemanda({ ...editedDemanda, prioridade: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-zinc-500"
                    >
                      <option value="baixa">{t('baixa')}</option>
                      <option value="media">{t('media')}</option>
                      <option value="alta">{t('alta')}</option>
                      <option value="urgente">{t('urgente')}</option>
                    </select>
                  ) : (
                    <p className={`font-medium px-3 py-1 rounded-full inline-block ${prioridadeColor}`}>
                      {t(demanda.prioridade || 'media')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-zinc-400 block mb-1">{t('responsavel')}</label>
                  {isEditing ? (
                    <input
                      value={editedDemanda.responsavel || ''}
                      onChange={(e) => setEditedDemanda({ ...editedDemanda, responsavel: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-zinc-500"
                      placeholder={t('digiteNomeOuEmail')}
                    />
                  ) : (
                    <p className="font-medium">{demanda.responsavel || t('naoAtribuido')}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-zinc-400 block mb-1">{t('prazo')}</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedDemanda.prazo || ''}
                      onChange={(e) => setEditedDemanda({ ...editedDemanda, prazo: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-zinc-500"
                    />
                  ) : (
                    <p className="font-medium">
                      {demanda.prazo ? new Date(demanda.prazo).toLocaleDateString('pt-BR') : t('semPrazo')}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card title={t('descricao')} className="border-zinc-800">
              {isEditing ? (
                <textarea
                  value={editedDemanda.description || ''}
                  onChange={(e) => setEditedDemanda({ ...editedDemanda, description: e.target.value })}
                  className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                  placeholder={t('descrevaADemanda')}
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">
                  {translateUserContent(demanda.description || t('semDescricao'))}
                </p>
              )}
            </Card>
          </div>
        )}

        {tab === 'chat' && (
          <Card title={t('chatDaDemanda')} className="border-zinc-800">
            <div className="h-[60vh] overflow-y-auto bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 mb-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p>{t('nenhumaMensagemAinda')}</p>
                  <p className="text-sm mt-2">{t('inicieAConversa')}</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'Você' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'Você'
                          ? 'bg-indigo-600/30 rounded-tr-none'
                          : 'bg-zinc-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm text-zinc-200">{translateUserContent(msg.message)}</p>
                      <p className="text-xs text-zinc-500 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={t('digiteSuaMensagem')}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Button
                variant="primary"
                icon={<Send className="w-5 h-5" />}
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                {t('enviar')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'notas' && (
          <Card title={t('notasInternasDaDemanda')} className="border-zinc-800">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-xl p-5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-mono text-sm leading-relaxed"
              placeholder={t('escrevaSuasNotasAqui') + '\n\n• Ideias\n• Pendências\n• Observações técnicas\n...'}
            />

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setNota(notaOriginal)} disabled={nota === notaOriginal}>
                {t('descartar')}
              </Button>
              <Button variant="primary" onClick={handleSaveNota} disabled={nota === notaOriginal}>
                {t('salvarNotas')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'anexos' && (
          <Card title={t('anexosEDocumentos')} className="border-zinc-800">
            <div className="text-center py-12 text-zinc-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">{t('nenhumAnexoAinda')}</p>
              <p className="text-sm">{t('cliqueParaAdicionarArquivos')}</p>
              <Button variant="outline" className="mt-6">
                {t('adicionarAnexo')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'historico' && (
          <Card title={t('historicoDeAlteracoes')} className="border-zinc-800">
            <div className="text-center py-12 text-zinc-500">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('historicoEmDesenvolvimento')}</p>
              <p className="text-sm mt-2">{t('emBreveVocePoderaVerTodasAsAlteracoes')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}