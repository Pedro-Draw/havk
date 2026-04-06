// pages/Objetivos.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Target,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  X as CloseIcon,
  Calendar,
  User,
  FileText,
  Save,
  Loader2,
  Archive,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import { format, isPast, parseISO, isValid, addDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Tooltip from '../components/ui/Tooltip';
import DropdownMenu from '../components/ui/dropdown-menu';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/textarea';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

interface Objetivo {
  id: string;
  title: string;
  description?: string;
  progress: number;
  deadline: string; // 'YYYY-MM-DD'
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'archived';
  createdAt: string;
  updatedAt?: string;
  owner?: { id: string; name: string };
  tags?: string[];
}

interface User {
  id: string;
  name: string;
}

export default function ObjetivosPage() {
  const { t, language } = useTranslation();
  const locale = language === 'pt-BR' ? ptBR : enUS;

  const {
    objetivos: rawObjetivos = [],
    addObjetivo,
    updateObjetivo,
    deleteObjetivo,
    isLoading,
  } = useAppStore();

  // Lista de usuários para atribuição de objetivos
  const users: User[] = [
    { id: '1', name: 'Você (Pedro)' },
    { id: '2', name: 'João Silva' },
    { id: '3', name: 'Maria Oliveira' },
    { id: '4', name: 'Equipe de Suporte' },
    { id: '5', name: 'Ana Costa' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showConfetti, setShowConfetti] = useState(false);

  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedObjetivo, setSelectedObjetivo] = useState<Objetivo | null>(null);
  const [formData, setFormData] = useState<Partial<Objetivo>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const objetivosProcessados = useMemo(() => {
    return rawObjetivos.map((obj) => {
      const deadlineDate = parseISO(obj.deadline || new Date().toISOString().split('T')[0]);
      let status: Objetivo['status'] = 'in_progress';

      if ((obj.progress ?? 0) >= 100) {
        status = 'completed';
      } else if (isPast(deadlineDate) && (obj.progress ?? 0) < 100) {
        status = 'overdue';
      } else if ((obj.progress ?? 0) === 0) {
        status = 'not_started';
      } else if (obj.status === 'archived') {
        status = 'archived';
      }

      return { ...obj, status };
    });
  }, [rawObjetivos]);

  const summary = useMemo(() => {
    const total = objetivosProcessados.length;
    const completed = objetivosProcessados.filter((o) => o.status === 'completed').length;
    const inProgress = objetivosProcessados.filter((o) => o.status === 'in_progress').length;
    const overdue = objetivosProcessados.filter((o) => o.status === 'overdue').length;
    const notStarted = objetivosProcessados.filter((o) => o.status === 'not_started').length;
    const archived = objetivosProcessados.filter((o) => o.status === 'archived').length;
    const averageProgress = total > 0 ? objetivosProcessados.reduce((acc, o) => acc + (o.progress ?? 0), 0) / total : 0;

    return { total, completed, inProgress, overdue, notStarted, archived, averageProgress };
  }, [objetivosProcessados]);

  const filteredAndSorted = useMemo(() => {
    let result = [...objetivosProcessados];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (obj) =>
          obj.title.toLowerCase().includes(lowerTerm) ||
          (obj.description ?? '').toLowerCase().includes(lowerTerm) ||
          (obj.tags ?? []).some((tag) => tag.toLowerCase().includes(lowerTerm)) ||
          (obj.owner?.name ?? '').toLowerCase().includes(lowerTerm)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter((obj) => obj.status === filterStatus);
    }

    result.sort((a, b) => {
      let compare = 0;
      if (sortBy === 'deadline') {
        compare = parseISO(a.deadline || "2099-01-01").getTime() - parseISO(b.deadline || "2099-01-01").getTime();
      } else if (sortBy === 'progress') {
        compare = (a.progress ?? 0) - (b.progress ?? 0);
      } else if (sortBy === 'title') {
        compare = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? compare : -compare;
    });

    return result;
  }, [objetivosProcessados, searchTerm, filterStatus, sortBy, sortOrder]);

  const formatarData = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return dateStr;
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale });
    } catch {
      return dateStr;
    }
  };

  const getStatusConfig = (status?: Objetivo['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: t('concluido'),
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          progressColor: 'bg-emerald-500',
        };
      case 'overdue':
        return {
          label: t('atrasado'),
          icon: AlertCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          progressColor: 'bg-rose-500',
        };
      case 'not_started':
        return {
          label: t('naoIniciado'),
          icon: Clock,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          progressColor: 'bg-amber-500',
        };
      case 'archived':
        return {
          label: t('arquivado'),
          icon: Archive,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          progressColor: 'bg-gray-500',
        };
      default:
        return {
          label: t('emAndamento'),
          icon: BarChart3,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          progressColor: 'bg-blue-500',
        };
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setFormData({
      title: '',
      description: '',
      progress: 0,
      deadline: addDays(new Date(), 30).toISOString().split('T')[0],
      tags: [],
      owner: undefined,
    });
    setFormErrors({});
  };

  const openEditModal = (obj: Objetivo) => {
    setModalType('edit');
    setSelectedObjetivo(obj);
    setFormData({ ...obj });
    setFormErrors({});
  };

  const openDeleteModal = (obj: Objetivo) => {
    setModalType('delete');
    setSelectedObjetivo(obj);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedObjetivo(null);
    setFormData({});
    setFormErrors({});
    setIsSubmitting(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      errors.title = t('campoObrigatorio') || 'Campo obrigatório';
    }
    if (!formData.deadline || !isValid(parseISO(formData.deadline))) {
      errors.deadline = t('dataInvalida') || 'Data inválida';
    }
    if (formData.progress !== undefined && (formData.progress < 0 || formData.progress > 100)) {
      errors.progress = t('progressoInvalido') || 'Progresso deve estar entre 0 e 100';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Corrija os campos obrigatórios destacados');
      return;
    }

    setIsSubmitting(true);

    try {
      console.group(`[${modalType?.toUpperCase() || 'UNKNOWN'}] Tentativa de salvar`);
      console.log('Dados atuais do formData:', formData);

      if (modalType === 'create') {
        const newObj = {
          title: formData.title!.trim(),
          description: formData.description?.trim() || undefined,
          progress: formData.progress ?? 0,
          deadline: formData.deadline!,
          tags: formData.tags?.length ? formData.tags : undefined,
          owner: formData.owner,
        };

        console.log('Objeto que será enviado para addObjetivo:', newObj);
        await addObjetivo(newObj as any);
        console.log('addObjetivo executado com sucesso');

        toast.success('Objetivo criado com sucesso!');
        if (newObj.progress >= 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else if (modalType === 'edit' && selectedObjetivo) {
        const updates = {
          title: formData.title?.trim(),
          description: formData.description?.trim() || undefined,
          progress: formData.progress,
          deadline: formData.deadline,
          tags: formData.tags?.length ? formData.tags : undefined,
          owner: formData.owner,
          status: formData.status,
        };

        console.log('Objeto de atualização enviado para updateObjetivo:', updates);
        await updateObjetivo(selectedObjetivo.id, updates);
        console.log('updateObjetivo executado com sucesso');

        toast.success('Objetivo atualizado com sucesso!');
        if ((formData.progress ?? 0) >= 100 && (selectedObjetivo.progress ?? 0) < 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else if (modalType === 'delete' && selectedObjetivo) {
        console.log('ID a ser deletado:', selectedObjetivo.id);
        await deleteObjetivo(selectedObjetivo.id);
        console.log('deleteObjetivo executado com sucesso');
        toast.success('Objetivo excluído com sucesso');
      }

      console.groupEnd();
      closeModal();
    } catch (err: any) {
      console.group('ERRO AO SALVAR OBJETIVO');
      console.error('Erro completo:', err);
      console.error('Mensagem:', err.message || 'Sem mensagem detalhada');
      console.error('Stack trace:', err.stack);
      console.groupEnd();

      toast.error(err.message || 'Falha ao salvar. Abra o console (F12) para ver detalhes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressUpdate = async (obj: Objetivo, delta: number) => {
    const newProgress = Math.min(Math.max(obj.progress + delta, 0), 100);
    try {
      await updateObjetivo(obj.id, { progress: newProgress });
      if (newProgress >= 100 && obj.progress < 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success('Objetivo concluído! 🎉');
      }
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      toast.error('Erro ao atualizar progresso');
    }
  };

  const handleArchive = async (obj: Objetivo) => {
    try {
      await updateObjetivo(obj.id, { status: 'archived' });
      toast.success('Objetivo arquivado com sucesso');
    } catch (err) {
      console.error('Erro ao arquivar:', err);
      toast.error('Erro ao arquivar objetivo');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Título', 'Descrição', 'Progresso', 'Prazo', 'Status', 'Tags', 'Proprietário', 'Criado Em'];
    const rows = objetivosProcessados.map((obj) => [
      obj.id,
      obj.title,
      obj.description || '',
      obj.progress,
      obj.deadline,
      obj.status || 'in_progress',
      obj.tags?.join(', ') || '',
      obj.owner?.name || 'Sem proprietário',
      obj.createdAt,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'objetivos.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusOptions = [
    { value: 'all', label: t('todos') },
    { value: 'not_started', label: t('naoIniciado') },
    { value: 'in_progress', label: t('emAndamento') },
    { value: 'completed', label: t('concluido') },
    { value: 'overdue', label: t('atrasado') },
    { value: 'archived', label: t('arquivado') },
  ];

  const sortOptions = [
    { value: 'deadline', label: t('prazo') },
    { value: 'progress', label: t('progresso') },
    { value: 'title', label: t('titulo') },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />}

      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-20 space-y-10">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-zinc-800/50 p-4 shadow-lg ring-1 ring-zinc-700/30">
                <Target className="h-10 w-10 text-zinc-100" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {t('objetivosEResultados')}
                </h1>
                <p className="mt-2 text-lg text-zinc-300">
                  {t('acompanhamentoDeMetasDaEquipeEDashboardInterativo')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                icon={<FileText className="h-4 w-4" />}
                onClick={exportToCSV}
                disabled={objetivosProcessados.length === 0}
              >
                {t('exportarRelatorio')}
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="h-5 w-5" />}
                onClick={openCreateModal}
              >
                {t('novoObjetivo')}
              </Button>
            </div>
          </div>

          {/* Resumo de Estatísticas */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{summary.total}</h3>
              <p className="text-sm text-zinc-400">{t('total')}</p>
            </Card>
            <Card className="p-4 text-center bg-emerald-500/10">
              <h3 className="text-2xl font-bold text-emerald-400">{summary.completed}</h3>
              <p className="text-sm text-zinc-400">{t('concluido')}</p>
            </Card>
            <Card className="p-4 text-center bg-blue-500/10">
              <h3 className="text-2xl font-bold text-blue-400">{summary.inProgress}</h3>
              <p className="text-sm text-zinc-400">{t('emAndamento')}</p>
            </Card>
            <Card className="p-4 text-center bg-rose-500/10">
              <h3 className="text-2xl font-bold text-rose-400">{summary.overdue}</h3>
              <p className="text-sm text-zinc-400">{t('atrasado')}</p>
            </Card>
            <Card className="p-4 text-center bg-amber-500/10">
              <h3 className="text-2xl font-bold text-amber-400">{summary.notStarted}</h3>
              <p className="text-sm text-zinc-400">{t('naoIniciado')}</p>
            </Card>
            <Card className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{Math.round(summary.averageProgress)}%</h3>
              <p className="text-sm text-zinc-400">{t('progressoMedio')}</p>
            </Card>
          </div>

          {/* Filtros e busca */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder={t('buscarPorTituloDescricaoOuTag')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-zinc-400" />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={statusOptions}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-3">
              <ChevronDown className="h-5 w-5 text-zinc-400" />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                options={sortOptions}
                className="w-40"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Grid de Objetivos */}
          <AnimatePresence mode="wait">
            {filteredAndSorted.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="py-20 text-center shadow-2xl">
                  <Target className="mx-auto h-16 w-16 text-zinc-500" />
                  <h3 className="mt-6 text-2xl font-bold text-zinc-100">
                    {t('nenhumObjetivoEncontrado')}
                  </h3>
                  <p className="mt-3 text-lg text-zinc-400 max-w-lg mx-auto">
                    {t('crieSeuPrimeiroObjetivoOuAjusteFiltros')}
                  </p>
                  <Button
                    variant="primary"
                    className="mt-8 px-8"
                    icon={<Plus className="h-5 w-5" />}
                    onClick={openCreateModal}
                  >
                    {t('criarObjetivo')}
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredAndSorted.map((obj, index) => {
                  const statusConfig = getStatusConfig(obj.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={obj.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        hoverable
                        className="flex h-full flex-col overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                      >
                        <div className="flex items-start justify-between gap-4 p-6 pb-3">
                          <div className="flex-1">
                            <h3 className="line-clamp-2 text-lg font-semibold text-zinc-100">
                              {obj.title}
                            </h3>
                            {obj.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                                {obj.description}
                              </p>
                            )}
                          </div>

                          <DropdownMenu
                            trigger={
                              <button className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            }
                          >
                            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800" onClick={() => openEditModal(obj as any)}>
                              <Edit className="h-4 w-4" />{t('editar')}
                            </button>
                            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40" disabled={obj.status === 'archived'} onClick={() => handleArchive(obj as any)}>
                              <Archive className="h-4 w-4" />{t('arquivar')}
                            </button>
                            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-zinc-800" onClick={() => openDeleteModal(obj as any)}>
                              <Trash2 className="h-4 w-4" />{t('excluir')}
                            </button>
                          </DropdownMenu>
                        </div>

                        <div className="flex-1 space-y-5 px-6 pb-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-zinc-300">{t('progresso')}</span>
                              <Tooltip text={`${(obj.progress ?? 0)}% ${t('concluido')}`}>
                                <span className="text-base font-bold text-zinc-100">
                                  {(obj.progress ?? 0)}%
                                </span>
                              </Tooltip>
                            </div>
                            <ProgressBar
                              value={obj.progress ?? 0}
                              className={statusConfig.progressColor}
                            />
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="h-4 w-4" />
                                <span>{formatarData(obj.deadline || "")}</span>
                              </div>
                              {obj.owner ? (
                                <div className="flex items-center gap-2 text-zinc-400">
                                  <User className="h-4 w-4" />
                                  <span>{obj.owner.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-zinc-500 italic">
                                  <User className="h-4 w-4" />
                                  <span>Sem proprietário</span>
                                </div>
                              )}
                            </div>

                            {obj.tags && obj.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {obj.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div
                              className={cn(
                                'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium',
                                statusConfig.bg,
                                statusConfig.color
                              )}
                            >
                              <StatusIcon className="h-4 w-4" />
                              {statusConfig.label}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              fullWidth
                              disabled={obj.status === 'completed' || obj.status === 'archived'}
                              onClick={() => handleProgressUpdate(obj as any, 10)}
                            >
                              +10%
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              fullWidth
                              disabled={obj.status === 'completed' || obj.status === 'archived'}
                              onClick={() => handleProgressUpdate(obj as any, -10)}
                            >
                              -10%
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={modalType === 'create' || modalType === 'edit'}
        onClose={closeModal}
        title={modalType === 'create' ? t('novoObjetivo') : t('editarObjetivo')}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('titulo')} *
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('exAumentarProdutividade') || 'Ex: Aumentar produtividade da equipe em 30%'}
              error={formErrors.title}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('descricao')}
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('detalhesDoObjetivo') || 'Descreva o que precisa ser alcançado e como medir o sucesso...'}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('progresso')} (%)
              </label>
              <Input
                type="number"
                value={formData.progress ?? ''}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) || 0 })}
                min={0}
                max={100}
                error={formErrors.progress}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('prazo')} *
              </label>
              <Input
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                error={formErrors.deadline}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('proprietario')}
            </label>
            <Select
              value={formData.owner?.id ?? ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setFormData({ ...formData, owner: undefined });
                  return;
                }
                const selectedUser = users.find((u) => u.id === selectedId);
                setFormData({ ...formData, owner: selectedUser });
              }}
              options={[
                { value: '', label: '— Sem proprietário —' },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('tags')} (separadas por vírgula)
            </label>
            <Input
              value={(formData.tags ?? []).join(', ')}
              onChange={(e) => {
                const inputValue = e.target.value;
                const newTags = inputValue
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0);
                setFormData({ ...formData, tags: newTags });
              }}
              placeholder="ex: produtividade, equipe, urgente, Q1, marketing"
            />
            {(formData.tags ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(formData.tags ?? []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const updatedTags = (formData.tags ?? []).filter((_, i) => i !== idx);
                        setFormData({ ...formData, tags: updatedTags });
                      }}
                      className="ml-1 text-zinc-400 hover:text-red-400 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {modalType === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('status')}
              </label>
              <Select
                value={formData.status || 'in_progress'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={statusOptions.filter((o) => o.value !== 'all')}
                className="w-full"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              {t('cancelar')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {isSubmitting ? (t('salvando') || 'Salvando...') : (t('salvar') || 'Salvar')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        title={t('confirmarExclusao') || 'Confirmar exclusão'}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-zinc-300">
            {t('temCertezaQueDesejaExcluir') || 'Tem certeza que deseja excluir'}{' '}
            <span className="font-medium">{selectedObjetivo?.title}</span>?
            {(selectedObjetivo?.progress ?? 0) > 0 && (
              <span className="block mt-2 text-sm text-amber-400">
                Progresso atual: {selectedObjetivo?.progress ?? 0}%
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              {t('cancelar')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            >
              {isSubmitting ? (t('excluindo') || 'Excluindo...') : (t('excluir') || 'Excluir')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}