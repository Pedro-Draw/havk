// src/pages/DemandaDetail.tsx
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
  Search,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export type DemandaTipo = 'bug' | 'feature' | 'melhoria' | 'inovacao' | 'outro';
type Dificuldade = 'muito-facil' | 'facil' | 'media' | 'dificil' | 'muito-dificil';

interface Anexo {
  id: string;
  demandaId: string;
  name: string;
  type: string;
  data: string; // base64
  size: number;
  uploadedAt: string;
}

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anexos temporários (só durante edição)
  const [tempAnexos, setTempAnexos] = useState<Anexo[]>([]);
  // Anexos salvos da demanda
  const [savedAnexos, setSavedAnexos] = useState<Anexo[]>([]);

  const [nota, setNota] = useState('');
  const [notaOriginal, setNotaOriginal] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [originalDemanda, setOriginalDemanda] = useState<any>(null);
  const [editedFields, setEditedFields] = useState<Partial<any>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDemandaForm, setNewDemandaForm] = useState({
    title: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'aberta' as 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada',
    prazo: '',
    responsavel: '',
    tipo: 'feature' as DemandaTipo,
    dificuldade: 'media' as Dificuldade,
    esforcoEstimado: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [priorityFilter, setPriorityFilter] = useState('todos');

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
  }, [filteredChat]);

  useEffect(() => {
    if (demanda) {
      setOriginalDemanda({ ...demanda });
      setEditedFields({ ...demanda });
      setSavedAnexos(demanda.anexos || []);
      setTempAnexos([]);
    }
  }, [demanda]);

  // Aviso ao tentar fechar aba ou refresh enquanto edita
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  // Função wrapper para navegação protegida
  const protectedNavigate = (to: string) => {
    if (isEditing) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja sair sem salvar ou cancelar?'
      );
      if (confirmed) {
        // Se confirmar, limpa o estado de edição antes de navegar
        setIsEditing(false);
        setTempAnexos([]);
        navigate(to);
      }
      // Se não confirmar, não navega
    } else {
      navigate(to);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !idParam) return;

    try {
      await addChatMensagem({
        message: newMessage.trim(),
        demandaId: idParam,
        senderId: 'current-user',
        channel: 'demanda',
      });
      setNewMessage('');
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
      console.error(err);
    }
  };

  const handleTempAnexoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !idParam) return;

    const files = Array.from(e.target.files);
    const novosTemp: Anexo[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const novoAnexo: Anexo = {
          id: crypto.randomUUID(),
          demandaId: idParam,
          name: file.name,
          type: file.type,
          data: base64,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
        novosTemp.push(novoAnexo);
        if (novosTemp.length === files.length) {
          setTempAnexos(prev => [...prev, ...novosTemp]);
          toast.success(`${files.length} arquivo(s) adicionado(s) — serão salvos ao clicar Salvar`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeTempAnexo = (id: string) => {
    setTempAnexos(prev => prev.filter(a => a.id !== id));
    toast.success('Anexo temporário removido');
  };

  const handleSaveNota = async () => {
    if (!idParam || nota.trim() === notaOriginal.trim()) return;

    try {
      if (existingNota) {
        await updateNota(existingNota.id, { content: nota.trim() });
      } else if (nota.trim()) {
        await addNota({
          content: nota.trim(),
          demandaId: idParam,
        });
      }
      setNotaOriginal(nota);
      toast.success('Nota salva com sucesso');
    } catch (err) {
      toast.error('Erro ao salvar nota');
      console.error(err);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      if (originalDemanda) {
        setEditedFields({ ...originalDemanda });
        setSavedAnexos(originalDemanda.anexos || []);
      }
      setTempAnexos([]);
      setIsEditing(false);
      toast('Edição cancelada');
    } else if (demanda) {
      setOriginalDemanda({ ...demanda });
      setEditedFields({ ...demanda });
      setTempAnexos([]);
      setIsEditing(true);
    }
  };

  const handleSaveDemanda = async () => {
    if (!demanda || !idParam) return;

    try {
      const anexosAtualizados = [...(demanda.anexos || []), ...tempAnexos];

      await updateDemanda(idParam, {
        ...editedFields,
        anexos: anexosAtualizados,
        updatedAt: new Date().toISOString(),
      });

      setTempAnexos([]);
      setSavedAnexos(anexosAtualizados);
      setIsEditing(false);
      toast.success('Demanda atualizada');
      setTimeout(() => navigate(`/demandas/${idParam}`, { replace: true }), 200);
    } catch (err) {
      toast.error('Erro ao salvar alterações');
      console.error(err);
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
      console.error(err);
    }
  };

  const handleCreateDemanda = async () => {
    if (!newDemandaForm.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      const newDemanda = {
        ...newDemandaForm,
        id: crypto.randomUUID(),
        createdBy: 'Pedrin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        anexos: [],
      };

      const newId = await addDemanda(newDemanda);

      toast.success('Demanda criada com sucesso!');
      setShowCreateModal(false);

      setNewDemandaForm({
        title: '',
        description: '',
        priority: 'media',
        status: 'aberta',
        prazo: '',
        responsavel: '',
        tipo: 'feature',
        dificuldade: 'media',
        esforcoEstimado: 0,
      });

      setTimeout(() => {
        navigate(`/demandas/${newId}`, { replace: true });
      }, 400);
    } catch (err) {
      toast.error('Erro ao criar nova demanda');
      console.error(err);
    }
  };

  const parsePrazoDate = (prazoStr?: string): Date | null => {
    if (!prazoStr) return null;
    try {
      const datePart = prazoStr.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatPrazo = (prazoStr?: string): string => {
    const date = parsePrazoDate(prazoStr);
    return date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sem prazo definido';
  };

  const calcularDiasParaPrazo = (prazoStr?: string): number | null => {
    const prazoDate = parsePrazoDate(prazoStr);
    if (!prazoDate) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffMs = prazoDate.getTime() - hoje.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getPrazoInfo = (prazo?: string, status?: string) => {
    if (status === 'concluida') {
      return { label: 'Concluída', colorClass: 'text-emerald-400' };
    }

    const diffDias = calcularDiasParaPrazo(prazo);
    const formatted = formatPrazo(prazo);

    if (diffDias === null) {
      return { label: 'Sem prazo definido', colorClass: 'text-zinc-500' };
    }

    if (diffDias < 0) {
      return {
        label: `Atrasada (${Math.abs(diffDias)} dia${Math.abs(diffDias) !== 1 ? 's' : ''})`,
        colorClass: 'text-red-500',
      };
    }

    if (diffDias <= 3) {
      return {
        label: diffDias === 0 ? 'Entrega hoje' : `Entrega em ${diffDias} dia${diffDias !== 1 ? 's' : ''}`,
        colorClass: 'text-yellow-400',
      };
    }

    return { label: `Entrega: ${formatted}`, colorClass: 'text-blue-400' };
  };

  const filteredDemandas = demandas
    .filter(dem => {
      const matchSearch =
        dem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dem.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || dem.status === statusFilter;
      const matchPriority = priorityFilter === 'todos' || dem.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tipoColors = {
    bug: 'bg-red-900/50 text-red-300 border-red-700/50',
    feature: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    melhoria: 'bg-green-900/50 text-green-300 border-green-700/50',
    inovacao: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
    outro: 'bg-zinc-800/70 text-zinc-300 border-zinc-700/50',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-500" />
      </div>
    );
  }

  if (!idParam) {
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
                    {filteredDemandas.length} {filteredDemandas.length === 1 ? 'demanda' : 'demandas'}
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

            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 min-w-[180px]"
              >
                <option value="todos">Todos os status</option>
                <option value="aberta">Aberta</option>
                <option value="em-progresso">Em progresso</option>
                <option value="concluida">Concluída</option>
                <option value="bloqueada">Bloqueada</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 min-w-[180px]"
              >
                <option value="todos">Todas as prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {filteredDemandas.length === 0 ? (
              <Card className="text-center py-24 border-zinc-800/50 bg-zinc-900/40 rounded-2xl">
                <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-amber-500/70" />
                <h2 className="text-3xl font-bold mb-4 text-zinc-100">Nenhuma demanda encontrada</h2>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Ajuste os filtros ou crie uma nova demanda.
                </p>
                <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
                  Criar agora
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDemandas.map((dem, idx) => {
                  const { label, colorClass } = getPrazoInfo(dem.prazo, dem.status);
                  const uniqueKey = dem.id || `demanda-fallback-${idx}`;

                  return (
                    <Card
                      key={uniqueKey}
                      hoverable
                      className="bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/50 hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full backdrop-blur-sm"
                      onClick={() => protectedNavigate(`/demandas/${dem.id}`)}
                    >
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-semibold text-xl text-white mb-4 line-clamp-2 leading-tight">
                          {dem.title || 'Sem título'}
                        </h3>

                        <div className="space-y-4 mt-auto">
                          <div className="flex items-center gap-3 text-sm text-zinc-300">
                            <User size={18} className="text-zinc-400" />
                            <span className="font-medium">
                              {dem.responsavel || 'Criador desconhecido'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-sm">
                            <Calendar size={18} className="text-zinc-400" />
                            <span className={`${colorClass} font-medium`}>{label}</span>
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

                            {dem.tipo && (
                              <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${tipoColors[dem.tipo as DemandaTipo]}`}>
                                {dem.tipo.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
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
                    onChange={e => setNewDemandaForm({ ...newDemandaForm, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Ex: Implementar funcionalidade X"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2 font-medium">Descrição</label>
                  <textarea
                    value={newDemandaForm.description}
                    onChange={e => setNewDemandaForm({ ...newDemandaForm, description: e.target.value })}
                    className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none"
                    placeholder="Detalhes, requisitos, observações..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Tipo</label>
                    <select
                      value={newDemandaForm.tipo}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, tipo: e.target.value as DemandaTipo })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="bug">Bug / Erro</option>
                      <option value="feature">Nova Feature</option>
                      <option value="melhoria">Melhoria</option>
                      <option value="inovacao">Inovação</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Dificuldade</label>
                    <select
                      value={newDemandaForm.dificuldade}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, dificuldade: e.target.value as Dificuldade })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="muito-facil">Muito Fácil</option>
                      <option value="facil">Fácil</option>
                      <option value="media">Média</option>
                      <option value="dificil">Difícil</option>
                      <option value="muito-dificil">Muito Difícil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Prioridade</label>
                    <select
                      value={newDemandaForm.priority}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, priority: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Esforço estimado (horas)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newDemandaForm.esforcoEstimado}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, esforcoEstimado: Number(e.target.value) || 0 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Prazo</label>
                    <input
                      type="date"
                      value={newDemandaForm.prazo}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, prazo: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2 font-medium">Responsável</label>
                    <input
                      type="text"
                      value={newDemandaForm.responsavel}
                      onChange={e => setNewDemandaForm({ ...newDemandaForm, responsavel: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      placeholder="Nome ou email"
                    />
                  </div>
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
        <Button variant="primary" size="lg">
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

  const { label: prazoLabel, colorClass: prazoColorClass } = getPrazoInfo(demanda.prazo, demanda.status);

  const renderMessage = (msg: string) => {
    const parts = msg.split(/(@[\w]+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? <span key={i} className="text-blue-400 font-medium">{part}</span> : part
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pt-20 lg:pl-[320px] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl pb-24">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
            <div className="flex items-start gap-5">
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 hover:bg-zinc-800 rounded-xl"
                onClick={() => protectedNavigate('/demandas')}
              >
                <ArrowLeft className="w-8 h-8" />
              </Button>

              <div className="flex-1">
                {isEditing ? (
                  <input
                    value={editedFields.title ?? demanda.title}
                    onChange={e => setEditedFields({ ...editedFields, title: e.target.value })}
                    className="text-3xl md:text-4xl font-bold bg-zinc-900/80 border border-zinc-700 rounded-xl px-5 py-3 w-full focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Título da Demanda"
                  />
                ) : (
                  <h1 className="text-3xl md:text-5xl font-bold break-words leading-tight">
                    {translateUserContent(demanda.title || 'Sem título')}
                  </h1>
                )}
                <div className="mt-3 flex flex-wrap gap-6 text-sm text-zinc-300">
                  <div>Criado por: <span className="text-zinc-100">{demanda.createdBy || '—'}</span></div>
                  <div>Responsável: <span className="text-zinc-100">{demanda.responsavel || 'Não atribuído'}</span></div>
                </div>
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

          {/* Tabs - também protegidas */}
          <div className="flex overflow-x-auto border-b border-zinc-800/80 mb-10 scrollbar-hide">
            {['detalhes', 'chat', 'notas', 'anexos', 'historico'].map(key => (
              <button
                key={key}
                onClick={() => {
                  if (isEditing) {
                    const confirmed = window.confirm(
                      'Você tem alterações não salvas. Deseja mudar de aba sem salvar ou cancelar?'
                    );
                    if (confirmed) {
                      setIsEditing(false);
                      setTempAnexos([]);
                      setTab(key as any);
                    }
                  } else {
                    setTab(key as any);
                  }
                }}
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
                {key === 'anexos' && <Paperclip className="w-5 h-5" />}
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
                        onChange={e => setEditedFields({ ...editedFields, status: e.target.value })}
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
                        onChange={e => setEditedFields({ ...editedFields, priority: e.target.value })}
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
                        value={editedFields.responsavel ?? demanda.responsavel ?? ''}
                        onChange={e => setEditedFields({ ...editedFields, responsavel: e.target.value })}
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
                        value={editedFields.prazo ?? demanda.prazo ?? ''}
                        onChange={e => setEditedFields({ ...editedFields, prazo: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    ) : (
                      <div className={`text-lg font-medium ${prazoColorClass}`}>
                        {prazoLabel}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Tipo</label>
                    {isEditing ? (
                      <select
                        value={editedFields.tipo ?? demanda.tipo ?? 'feature'}
                        onChange={e => setEditedFields({ ...editedFields, tipo: e.target.value as DemandaTipo })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="bug">Bug / Erro</option>
                        <option value="feature">Nova Feature</option>
                        <option value="melhoria">Melhoria</option>
                        <option value="inovacao">Inovação</option>
                        <option value="outro">Outro</option>
                      </select>
                    ) : (
                      <div className={`inline-flex px-5 py-2 rounded-full font-medium ${tipoColors[demanda.tipo as DemandaTipo] || 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                        {demanda.tipo ? demanda.tipo.charAt(0).toUpperCase() + demanda.tipo.slice(1) : 'Não definido'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Dificuldade</label>
                    {isEditing ? (
                      <select
                        value={editedFields.dificuldade ?? demanda.dificuldade ?? 'media'}
                        onChange={e => setEditedFields({ ...editedFields, dificuldade: e.target.value as Dificuldade })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      >
                        <option value="muito-facil">Muito Fácil</option>
                        <option value="facil">Fácil</option>
                        <option value="media">Média</option>
                        <option value="dificil">Difícil</option>
                        <option value="muito-dificil">Muito Difícil</option>
                      </select>
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.dificuldade ? demanda.dificuldade.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Não definida'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2 font-medium">Esforço estimado</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editedFields.esforcoEstimado ?? demanda.esforcoEstimado ?? 0}
                        onChange={e => setEditedFields({ ...editedFields, esforcoEstimado: Number(e.target.value) || 0 })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    ) : (
                      <div className="text-lg font-medium">
                        {demanda.esforcoEstimado ? `${demanda.esforcoEstimado} h` : 'Não estimado'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Descrição" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
                {isEditing ? (
                  <textarea
                    value={editedFields.description ?? demanda.description ?? ''}
                    onChange={e => setEditedFields({ ...editedFields, description: e.target.value })}
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
                {filteredChat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <MessageSquare className="w-20 h-20 mb-6 opacity-60" />
                    <p className="text-2xl font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-base mt-3 opacity-80">Inicie a conversa</p>
                  </div>
                ) : (
                  filteredChat.map(msg => (
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
                        <p className="text-zinc-200 leading-relaxed">{renderMessage(msg.message)}</p>

                        <p className="text-xs text-zinc-500 mt-2 text-right opacity-80">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-800 p-4 bg-zinc-900/90">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem... (use @ para mencionar)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                  />

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Anexos são gerenciados apenas na aba Anexos
                </p>
              </div>
            </Card>
          )}

          {tab === 'notas' && (
            <Card title="Notas Internas" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                className="w-full h-80 bg-zinc-950 border border-zinc-700 rounded-xl p-6 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none font-mono text-base leading-relaxed"
                placeholder="Escreva notas internas, lembretes, ideias..."
              />

              <div className="mt-8 flex justify-end gap-5">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setNota(notaOriginal)}
                  disabled={nota.trim() === notaOriginal.trim()}
                >
                  Descartar
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveNota}
                  disabled={nota.trim() === notaOriginal.trim()}
                >
                  Salvar Notas
                </Button>
              </div>
            </Card>
          )}

          {tab === 'anexos' && (
            <Card title="Anexos e Documentos" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
              <div className="mb-8">
                <label
                  className={`cursor-pointer inline-flex items-center gap-3 px-6 py-4 rounded-xl transition-colors ${
                    isEditing
                      ? 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'
                      : 'bg-zinc-800/50 border border-zinc-700 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      toast('Entre no modo edição para adicionar anexos');
                    }
                  }}
                >
                  <Paperclip className="w-6 h-6 text-zinc-300" />
                  <span className="font-medium">Adicionar arquivos</span>
                  {isEditing && (
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleTempAnexoUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                  )}
                </label>
              </div>

              {(savedAnexos.length === 0 && tempAnexos.length === 0) ? (
                <div className="text-center py-20 text-zinc-500">
                  <FileText className="w-24 h-24 mx-auto mb-8 opacity-60" />
                  <p className="text-3xl font-medium mb-4">Nenhum anexo ainda</p>
                  <p className="text-lg">
                    {isEditing ? 'Adicione arquivos acima' : 'Entre no modo edição para adicionar anexos'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedAnexos.map(anexo => (
                    <div key={anexo.id} className="relative group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {anexo.type.startsWith('image/') ? (
                        <img src={anexo.data} alt={anexo.name} className="w-full h-48 object-cover" />
                      ) : anexo.type.startsWith('video/') ? (
                        <video src={anexo.data} controls className="w-full h-48 object-cover" />
                      ) : (
                        <div className="h-48 flex items-center justify-center bg-zinc-800">
                          <FileText className="w-16 h-16 text-zinc-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-medium truncate">{anexo.name}</p>
                        <p className="text-sm text-zinc-500">
                          {(anexo.size / 1024 / 1024).toFixed(2)} MB • {new Date(anexo.uploadedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isEditing && tempAnexos.map(anexo => (
                    <div key={anexo.id} className="relative group bg-zinc-900/70 border border-zinc-700 rounded-xl overflow-hidden opacity-80">
                      {anexo.type.startsWith('image/') ? (
                        <img src={anexo.data} alt={anexo.name} className="w-full h-48 object-cover" />
                      ) : anexo.type.startsWith('video/') ? (
                        <video src={anexo.data} controls className="w-full h-48 object-cover" />
                      ) : (
                        <div className="h-48 flex items-center justify-center bg-zinc-800">
                          <FileText className="w-16 h-16 text-zinc-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-medium truncate">{anexo.name} (temporário)</p>
                        <p className="text-sm text-zinc-500">
                          {(anexo.size / 1024 / 1024).toFixed(2)} MB • Novo
                        </p>
                      </div>
                      <button
                        onClick={() => removeTempAnexo(anexo.id)}
                        className="absolute top-2 right-2 bg-red-600/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'historico' && (
            <Card title="Histórico de Alterações" className="border-zinc-800/60 bg-zinc-900/70 rounded-2xl">
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-zinc-800">
                  <div className="p-3 bg-indigo-500/20 rounded-full">
                    <Plus className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium">Demanda criada</p>
                    <p className="text-sm text-zinc-500">
                      {new Date(demanda.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>

                {demanda.updatedAt && demanda.updatedAt !== demanda.createdAt && (
                  <div className="flex items-start gap-4 pb-4 border-b border-zinc-800">
                    <div className="p-3 bg-amber-500/20 rounded-full">
                      <Edit className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">Demanda atualizada</p>
                      <p className="text-sm text-zinc-500">
                        {new Date(demanda.updatedAt).toLocaleString('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {demanda.status === 'concluida' && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Demanda concluída</p>
                      <p className="text-sm text-zinc-500">
                        {new Date(demanda.updatedAt || demanda.createdAt).toLocaleString('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {(!demanda.updatedAt || demanda.updatedAt === demanda.createdAt) &&
                  demanda.status !== 'concluida' && (
                    <p className="text-zinc-500 text-center py-8">
                      Nenhuma alteração registrada após a criação.
                    </p>
                  )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}