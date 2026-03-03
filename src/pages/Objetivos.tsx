import { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import { format, isPast, parseISO, isValid, addDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Tooltip from '../components/ui/Tooltip';
import DropdownMenu from '../components/ui/dropdown-menu.tsx';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/textarea.tsx';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';

// Tipagem forte e expandida
interface Objetivo {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0–100
  deadline: string; // ISO 'YYYY-MM-DD'
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'archived';
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string };
  tags?: string[];
}

// Fake API interna (simula delays e CRUD sem backend real)
const fakeApi = {
  async fetchObjetivos(): Promise<Objetivo[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockObjetivos);
      }, 500);
    });
  },
  async createObjetivo(newObj: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Objetivo> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = crypto.randomUUID();
        resolve({
          ...newObj,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: newObj.progress > 0 ? 'in_progress' : 'not_started',
        });
      }, 800);
    });
  },
  async updateObjetivo(updated: Objetivo): Promise<Objetivo> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...updated,
          updatedAt: new Date().toISOString(),
        });
      }, 600);
    });
  },
  async deleteObjetivo(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
  },
};

// Mock data expandido
const mockObjetivos: Objetivo[] = [
  {
    id: '1',
    title: 'Aumentar produtividade da equipe em 30%',
    description: 'Implementar novas ferramentas e treinamentos para otimizar workflows.',
    progress: 65,
    deadline: '2026-06-30',
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-02-20T14:30:00Z',
    owner: { id: 'user1', name: 'Pedro Silva' },
    tags: ['produtividade', 'equipe'],
  },
  {
    id: '2',
    title: 'Concluir 100 demandas no 1º trimestre',
    description: 'Priorizar backlog e alocar recursos adequadamente.',
    progress: 42,
    deadline: '2026-03-31',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-02-15T16:45:00Z',
    owner: { id: 'user2', name: 'Ana Oliveira' },
    tags: ['demandas', 'trimestre'],
  },
  {
    id: '3',
    title: 'Implementar OKRs na squad de produto',
    description: 'Definir objetivos chave e resultados mensuráveis para toda a equipe.',
    progress: 90,
    deadline: '2026-04-15',
    createdAt: '2026-01-10T11:00:00Z',
    updatedAt: '2026-02-25T13:20:00Z',
    owner: { id: 'user1', name: 'Pedro Silva' },
    tags: ['OKRs', 'produto'],
  },
  {
    id: '4',
    title: 'Reduzir tempo de resposta do suporte para < 2h',
    description: 'Otimizar processos e integrar IA para respostas rápidas.',
    progress: 12,
    deadline: '2025-12-20',
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2025-12-10T15:00:00Z',
    owner: { id: 'user3', name: 'João Santos' },
    tags: ['suporte', 'tempo-resposta'],
  },
  {
    id: '5',
    title: 'Lançar nova feature de analytics',
    description: 'Desenvolver dashboard interativo com métricas em tempo real.',
    progress: 100,
    deadline: '2026-02-28',
    createdAt: '2025-12-15T10:00:00Z',
    updatedAt: '2026-02-28T18:00:00Z',
    owner: { id: 'user1', name: 'Pedro Silva' },
    tags: ['feature', 'analytics'],
  },
  {
    id: '6',
    title: 'Treinar 50 colaboradores em novas skills',
    description: 'Programa de capacitação com workshops e certificações.',
    progress: 0,
    deadline: '2026-05-31',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
    owner: { id: 'user4', name: 'Maria Costa' },
    tags: ['treinamento', 'skills'],
  },
];

