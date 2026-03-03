import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  ListTodo,
  Plus,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { getItem, getAll, addItem, updateItem } from '../db/indexedDB';

interface Demanda {
  id: number;
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
  id?: number;
  demandaId: number;
  message: string;
  createdAt: string;
  sender?: string;
}

interface Nota {
  id?: number;
  demandaId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export default function DemandaDetail() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, translateUserContent } = useTranslation();

  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [demandasList, setDemandasList] = useState<Demanda[]>([]);
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

  // Modal criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDemandaForm, setNewDemandaForm] = useState({
    title: '',
    description: '',
    prioridade: 'media' as Demanda['prioridade'],
    status: 'aberta' as Demanda['status'],
    prazo: '',
    responsavel: '',
  });

  // Lista – roda apenas uma vez
  useEffect(() => {
    if (idParam) return;

    let isMounted = true;

    const loadList = async () => {
      setLoading(true);
      setError(null);

      try {
        const all = await getAll<Demanda>('demandas');
        const sorted = all.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (isMounted) setDemandasList(sorted);
      } catch (err) {
        console.error('Erro ao carregar lista:', err);
        if (isMounted) setError('Erro ao carregar demandas');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadList();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detalhe
  useEffect(() => {
    if (!idParam) return;

    let isMounted = true;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const numericId = Number(idParam);
        if (isNaN(numericId)) throw new Error('ID inválido');

        const single = await getItem<Demanda>('demandas', numericId);
        if (!single) {
          if (isMounted) setError('Demanda não encontrada');
          return;
        }

        if (isMounted) {
          setDemanda(single);
          setEditedDemanda(single);
        }

        const allChats = await getAll<ChatMessage>('chatMensagens');
        const filteredChats = allChats
          .filter((c) => String(c.demandaId) === String(numericId))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (isMounted) setChatMessages(filteredChats);

        const allNotas = await getAll<Nota>('notas');
        const notaExistente = allNotas.find((n) => String(n.demandaId) === String(numericId));
        if (notaExistente && isMounted) {
          setNota(notaExistente.content || '');
          setNotaOriginal(notaExistente.content || '');
        }
      } catch (err) {
        console.error('Erro ao carregar detalhe:', err);
        if (isMounted) setError('Erro ao carregar dados');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [idParam]);

  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !idParam || !demanda) return;
    const numericId = Number(idParam);
    if (isNaN(numericId)) return;

    const messageObj: ChatMessage = {
      demandaId: numericId,
      message: newMessage,
      createdAt: new Date().toISOString(),
      sender: 'Você',
    };

    try {
      await addItem('chatMensagens', messageObj);
      setChatMessages((prev) => [...prev, messageObj]);
      setNewMessage('');
      toast.success('Mensagem enviada!');
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleSaveNota = async () => {
    if (!idParam || nota === notaOriginal) return;
    const numericId = Number(idParam);
    if (isNaN(numericId)) return;

    try {
      const allNotas = await getAll<Nota>('notas');
      const existing = allNotas.find((n) => String(n.demandaId) === String(numericId));

      if (existing) {
        const updatedNota = { ...existing, content: nota, updatedAt: new Date().toISOString() };
        await updateItem('notas', updatedNota);
      } else {
        await addItem('notas', {
          demandaId: numericId,
          content: nota,
          createdAt: new Date().toISOString(),
        });
      }

      setNotaOriginal(nota);
      toast.success('Nota salva!');
    } catch (err) {
      toast.error('Erro ao salvar nota');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditedDemanda(demanda || {});
      setIsEditing(false);
    } else {
      setEditedDemanda({ ...demanda });
      setIsEditing(true);
    }
  };

  const handleSaveDemanda = async () => {
    if (!demanda || !idParam) return;
    const numericId = Number(idParam);
    if (isNaN(numericId)) return;

    try {
      const updated: Demanda = {
        ...demanda,
        ...editedDemanda,
        id: numericId,
        updatedAt: new Date().toISOString(),
      };

      await updateItem('demandas', updated);
      setDemanda(updated);
      setIsEditing(false);
      toast.success('Demanda atualizada!');
    } catch (err) {
      toast.error('Erro ao atualizar demanda');
    }
  };

  const handleConcluirOuReabrir = async () => {
    if (!demanda || !idParam) return;
    const numericId = Number(idParam);
    if (isNaN(numericId)) return;

    const newStatus = demanda.status === 'concluida' ? 'aberta' : 'concluida';

    try {
      const updated: Demanda = {
        ...demanda,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await updateItem('demandas', updated);
      setDemanda(updated);
      toast.success(newStatus === 'concluida' ? 'Demanda concluída!' : 'Demanda reaberta!');
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCreateDemanda = async () => {
    if (!newDemandaForm.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      const nova: Omit<Demanda, 'id'> = {
        title: newDemandaForm.title.trim(),
        description: newDemandaForm.description.trim(),
        status: newDemandaForm.status,
        prioridade: newDemandaForm.prioridade,
        prazo: newDemandaForm.prazo || undefined,
        responsavel: newDemandaForm.responsavel?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const newId = await addItem('demandas', nova);

      toast.success('Demanda criada com sucesso!');
      setShowCreateModal(false);

      // Limpa form
      setNewDemandaForm({
        title: '',
        description: '',
        prioridade: 'media',
        status: 'aberta',
        prazo: '',
        responsavel: '',
      });

      // Atualiza lista e redireciona
      const all = await getAll<Demanda>('demandas');
      setDemandasList(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      navigate(`/demandas/${newId}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar demanda');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // LISTA
  if (!idParam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
        <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
          <div className="mx-auto max-w-7xl pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                  <ListTodo className="w-10 h-10 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Demandas</h1>
                  <p className="text-zinc-400 mt-1">
                    {demandasList.length} {demandasList.length === 1 ? 'demanda' : 'demandas'}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
              >
                Nova Demanda
              </Button>
            </div>

            {demandasList.length === 0 ? (
              <Card className="text-center py-20 border-zinc-800 shadow-2xl">
                <AlertTriangle className="w-20 h-20 mx-auto mb-6 text-yellow-500/70" />
                <h2 className="text-3xl font-bold mb-4 text-zinc-200">Nenhuma demanda ainda</h2>
                <p className="text-zinc-500 mb-10 max-w-lg mx-auto">
                  Comece criando sua primeira demanda para organizar suas tarefas.
                </p>
                <Button variant="outline" size="xl" onClick={() => setShowCreateModal(true)}>
                  Criar primeira demanda
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {demandasList.map((dem) => (
                  <Card
                    key={dem.id}
                    hoverable
                    className="border border-zinc-800 bg-zinc-900/60 shadow-lg hover:shadow-2xl hover:border-indigo-600/50 transition-all duration-300 cursor-pointer flex flex-col rounded-xl overflow-hidden"
                    onClick={() => navigate(`/demandas/${dem.id}`)}
                  >
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-semibold text-lg text-white line-clamp-2 mb-4">
                        {dem.title || 'Sem título'}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            {
                              aberta: 'bg-indigo-900/40 text-indigo-300',
                              'em-progresso': 'bg-blue-900/40 text-blue-300',
                              concluida: 'bg-emerald-900/40 text-emerald-300',
                              bloqueada: 'bg-red-900/40 text-red-300',
                            }[dem.status] || 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {t(dem.status) || dem.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            {
                              urgente: 'bg-red-900/40 text-red-300',
                              alta: 'bg-orange-900/40 text-orange-300',
                              media: 'bg-yellow-900/40 text-yellow-300',
                              baixa: 'bg-green-900/40 text-green-300',
                            }[dem.prioridade] || 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {t(dem.prioridade) || dem.prioridade}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Nova Demanda */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Criar Nova Demanda</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Título *</label>
                  <input
                    type="text"
                    value={newDemandaForm.title}
                    onChange={(e) => setNewDemandaForm({ ...newDemandaForm, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Ex: Implementar login social"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Descrição</label>
                  <textarea
                    value={newDemandaForm.description}
                    onChange={(e) => setNewDemandaForm({ ...newDemandaForm, description: e.target.value })}
                    className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none"
                    placeholder="Detalhes da tarefa, requisitos, observações..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Prioridade</label>
                    <select
                      value={newDemandaForm.prioridade}
                      onChange={(e) => setNewDemandaForm({ ...newDemandaForm, prioridade: e.target.value as Demanda['prioridade'] })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Prazo</label>
                    <input
                      type="date"
                      value={newDemandaForm.prazo}
                      onChange={(e) => setNewDemandaForm({ ...newDemandaForm, prazo: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Responsável</label>
                  <input
                    type="text"
                    value={newDemandaForm.responsavel}
                    onChange={(e) => setNewDemandaForm({ ...newDemandaForm, responsavel: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Nome ou email da pessoa responsável"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button variant="secondary" size="lg" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="lg" onClick={handleCreateDemanda} disabled={!newDemandaForm.title.trim()}>
                    Criar Demanda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ERRO DETALHE
  if (error || !demanda) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 px-6">
        <AlertTriangle className="w-24 h-24 text-red-500 mb-8 opacity-80" />
        <h2 className="text-4xl font-bold mb-4">{t('erro') || 'Erro'}</h2>
        <p className="text-xl text-center max-w-lg mb-10">
          {error || t('demandaNaoEncontrada') || 'Demanda não encontrada ou ID inválido.'}
        </p>
        <Button variant="primary" size="xl" asChild>
          <Link to="/demandas">
            {t('voltarAsDemandas') || 'Voltar para Demandas'}
          </Link>
        </Button>
      </div>
    );
  }

  // DETALHE (mantido seu layout anterior, só com id corrigido)
  const prioridadeColor = {
    urgente: 'text-red-400 bg-red-950/40 border-red-800/60',
    alta: 'text-orange-400 bg-orange-950/40 border-orange-800/60',
    media: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60',
    baixa: 'text-green-400 bg-green-950/40 border-green-800/60',
  }[demanda.prioridade.toLowerCase()] || 'text-zinc-400 bg-zinc-900/40 border-zinc-700/60';

  const statusColor = {
    concluida: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    'em-progresso': 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    aberta: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60',
    bloqueada: 'text-red-400 bg-red-950/40 border-red-800/60',
  }[demanda.status] || 'text-zinc-400 bg-zinc-900/40 border-zinc-700/60';

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-24">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
            <div className="flex items-start gap-5">
              <Button variant="ghost" size="icon" asChild className="mt-1 hover:bg-zinc-800 rounded-xl">
                <Link to="/demandas">
                  <ArrowLeft className="w-8 h-8" />
                </Link>
              </Button>

              <div className="flex-1">
                {isEditing ? (
                  <input
                    value={editedDemanda.title || ''}
                    onChange={(e) => setEditedDemanda({ ...editedDemanda, title: e.target.value })}
                    className="text-3xl md:text-4xl font-bold bg-zinc-900/80 border border-zinc-700 rounded-xl px-5 py-3 w-full focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Título da Demanda"
                  />
                ) : (
                  <h1 className="text-3xl md:text-5xl font-bold break-words leading-tight">
                    {translateUserContent(demanda.title || 'Sem título')}
                  </h1>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <Button
                variant={isEditing ? 'secondary' : 'outline'}
                size="lg"
                onClick={handleToggleEdit}
                icon={isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={isEditing ? handleSaveDemanda : handleConcluirOuReabrir}
                icon={isEditing ? <Save className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              >
                {isEditing ? 'Salvar Alterações' : demanda.status === 'concluida' ? 'Reabrir' : 'Concluir'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-zinc-800/80 mb-10 scrollbar-hide">
            {['detalhes', 'chat', 'notas', 'anexos', 'historico'].map((key) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`
                  group flex items-center gap-3 px-7 py-5 font-medium whitespace-nowrap transition-all duration-200
                  ${tab === key
                    ? 'border-b-4 border-indigo-500 text-indigo-300 bg-zinc-900/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-b-4 border-transparent'}
                `}
              >
                {key === 'detalhes' && <FileText className="w-5 h-5" />}
                {key === 'chat' && <MessageSquare className="w-5 h-5" />}
                {key === 'notas' && <NotebookPen className="w-5 h-5" />}
                {key === 'anexos' && <FileText className="w-5 h-5" />}
                {key === 'historico' && <Clock className="w-5 h-5" />}
                <span>{t(key) || key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo das tabs */}
          {tab === 'detalhes' && (
            <div className="space-y-10">
              <Card title="Informações Principais" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Status</label>
                    {isEditing ? (
                      <select
                        value={editedDemanda.status || demanda.status}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, status: e.target.value as Demanda['status'] })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="aberta">Aberta</option>
                        <option value="em-progresso">Em Progresso</option>
                        <option value="concluida">Concluída</option>
                        <option value="bloqueada">Bloqueada</option>
                      </select>
                    ) : (
                      <div className={`inline-flex px-5 py-2 rounded-full font-medium ${statusColor}`}>
                        {t(demanda.status) || demanda.status}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Prioridade</label>
                    {isEditing ? (
                      <select
                        value={editedDemanda.prioridade || demanda.prioridade}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, prioridade: e.target.value as Demanda['prioridade'] })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    ) : (
                      <div className={`inline-flex px-5 py-2 rounded-full font-medium ${prioridadeColor}`}>
                        {t(demanda.prioridade) || demanda.prioridade}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Responsável</label>
                    {isEditing ? (
                      <input
                        value={editedDemanda.responsavel || ''}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, responsavel: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                        placeholder="Nome ou email"
                      />
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.responsavel || 'Não atribuído'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Prazo</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedDemanda.prazo || ''}
                        onChange={(e) => setEditedDemanda({ ...editedDemanda, prazo: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.prazo ? new Date(demanda.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Descrição" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
                {isEditing ? (
                  <textarea
                    value={editedDemanda.description || ''}
                    onChange={(e) => setEditedDemanda({ ...editedDemanda, description: e.target.value })}
                    className="w-full h-56 bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none text-base leading-relaxed"
                    placeholder="Descreva a demanda..."
                  />
                ) : (
                  <div className="whitespace-pre-line leading-relaxed text-base text-zinc-200">
                    {translateUserContent(demanda.description || 'Sem descrição')}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Chat */}
          {tab === 'chat' && (
            <Card title="Chat da Demanda" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
              <div className="h-[60vh] overflow-y-auto bg-zinc-950/50 rounded-xl border border-zinc-800/80 p-6 space-y-5 mb-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <MessageSquare className="w-16 h-16 mb-6 opacity-60" />
                    <p className="text-xl font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-base mt-3 opacity-80">Inicie a conversa</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'Você' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-5 py-4 text-base
                          ${msg.sender === 'Você'
                            ? 'bg-indigo-600/30 rounded-tr-none border border-indigo-500/30'
                            : 'bg-zinc-800/90 rounded-tl-none border border-zinc-700'}
                        `}
                      >
                        <p className="text-zinc-200 leading-relaxed">{msg.message}</p>
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
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-base"
                />
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Send className="w-6 h-6" />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Enviar
                </Button>
              </div>
            </Card>
          )}

          {/* Notas */}
          {tab === 'notas' && (
            <Card title="Notas Internas" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full h-80 bg-zinc-950 border border-zinc-700 rounded-xl p-6 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none font-mono text-base leading-relaxed"
                placeholder="Escreva suas notas internas aqui..."
              />

              <div className="mt-8 flex justify-end gap-5">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setNota(notaOriginal)}
                  disabled={nota === notaOriginal}
                >
                  Descartar
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveNota}
                  disabled={nota === notaOriginal}
                >
                  Salvar Notas
                </Button>
              </div>
            </Card>
          )}

          {/* Anexos e Histórico mantidos como placeholder */}
          {tab === 'anexos' && (
            <Card title="Anexos e Documentos" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
              <div className="text-center py-24 text-zinc-500">
                <FileText className="w-24 h-24 mx-auto mb-8 opacity-60" />
                <p className="text-3xl font-medium mb-4">Nenhum anexo ainda</p>
                <Button variant="outline" size="xl">
                  Adicionar Anexo
                </Button>
              </div>
            </Card>
          )}

          {tab === 'historico' && (
            <Card title="Histórico de Alterações" className="border-zinc-800/60 shadow-2xl bg-zinc-900/70 rounded-2xl">
              <div className="text-center py-24 text-zinc-500">
                <Clock className="w-24 h-24 mx-auto mb-8 opacity-60" />
                <p className="text-3xl font-medium mb-4">Histórico em desenvolvimento</p>
                <p className="text-xl mt-4 opacity-80">Em breve você verá todas as alterações</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}