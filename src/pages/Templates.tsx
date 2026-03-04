// pages/Templates.tsx
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  CopyPlus,
  Sparkles,
  Plus,
  Search,
  Star,
  Pencil,
  Trash2,
  Copy,
  X,
  Loader2,
  Save, // ← ADICIONAR AQUI
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export default function Templates() {
  const { t } = useTranslation();

  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    isLoading,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Categorias únicas + "Todos"
  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category || 'Sem categoria'));
    return ['Todos', ...Array.from(cats)];
  }, [templates]);

  // Templates filtrados e ordenados
  const filteredTemplates = useMemo(() => {
    let data = [...templates];

    // Filtro por categoria
    if (categoryFilter !== 'Todos') {
      data = data.filter(t => (t.category || 'Sem categoria') === categoryFilter);
    }

    // Busca
    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(t =>
        t.name.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.content || '').toLowerCase().includes(term)
      );
    }

    // Ordenação
    if (sortBy === 'favorites') {
      data.sort((a, b) => Number(b.favorite) - Number(a.favorite));
    } else if (sortBy === 'az') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      data.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    }

    return data;
  }, [templates, search, categoryFilter, sortBy]);

  const toggleFavorite = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    try {
      await updateTemplate(id, {
        favorite: !template.favorite,
        updatedAt: new Date().toISOString(),
      });
      toast.success(template.favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
    } catch (err) {
      toast.error('Erro ao atualizar favorito');
    }
  };

  const deleteTemplateLocal = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await deleteTemplate(id);
      toast.success('Template excluído com sucesso.');
    } catch (err) {
      toast.error('Erro ao excluir template');
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      await addTemplate({
        name: `${template.name} (cópia)`,
        category: template.category,
        description: template.description,
        content: template.content,
        favorite: false,
      });
      toast.success('Template duplicado!');
    } catch (err) {
      toast.error('Erro ao duplicar template');
    }
  };

  const useTemplate = (template) => {
    if (!template.content) {
      toast.error('Este template não tem conteúdo para copiar.');
      return;
    }
    navigator.clipboard.writeText(template.content);
    toast.success('Conteúdo copiado para a área de transferência!');
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const generateWithAI = async () => {
    setIsGeneratingAI(true);
    toast.loading('Gerando template com IA...', { id: 'ai-gen' });

    // Simulação de IA (substitua por chamada real quando tiver API)
    await new Promise(r => setTimeout(r, 2200));

    try {
      await addTemplate({
        name: 'Template Gerado por IA - ' + new Date().toLocaleDateString('pt-BR'),
        category: 'IA Gerado',
        description: 'Template criado automaticamente com assistência de IA',
        content:
          '# Título da Demanda\n\n' +
          '## Objetivo\n\n' +
          '## Passos / Requisitos\n- Item 1\n- Item 2\n\n' +
          '## Critérios de Aceitação\n- Critério 1\n- Critério 2\n\n' +
          '## Notas / Riscos\n\n' +
          '## Prazo Estimado\n\n' +
          '## Responsável',
        favorite: false,
      });

      toast.success('Template gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar template com IA');
    } finally {
      setIsGeneratingAI(false);
      toast.dismiss('ai-gen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-20">
          {/* Cabeçalho */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <CopyPlus className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t('templates') || 'Templates'}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">
                  Modelos prontos para demandas, reuniões, relatórios e mais
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                size="lg"
                icon={<Sparkles className="w-5 h-5" />}
                onClick={generateWithAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}
              </Button>

              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={openCreateModal}
              >
                Novo Template
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-5 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nome, descrição ou conteúdo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="
                  w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                  pl-12 pr-5 py-4 text-zinc-100 placeholder-zinc-500 
                  focus:outline-none focus:border-indigo-500 focus:ring-1 
                  focus:ring-indigo-500/30 transition-all text-base
                "
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-indigo-500 min-w-[180px] text-base"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-indigo-500 min-w-[180px] text-base"
            >
              <option value="recent">Mais recentes</option>
              <option value="az">A → Z</option>
              <option value="favorites">Favoritos primeiro</option>
            </select>
          </div>

          {/* Lista de templates */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-24 text-zinc-500">
              <CopyPlus className="w-20 h-20 mx-auto mb-8 opacity-50" />
              <h3 className="text-3xl font-medium mb-4">
                {search || categoryFilter !== 'Todos'
                  ? 'Nenhum template encontrado'
                  : 'Você ainda não tem templates'}
              </h3>
              <p className="text-xl mb-10 max-w-lg mx-auto">
                {search || categoryFilter !== 'Todos'
                  ? 'Tente ajustar os filtros ou limpar a busca'
                  : 'Crie templates reutilizáveis para agilizar seu trabalho'}
              </p>
              <Button
                variant="primary"
                size="xl"
                icon={<Plus className="w-6 h-6" />}
                onClick={openCreateModal}
              >
                Criar Primeiro Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  hoverable
                  className="flex flex-col border-zinc-800 shadow-xl transition-all hover:shadow-2xl hover:border-zinc-700"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-xl text-white line-clamp-2 flex-1">
                        {template.name}
                      </h3>

                      <button
                        onClick={() => toggleFavorite(template.id)}
                        title={template.favorite ? 'Remover favorito' : 'Favoritar'}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            template.favorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-500'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-base text-zinc-400 mb-6 line-clamp-3 flex-1">
                      {template.description || 'Sem descrição'}
                    </p>

                    <div className="flex items-center justify-between text-sm text-zinc-500 mt-auto mb-5">
                      <span className="bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">
                        {template.category || 'Sem categoria'}
                      </span>

                      <div className="flex items-center gap-3">
                        <button onClick={() => openEditModal(template)} title="Editar">
                          <Pencil className="w-5 h-5 hover:text-indigo-400 transition-colors" />
                        </button>

                        <button onClick={() => duplicateTemplate(template)} title="Duplicar">
                          <Copy className="w-5 h-5 hover:text-green-400 transition-colors" />
                        </button>

                        <button
                          onClick={() => deleteTemplateLocal(template.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5 hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={() => useTemplate(template)}
                      disabled={!template.content}
                      className="py-3 text-base"
                    >
                      Usar Template
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Card "Criar novo" */}
              <Card
                hoverable
                className="border-dashed border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors min-h-[320px]"
                onClick={openCreateModal}
              >
                <div className="text-center py-12">
                  <Plus className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
                  <p className="text-xl font-medium text-zinc-400">
                    Criar novo template
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <TemplateModal
              template={editingTemplate}
              onClose={() => setShowModal(false)}
              onSave={async (newOrUpdated) => {
                try {
                  if (editingTemplate) {
                    await updateTemplate(editingTemplate.id, {
                      name: newOrUpdated.name,
                      category: newOrUpdated.category,
                      description: newOrUpdated.description,
                      content: newOrUpdated.content,
                      favorite: newOrUpdated.favorite,
                      updatedAt: new Date().toISOString(),
                    });
                    toast.success('Template atualizado!');
                  } else {
                    await addTemplate({
                      name: newOrUpdated.name,
                      category: newOrUpdated.category,
                      description: newOrUpdated.description,
                      content: newOrUpdated.content,
                      favorite: false,
                    });
                    toast.success('Template criado com sucesso!');
                  }
                  setShowModal(false);
                } catch (err) {
                  toast.error('Erro ao salvar template');
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MODAL DE CRIAÇÃO/EDIÇÃO
───────────────────────────────────────────────── */

function TemplateModal({ template, onClose, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório';
    if (!category.trim()) newErrors.category = 'A categoria é obrigatória';
    if (!description.trim()) newErrors.description = 'A descrição é obrigatória';
    if (!content.trim()) newErrors.content = 'O conteúdo do template é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    onSave({
      id: template?.id,
      name,
      category,
      description,
      content,
      favorite: template?.favorite ?? false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 w-full max-w-4xl rounded-2xl border border-zinc-800 shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {template ? 'Editar Template' : 'Novo Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-3xl leading-none p-2"
          >
            ×
          </button>
        </div>

        {/* Body com scroll */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-base font-medium text-zinc-300 mb-3">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="
                  w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                  px-6 py-4 text-lg text-white placeholder-zinc-500 
                  focus:outline-none focus:border-indigo-500 transition-colors
                "
                placeholder="Ex: Reunião de Sprint Planejamento"
              />
              {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-base font-medium text-zinc-300 mb-3">
                Categoria <span className="text-red-400">*</span>
              </label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="
                  w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                  px-6 py-4 text-lg text-white placeholder-zinc-500 
                  focus:outline-none focus:border-indigo-500 transition-colors
                "
                placeholder="Ex: Reuniões, Bugs, Features..."
              />
              {errors.category && <p className="text-red-400 text-sm mt-2">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-zinc-300 mb-3">
              Descrição <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="
                w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                px-6 py-4 text-base text-white placeholder-zinc-500 
                focus:outline-none focus:border-indigo-500 transition-colors 
                min-h-[100px] resize-y
              "
              placeholder="Breve descrição do propósito e uso deste template..."
            />
            {errors.description && <p className="text-red-400 text-sm mt-2">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-base font-medium text-zinc-300 mb-3">
              Conteúdo do Template <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="
                w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                px-6 py-5 text-base font-mono text-zinc-100 placeholder-zinc-500 
                focus:outline-none focus:border-indigo-500 transition-colors 
                min-h-[320px] resize-y leading-relaxed
              "
              placeholder="Escreva aqui o conteúdo que será copiado ao usar o template...\n\nSuporta Markdown, listas, tabelas, etc."
            />
            {errors.content && <p className="text-red-400 text-sm mt-2">{errors.content}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-900/80 flex justify-end gap-4">
          <Button
            variant="outline"
            size="xl"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="xl"
            onClick={handleSave}
            icon={<Save className="w-6 h-6" />}
          >
            Salvar Template
          </Button>
        </div>
      </div>
    </div>
  );
}