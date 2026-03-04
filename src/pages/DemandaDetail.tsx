// pages/DemandaDetail.tsx
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
  Paperclip,
  User,
  Calendar,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export default function DemandaDetail() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, translateUserContent } = useTranslation();

  const {
    demandas,
    chatMensagens,
    notas,
    addDemanda,
    updateDemanda,
    addChatMensagem,
    addNota,
    updateNota,
    isLoading,
  } = useAppStore();

  const [tab, setTab] = useState<'detalhes' | 'chat' | 'notas' | 'anexos' | 'historico'>('detalhes');

  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [nota, setNota] = useState('');
  const [notaOriginal, setNotaOriginal] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Partial<Demanda>>({});

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDemandaForm, setNewDemandaForm] = useState({
    title: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'aberta' as 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada',
    prazo: '',
    responsavel: '',
  });

  const demanda = idParam ? demandas.find(d => d.id === idParam) : null;
  const filteredChat = chatMensagens.filter(m => m.demandaId === idParam);
  const existingNota = notas.find(n => n.demandaId === idParam);

  useEffect(() => {
    if (existingNota) {
      setNota(existingNota.content || '');
      setNotaOriginal(existingNota.content || '');
    } else {
      setNota('');
      setNotaOriginal('');
    }
  }, [existingNota]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [filteredChat, selectedFiles]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !idParam) return;

    try {
      if (newMessage.trim()) {
        await addChatMensagem({
          message: newMessage.trim(),
          demandaId: idParam,
          senderId: 'current-user', // TODO: substituir pelo usuário real logado
          channel: 'demanda',
        });
      }

      if (selectedFiles.length > 0) {
        // TODO: implementar upload real para storage (Firebase/S3/etc) e salvar URLs
        toast.success(`${selectedFiles.length} arquivo(s) anexado(s) com sucesso`);
        setSelectedFiles([]);
      }

      setNewMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFilePreview = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNota = async () => {
    if (!idParam || nota === notaOriginal) return;

    try {
      if (existingNota) {
        await updateNota(existingNota.id, { content: nota.trim() });
      } else {
        await addNota({
          content: nota.trim(),
          demandaId: idParam,
        });
      }
      setNotaOriginal(nota);
      toast.success('Nota salva');
    } catch (err) {
      toast.error('Erro ao salvar nota');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditedFields({});
      setIsEditing(false);
    } else if (demanda) {
      setEditedFields({ ...demanda });
      setIsEditing(true);
    }
  };

  const handleSaveDemanda = async () => {
    if (!demanda || !idParam) return;

    try {
      await updateDemanda(idParam, {
        ...editedFields,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      toast.success('Demanda atualizada');
    } catch (err) {
      toast.error('Erro ao atualizar demanda');
    }
  };

  const handleConcluirOuReabrir = async () => {
    if (!demanda || !idParam) return;

    const newStatus = demanda.status === 'concluida' ? 'aberta' : 'concluida';

    try {
      await updateDemanda(idParam, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      toast.success(newStatus === 'concluida' ? 'Demanda concluída!' : 'Demanda reaberta!');
    } catch (err) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleCreateDemanda = async () => {
    if (!newDemandaForm.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      const newId = await addDemanda({
        title: newDemandaForm.title.trim(),
        description: newDemandaForm.description.trim(),
        status: newDemandaForm.status,
        priority: newDemandaForm.priority,
        prazo: newDemandaForm.prazo || undefined,
        responsavel: newDemandaForm.responsavel?.trim() || undefined,
        createdBy: "Pedrin", // substituir por usuário real
      });

      toast.success('Demanda criada!');
      setShowCreateModal(false);

      setNewDemandaForm({
        title: '',
        description: '',
        priority: 'media',
        status: 'aberta',
        prazo: '',
        responsavel: '',
      });

      navigate(`/demandas/${newId}`);
    } catch (err) {
      toast.error('Erro ao criar demanda');
    }
  };

  const calcularPrazo = (prazoString: string) => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    let prazo: Date;
    try {
      if (prazoString.includes('T')) {
        const [ano, mes, dia] = prazoString.split('T')[0].split('-').map(Number);
        prazo = new Date(ano, mes - 1, dia);
      } else {
        const [ano, mes, dia] = prazoString.split('-').map(Number);
        prazo = new Date(ano, mes - 1, dia);
      }
      prazo.setHours(0,0,0,0);
      const diffTime = prazo.getTime() - hoje.getTime();
      const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return { diffDias, prazo };
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  if (!idParam) {
    const sortedDemandas = [...demandas].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="pt-20 lg:pl-[320px] px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                  <ListTodo className="w-12 h-12 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Demandas</h1>
                  <p className="text-zinc-400 mt-1 text-lg">
                    {sortedDemandas.length} {sortedDemandas.length === 1 ? 'demanda' : 'demandas'}
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

            {sortedDemandas.length === 0 ? (
              <Card className="text-center py-24 border-zinc-800/50 bg-zinc-900/40 rounded-2xl">
                <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-amber-500/70" />
                <h2 className="text-3xl font-bold mb-4 text-zinc-100">Nenhuma demanda ainda</h2>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Crie sua primeira demanda para começar a organizar o trabalho.
                </p>
                <Button variant="primary" size="xl" onClick={() => setShowCreateModal(true)}>
                  Criar agora
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedDemandas.map((dem) => (
                  <Card
                    key={dem.id}
                    hoverable
                    className="bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/50 hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full backdrop-blur-sm"
                    onClick={() => navigate(`/demandas/${dem.id}`)}
                  >
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-semibold text-xl text-white mb-4 line-clamp-2 leading-tight">
                        {dem.title || 'Sem título'}
                      </h3>

                      <div className="space-y-4 mt-auto">
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                          <User size={18} className="text-zinc-400" />
                          <span className="font-medium">
                            {dem.createdBy || dem.responsavel || 'Criador desconhecido'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-sm">
                          <Calendar size={18} className="text-zinc-400" />
                          {dem.prazo ? (() => {
                            const resultado = calcularPrazo(dem.prazo);
                            if (!resultado) return <span className="text-zinc-500">Prazo inválido</span>;
                            const { diffDias, prazo } = resultado;
                            let colorClass = 'text-blue-400';
                            let label = `Entrega: ${prazo.toLocaleDateString('pt-BR')}`;
                            if (dem.status === 'concluida') {
                              colorClass = 'text-emerald-400';
                              label = 'Concluída';
                            } else if (diffDias < 0) {
                              colorClass = 'text-red-500';
                              label = `Atrasada (${Math.abs(diffDias)} dia${Math.abs(diffDias) !== 1 ? 's' : ''})`;
                            } else if (diffDias <= 3) {
                              colorClass = 'text-yellow-400';
                              label = `Entrega em ${diffDias} dia${diffDias !== 1 ? 's' : ''}`;
                            }
                            return <span className={`${colorClass} font-medium`}>{label}</span>;
                          })() : (
                            <span className="text-zinc-500">Sem prazo definido</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                              {
                                aberta: 'bg-blue-900/40 text-blue-300 border border-blue-700/30',
                                'em-progresso': 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/30',
                                concluida: 'bg-green-900/40 text-green-300 border border-green-700/30',
                                bloqueada: 'bg-red-900/40 text-red-300 border border-red-700/30',
                              }[dem.status] || 'bg-zinc-800 text-zinc-400 border border-zinc-700/30'
                            }`}
                          >
                            {t(dem.status) || dem.status}
                          </span>

                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                              {
                                urgente: 'bg-red-900/40 text-red-300 border border-red-700/30',
                                alta: 'bg-orange-900/40 text-orange-300 border border-orange-700/30',
                                media: 'bg-amber-900/40 text-amber-300 border border-amber-700/30',
                                baixa: 'bg-green-900/40 text-green-300 border border-green-700/30',
                              }[dem.priority] || 'bg-zinc-800 text-zinc-400 border border-zinc-700/30'
                            }`}
                          >
                            {t(dem.priority) || dem.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

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
                      value={newDemandaForm.priority}
                      onChange={(e) => setNewDemandaForm({ ...newDemandaForm, priority: e.target.value as any })}
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
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCreateDemanda}
                    disabled={!newDemandaForm.title.trim()}
                  >
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

  if (!demanda) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 px-6">
        <AlertTriangle className="w-24 h-24 text-red-500 mb-8 opacity-80" />
        <h2 className="text-4xl font-bold mb-4">{t('erro') || 'Erro'}</h2>
        <p className="text-xl text-center max-w-lg mb-10">
          Demanda não encontrada ou ID inválido.
        </p>
        <Button variant="primary" size="xl" asChild>
          <Link to="/demandas">Voltar para Demandas</Link>
        </Button>
      </div>
    );
  }

  const prioridadeColor = {
    urgente: 'text-red-400 bg-red-950/40 border-red-800/50',
    alta: 'text-orange-400 bg-orange-950/40 border-orange-800/50',
    media: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    baixa: 'text-green-400 bg-green-950/40 border-green-800/50',
  }[demanda.priority] || 'text-zinc-400 bg-zinc-900/40 border-zinc-700/50';

  const statusColor = {
    concluida: 'text-green-400 bg-green-950/40 border-green-800/50',
    'em-progresso': 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    aberta: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    bloqueada: 'text-red-400 bg-red-950/40 border-red-800/50',
  }[demanda.status] || 'text-zinc-400 bg-zinc-900/40 border-zinc-700/50';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pt-20 lg:pl-[320px] px-5 sm:px-8 lg:px-10">
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
                    value={editedFields.title ?? demanda.title}
                    onChange={(e) => setEditedFields({ ...editedFields, title: e.target.value })}
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
              <Card title="Informações Principais" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Status</label>
                    {isEditing ? (
                      <select
                        value={editedFields.status ?? demanda.status}
                        onChange={(e) => setEditedFields({ ...editedFields, status: e.target.value as any })}
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
                        value={editedFields.priority ?? demanda.priority}
                        onChange={(e) => setEditedFields({ ...editedFields, priority: e.target.value as any })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    ) : (
                      <div className={`inline-flex px-5 py-2 rounded-full font-medium ${prioridadeColor}`}>
                        {t(demanda.priority) || demanda.priority}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Responsável</label>
                    {isEditing ? (
                      <input
                        value={editedFields.assignee ?? demanda.assignee ?? ''}
                        onChange={(e) => setEditedFields({ ...editedFields, assignee: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                        placeholder="Nome ou email"
                      />
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.assignee || 'Não atribuído'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Prazo</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedFields.prazo ?? demanda.prazo ?? ''}
                        onChange={(e) => setEditedFields({ ...editedFields, prazo: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.prazo ? (() => {
                        const [ano, mes, dia] = demanda.prazo.split('T')[0].split('-').map(Number);
                        const prazo = new Date(ano, mes - 1, dia);
                        return prazo.toLocaleDateString('pt-BR');
                      })() : 'Sem prazo'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Descrição" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
                {isEditing ? (
                  <textarea
                    value={editedFields.description ?? demanda.description ?? ''}
                    onChange={(e) => setEditedFields({ ...editedFields, description: e.target.value })}
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

          {tab === 'chat' && (
            <Card title="Chat da Demanda" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl flex flex-col h-[calc(100vh-180px)]">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-950"
              >
                {filteredChat.length === 0 && selectedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <MessageSquare className="w-20 h-20 mb-6 opacity-60" />
                    <p className="text-2xl font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-base mt-3 opacity-80">Inicie a conversa</p>
                  </div>
                ) : (
                  <>
                    {filteredChat.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[80%] rounded-2xl px-5 py-4 text-base
                            ${msg.senderId === 'current-user'
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
                    ))}

                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-indigo-600/20 border border-indigo-500/30 relative">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="max-h-48 rounded-lg object-contain"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <video
                              src={URL.createObjectURL(file)}
                              controls
                              className="max-h-48 rounded-lg"
                            />
                          ) : (
                            <p className="text-zinc-200">Arquivo: {file.name}</p>
                          )}
                          <button
                            onClick={() => removeFilePreview(idx)}
                            className="absolute top-2 right-2 bg-zinc-900/80 rounded-full p-1 hover:bg-red-600/80"
                          >
                            <X size={16} />
                          </button>
                          <p className="text-xs text-zinc-400 mt-2 text-right">
                            {file.name} • {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-zinc-800 p-4 bg-zinc-900/90">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer p-3 hover:bg-zinc-800 rounded-full transition-colors">
                    <Paperclip className="w-6 h-6 text-zinc-400" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

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
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                  />

                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'notas' && (
            <Card title="Notas Internas" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
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

          {tab === 'anexos' && (
            <Card title="Anexos e Documentos" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
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
            <Card title="Histórico de Alterações" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
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