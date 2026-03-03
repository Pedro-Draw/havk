import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // ← adicionado Link
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
  sender?: string;
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

        const allChats = await getAll<ChatMessage>('chatMensagens');
        const filteredChats = allChats
          .filter((c) => String(c.demandaId) === String(id))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(filteredChats);

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
      sender: 'Você',
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
          ? t('demandaConcluida') || 'Demanda concluída'
          : t('demandaReaberta') || 'Demanda reaberta'
      );
    } catch (err) {
      toast.error(t('erroAtualizarStatus') || 'Erro ao atualizar status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !demanda) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 px-4">
        <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">{t('erro') || 'Erro'}</h2>
        <p className="text-lg text-center max-w-md">{error || t('demandaNaoEncontrada') || 'Demanda não encontrada'}</p>
        
        {/* Correção: usando asChild + Link */}
        <Button variant="primary" className="mt-8 px-8 py-4 text-lg" asChild>
          <Link to="/">
            {t('voltarAoDashboard') || 'Voltar ao Dashboard'}
          </Link>
        </Button>
      </div>
    );
  }

  const prioridadeColor = {
    urgente: 'text-red-400 bg-red-900/30 border-red-800/50',
    alta: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
    media: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
    baixa: 'text-green-400 bg-green-900/30 border-green-800/50',
  }[demanda.prioridade?.toLowerCase() || 'media'] || 'text-zinc-400 bg-zinc-800/30 border-zinc-700/50';

  const statusColor = {
    concluida: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50',
    'em-progresso': 'text-blue-400 bg-blue-900/30 border-blue-800/50',
    aberta: 'text-indigo-400 bg-indigo-900/30 border-indigo-800/50',
    bloqueada: 'text-red-400 bg-red-900/30 border-red-800/50',
  }[demanda.status] || 'text-zinc-400 bg-zinc-800/30 border-zinc-700/50';

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
        <div className="mx-auto max-w-7xl pb-20">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              {/* Botão de voltar corrigido com Link */}
              <Button variant="ghost" size="icon" asChild className="p-3 hover:bg-zinc-800 rounded-xl">
                <Link to="/" aria-label={t('voltar') || 'Voltar'}>
                  <ArrowLeft className="w-7 h-7" />
                </Link>
              </Button>

              {isEditing ? (
                <input
                  value={editedDemanda.title || ''}
                  onChange={(e) => setEditedDemanda({ ...editedDemanda, title: e.target.value })}
                  className="text-3xl sm:text-4xl font-bold bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 w-full max-w-2xl focus:outline-none focus:border-indigo-500"
                  placeholder={t('tituloDaDemanda') || 'Título da Demanda'}
                />
              ) : (
                <h1 className="text-3xl sm:text-4xl font-bold break-words">
                  {translateUserContent(demanda.title || t('semTitulo') || 'Sem título')}
                </h1>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant={isEditing ? 'secondary' : 'outline'}
                size="lg"
                onClick={handleToggleEdit}
                icon={isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              >
                {isEditing ? t('cancelar') || 'Cancelar' : t('editar') || 'Editar'}
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={isEditing ? handleSaveDemanda : handleConcluirOuReabrir}
                icon={isEditing ? <Save className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              >
                {isEditing
                  ? t('salvarAlteracoes') || 'Salvar Alterações'
                  : demanda.status === 'concluida'
                  ? t('reabrir') || 'Reabrir'
                  : t('concluir') || 'Concluir'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-zinc-800 mb-8 scrollbar-hide">
            {['detalhes', 'chat', 'notas', 'anexos', 'historico'].map((key) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`
                  flex items-center gap-3 px-6 py-4 font-medium whitespace-nowrap transition-all
                  ${tab === key
                    ? 'border-b-4 border-indigo-500 text-indigo-400 bg-zinc-900/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'}
                `}
              >
                {key === 'detalhes' && <FileText className="w-5 h-5" />}
                {key === 'chat' && <MessageSquare className="w-5 h-5" />}
                {key === 'notas' && <NotebookPen className="w-5 h-5" />}
                {key === 'anexos' && <FileText className="w-5 h-5" />}
                {key === 'historico' && <Clock className="w-5 h-5" />}
                {t(key) || key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          {/* Conteúdo das tabs */}
          {tab === 'detalhes' && (
            <div className="space-y-8">
              <Card title={t('informacoesPrincipais') || 'Informações Principais'} className="border-zinc-800 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">{t('status') || 'Status'}</label>
                    {isEditing ? (
                      <select
                        value={editedDemanda.status || demanda.status}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, status: e.target.value as Demanda['status'] })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="aberta">{t('aberta') || 'Aberta'}</option>
                        <option value="em-progresso">{t('emProgresso') || 'Em Progresso'}</option>
                        <option value="concluida">{t('concluida') || 'Concluída'}</option>
                        <option value="bloqueada">{t('bloqueada') || 'Bloqueada'}</option>
                      </select>
                    ) : (
                      <p className={`font-medium px-4 py-2 rounded-full inline-block ${statusColor}`}>
                        {t(demanda.status) || demanda.status}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">{t('prioridade') || 'Prioridade'}</label>
                    {isEditing ? (
                      <select
                        value={editedDemanda.prioridade || demanda.prioridade}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, prioridade: e.target.value as Demanda['prioridade'] })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="baixa">{t('baixa') || 'Baixa'}</option>
                        <option value="media">{t('media') || 'Média'}</option>
                        <option value="alta">{t('alta') || 'Alta'}</option>
                        <option value="urgente">{t('urgente') || 'Urgente'}</option>
                      </select>
                    ) : (
                      <p className={`font-medium px-4 py-2 rounded-full inline-block ${prioridadeColor}`}>
                        {t(demanda.prioridade || 'media') || demanda.prioridade || 'Média'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">{t('responsavel') || 'Responsável'}</label>
                    {isEditing ? (
                      <input
                        value={editedDemanda.responsavel || ''}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, responsavel: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                        placeholder={t('digiteNomeOuEmail') || 'Digite nome ou email'}
                      />
                    ) : (
                      <p className="font-medium">{demanda.responsavel || t('naoAtribuido') || 'Não atribuído'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">{t('prazo') || 'Prazo'}</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedDemanda.prazo || ''}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, prazo: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    ) : (
                      <p className="font-medium">
                        {demanda.prazo ? new Date(demanda.prazo).toLocaleDateString('pt-BR') : t('semPrazo') || 'Sem prazo'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card title={t('descricao') || 'Descrição'} className="border-zinc-800 shadow-xl">
                {isEditing ? (
                  <textarea
                    value={editedDemanda.description || ''}
                    onChange={(e) => setEditedDemanda({ ...editedDemanda, description: e.target.value })}
                    className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-xl p-5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none text-base leading-relaxed"
                    placeholder={t('descrevaADemanda') || 'Descreva a demanda...'}
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed text-base">
                    {translateUserContent(demanda.description || t('semDescricao') || 'Sem descrição')}
                  </p>
                )}
              </Card>
            </div>
          )}

          {tab === 'chat' && (
            <Card title={t('chatDaDemanda') || 'Chat da Demanda'} className="border-zinc-800 shadow-xl">
              <div className="h-[65vh] overflow-y-auto bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 space-y-5 mb-6">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <MessageSquare className="w-16 h-16 mb-6 opacity-50" />
                    <p className="text-xl font-medium">{t('nenhumaMensagemAinda') || 'Nenhuma mensagem ainda'}</p>
                    <p className="text-base mt-3">{t('inicieAConversa') || 'Inicie a conversa'}</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'Você' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-5 py-4 text-base
                          ${
                            msg.sender === 'Você'
                              ? 'bg-indigo-600/30 rounded-tr-none border border-indigo-500/30'
                              : 'bg-zinc-800/90 rounded-tl-none border border-zinc-700'
                          }
                        `}
                      >
                        <p className="text-zinc-200 leading-relaxed">{translateUserContent(msg.message)}</p>
                        <p className="text-xs text-zinc-500 mt-2 text-right opacity-80">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={t('digiteSuaMensagem') || 'Digite sua mensagem...'}
                  className="
                    flex-1 bg-zinc-900 border border-zinc-700 rounded-xl 
                    px-6 py-4 text-zinc-100 placeholder-zinc-500 
                    focus:outline-none focus:border-indigo-500 focus:ring-1 
                    focus:ring-indigo-500/30 transition-all text-base
                  "
                />
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Send className="w-6 h-6" />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  {t('enviar') || 'Enviar'}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'notas' && (
            <Card title={t('notasInternasDaDemanda') || 'Notas Internas da Demanda'} className="border-zinc-800 shadow-xl">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="
                  w-full h-72 bg-zinc-900 border border-zinc-700 rounded-2xl 
                  p-6 text-zinc-100 placeholder-zinc-500 focus:outline-none 
                  focus:border-indigo-500 resize-none font-mono text-base 
                  leading-relaxed
                "
                placeholder={
                  (t('escrevaSuasNotasAqui') || 'Escreva suas notas aqui...') +
                  '\n\n• Ideias para implementação\n• Pendências técnicas\n• Observações de testes\n• Links úteis\n...'
                }
              />

              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setNota(notaOriginal)}
                  disabled={nota === notaOriginal}
                >
                  {t('descartar') || 'Descartar'}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveNota}
                  disabled={nota === notaOriginal}
                >
                  {t('salvarNotas') || 'Salvar Notas'}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'anexos' && (
            <Card title={t('anexosEDocumentos') || 'Anexos e Documentos'} className="border-zinc-800 shadow-xl">
              <div className="text-center py-16 text-zinc-500">
                <FileText className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-2xl font-medium mb-3">{t('nenhumAnexoAinda') || 'Nenhum anexo ainda'}</p>
                <p className="text-lg mb-8">{t('cliqueParaAdicionarArquivos') || 'Clique para adicionar arquivos'}</p>
                <Button variant="outline" size="xl">
                  {t('adicionarAnexo') || 'Adicionar Anexo'}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'historico' && (
            <Card title={t('historicoDeAlteracoes') || 'Histórico de Alterações'} className="border-zinc-800 shadow-xl">
              <div className="text-center py-16 text-zinc-500">
                <Clock className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-2xl font-medium">{t('historicoEmDesenvolvimento') || 'Histórico em desenvolvimento'}</p>
                <p className="text-lg mt-4">{t('emBreveVocePoderaVerTodasAsAlteracoes') || 'Em breve você poderá ver todas as alterações'}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}