export default function ObjetivosPage() {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'pt' ? ptBR : enUS;

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fakeApi.fetchObjetivos();
      setObjetivos(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const objetivosProcessados = useMemo(() => {
    let filtered = objetivos.map((obj) => {
      const deadlineDate = parseISO(obj.deadline);
      let status: Objetivo['status'] = 'in_progress';

      if (obj.progress >= 100) {
        status = 'completed';
      } else if (isPast(deadlineDate) && obj.progress < 100) {
        status = 'overdue';
      } else if (obj.progress === 0) {
        status = 'not_started';
      }

      return { ...obj, status };
    });

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (obj) =>
          obj.title.toLowerCase().includes(lowerTerm) ||
          obj.description?.toLowerCase().includes(lowerTerm) ||
          obj.owner.name.toLowerCase().includes(lowerTerm) ||
          obj.tags?.some((tag) => tag.toLowerCase().includes(lowerTerm))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((obj) => obj.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let compare = 0;
      if (sortBy === 'deadline') {
        compare = parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
      } else if (sortBy === 'progress') {
        compare = a.progress - b.progress;
      } else if (sortBy === 'title') {
        compare = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? compare : -compare;
    });

    return filtered;
  }, [objetivos, searchTerm, filterStatus, sortBy, sortOrder]);

  const formatarData = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
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
      owner: { id: 'user1', name: 'Pedro Silva' },
      tags: [],
    });
    setFormErrors({});
  };

  const openEditModal = (obj: Objetivo) => {
    setModalType('edit');
    setSelectedObjetivo(obj);
    setFormData(obj);
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
    if (!formData.title?.trim()) errors.title = t('campoObrigatorio');
    if (!formData.deadline || !isValid(parseISO(formData.deadline))) errors.deadline = t('dataInvalida');
    if (formData.progress !== undefined && (formData.progress < 0 || formData.progress > 100)) errors.progress = t('progressoInvalido');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      if (modalType === 'create') {
        const newObj = await fakeApi.createObjetivo(formData as Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt'>);
        setObjetivos((prev) => [...prev, newObj]);
      } else if (modalType === 'edit' && selectedObjetivo) {
        const updated = await fakeApi.updateObjetivo({ ...selectedObjetivo, ...formData });
        setObjetivos((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
        if (updated.progress >= 100 && selectedObjetivo.progress < 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else if (modalType === 'delete' && selectedObjetivo) {
        await fakeApi.deleteObjetivo(selectedObjetivo.id);
        setObjetivos((prev) => prev.filter((o) => o.id !== selectedObjetivo.id));
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressUpdate = (obj: Objetivo, newProgress: number) => {
    const updated = { ...obj, progress: Math.min(Math.max(newProgress, 0), 100) };
    fakeApi.updateObjetivo(updated).then((res) => {
      setObjetivos((prev) => prev.map((o) => (o.id === res.id ? res : o)));
      if (newProgress >= 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    });
  };

  const statusOptions = [
    { value: 'all', label: t('todos') },
    { value: 'not_started', label: t('naoIniciado') },
    { value: 'in_progress', label: t('emAndamento') },
    { value: 'completed', label: t('concluido') },
    { value: 'overdue', label: t('atrasado') },
  ];

  const sortOptions = [
    { value: 'deadline', label: t('prazo') },
    { value: 'progress', label: t('progresso') },
    { value: 'title', label: t('titulo') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}

      {/* Ajuste principal: pt-20 para header + lg:pl-64 para sidebar fixa no desktop */}
      <div
        className={`
          pt-20
          lg:pl-64
          px-4 sm:px-6 lg:px-8
          transition-all duration-300
        `}
      >
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
                disabled={isLoading || objetivos.length === 0}
              >
                {t('exportarRelatorio')}
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="h-5 w-5" />}
                onClick={openCreateModal}
                disabled={isLoading}
              >
                {t('novoObjetivo')}
              </Button>
            </div>
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

          {/* Conteúdo principal */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse h-64 bg-zinc-900/30 shadow-xl" />
                ))}
              </motion.div>
            ) : objetivosProcessados.length === 0 ? (
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
                {objetivosProcessados.map((obj, index) => {
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
                        className="flex h-full flex-col overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl"
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
                            items={[
                              {
                                label: t('editar'),
                                icon: Edit,
                                onClick: () => openEditModal(obj),
                              },
                              {
                                label: t('excluir'),
                                icon: Trash2,
                                variant: 'destructive',
                                onClick: () => openDeleteModal(obj),
                              },
                            ]}
                          />
                        </div>

                        <div className="flex-1 space-y-5 px-6 pb-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-zinc-300">{t('progresso')}</span>
                              <Tooltip content={`${obj.progress}% ${t('concluido')}`}>
                                <span className="text-base font-bold text-zinc-100">
                                  {obj.progress}%
                                </span>
                              </Tooltip>
                            </div>
                            <ProgressBar
                              value={obj.progress}
                              className={statusConfig.progressColor}
                            />
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="h-4 w-4" />
                                <span>{formatarData(obj.deadline)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400">
                                <User className="h-4 w-4" />
                                <span>{obj.owner.name}</span>
                              </div>
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
                              disabled={obj.status === 'completed' || isSubmitting}
                              onClick={() => handleProgressUpdate(obj, obj.progress + 10)}
                            >
                              +10%
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => openEditModal(obj)}
                            >
                              {t('detalhes')}
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
              {t('titulo')}
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('exAumentarProdutividade')}
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
              placeholder={t('detalhesDoObjetivo')}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('progresso')}
              </label>
              <Input
                type="number"
                value={formData.progress || 0}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                min={0}
                max={100}
                error={formErrors.progress}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('prazo')}
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
              {t('responsavel')}
            </label>
            <Select
              value={formData.owner?.id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  owner: { id: e.target.value, name: e.target.selectedOptions[0].text },
                })
              }
              options={[
                { value: 'user1', label: 'Pedro Silva' },
                { value: 'user2', label: 'Ana Oliveira' },
                { value: 'user3', label: 'João Santos' },
                { value: 'user4', label: 'Maria Costa' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('tags')}
            </label>
            <Input
              value={(formData.tags || []).join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map((t) => t.trim()) })}
              placeholder={t('exProdutividadeEquipe')}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              {t('cancelar')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {isSubmitting ? t('salvando') : t('salvar')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        title={t('confirmarExclusao')}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-zinc-300">
            {t('temCertezaQueDesejaExcluir')} <span className="font-medium">{selectedObjetivo?.title}</span>?
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
              {isSubmitting ? t('excluindo') : t('excluir')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}