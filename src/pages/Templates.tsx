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
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { toast } from 'react-hot-toast';

export default function Templates() {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('app_templates', JSON.stringify(templates));
    } catch (err) {
      console.error('Erro ao salvar templates:', err);
    }
  }, [templates]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['Todos', ...Array.from(cats)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let data = [...templates];

    // Filtro por categoria
    if (categoryFilter !== 'Todos') {
      data = data.filter(t => t.category === categoryFilter);
    }

    // Busca por nome, descrição ou conteúdo
    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        (t.content && t.content.toLowerCase().includes(term))
      );
    }

    // Ordenação
    if (sortBy === 'favorites') {
      data.sort((a, b) => Number(b.favorite) - Number(a.favorite));
    } else if (sortBy === 'az') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      data.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    return data;
  }, [templates, search, categoryFilter, sortBy]);

  const toggleFavorite = (id) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, favorite: !t.favorite, updatedAt: new Date().toISOString() }
          : t
      )
    );
    toast.success('Favorito atualizado!');
  };

  const deleteTemplate = (id) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template excluído com sucesso.');
  };

  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (cópia)`,
      favorite: false,
      updatedAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template duplicado!');
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

  const saveTemplate = (newOrUpdatedTemplate) => {
    const templateWithDate = {
      ...newOrUpdatedTemplate,
      updatedAt: new Date().toISOString(),
    };

    if (editingTemplate) {
      // Edição
      setTemplates(prev =>
        prev.map(t => (t.id === templateWithDate.id ? templateWithDate : t))
      );
      toast.success('Template atualizado!');
    } else {
      // Criação
      setTemplates(prev => [
        ...prev,
        { ...templateWithDate, id: Date.now(), favorite: false },
      ]);
      toast.success('Template criado com sucesso!');
    }

    setShowModal(false);
  };

  const generateWithAI = async () => {
    setIsGeneratingAI(true);
    toast.loading('Gerando template com IA...', { id: 'ai-gen' });

    // Simulação (substitua por chamada real à API de IA quando tiver)
    await new Promise(r => setTimeout(r, 1800));

    const aiGenerated = {
      name: 'Template Gerado por IA - ' + new Date().toLocaleDateString('pt-BR'),
      category: 'IA Gerado',
      description: 'Template criado automaticamente com assistência de IA',
      content:
        '# Título da Demanda\n\n' +
        '## Objetivo\n\n' +
        '## Passos / Requisitos\n- Item 1\n- Item 2\n\n' +
        '## Critérios de Aceitação\n- Critério 1\n- Critério 2\n\n' +
        '## Notas / Riscos',
      favorite: false,
      updatedAt: new Date().toISOString(),
    };

    setEditingTemplate(aiGenerated);
    setShowModal(true);
    setIsGeneratingAI(false);
    toast.dismiss('ai-gen');
    toast.success('Template gerado com sucesso!');
  };

  return (
    <div className="min-h-screen pt-20 lg:pl-64 px-6 lg:px-10 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <CopyPlus className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('templates') || 'Templates'}</h1>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              icon={<Sparkles />}
              onClick={generateWithAI}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}
            </Button>

            <Button variant="primary" icon={<Plus />} onClick={openCreateModal}>
              Novo Template
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 lg:flex-[0.4]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome, descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white min-w-[160px]"
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
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white min-w-[160px]"
          >
            <option value="recent">Mais recentes</option>
            <option value="az">A → Z</option>
            <option value="favorites">Favoritos primeiro</option>
          </select>
        </div>

        {/* Lista de templates */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            {search || categoryFilter !== 'Todos'
              ? 'Nenhum template encontrado com os filtros aplicados.'
              : 'Você ainda não tem templates. Crie o primeiro!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
            {filteredTemplates.map(template => (
              <Card key={template.id} hoverable className="flex flex-col">
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2">
                    {template.name}
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-3 flex-1">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                    <span className="bg-zinc-800 px-2.5 py-1 rounded-full">
                      {template.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(template.id)}
                        title={template.favorite ? 'Remover favorito' : 'Favoritar'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            template.favorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-500'
                          }`}
                        />
                      </button>

                      <button onClick={() => openEditModal(template)} title="Editar">
                        <Pencil className="w-4 h-4 hover:text-white transition-colors" />
                      </button>

                      <button onClick={() => duplicateTemplate(template)} title="Duplicar">
                        <Copy className="w-4 h-4 hover:text-white transition-colors" />
                      </button>

                      <button
                        onClick={() => deleteTemplate(template.id)}
                        title="Excluir"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => useTemplate(template)}
                    disabled={!template.content}
                  >
                    Usar Template
                  </Button>
                </div>
              </Card>
            ))}

            {/* Card de criar novo */}
            <Card
              hoverable
              className="border-dashed border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors min-h-[280px]"
              onClick={openCreateModal}
            >
              <div className="text-center py-10">
                <Plus className="w-14 h-14 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">Criar novo template</p>
              </div>
            </Card>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <TemplateModal
            template={editingTemplate}
            onClose={() => setShowModal(false)}
            onSave={saveTemplate}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MODAL DE CRIAÇÃO/EDIÇÃO
───────────────────────────────────────────────── */

function TemplateModal({ template, onClose, onSave }) {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-xl border border-zinc-700 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Editar Template' : 'Novo Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body com scroll */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/60"
              placeholder="Ex: Reunião de Sprint Planejamento"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Categoria <span className="text-red-400">*</span>
            </label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/60"
              placeholder="Ex: Reuniões, Bugs, Features..."
            />
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Descrição <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white min-h-[80px] focus:outline-none focus:border-indigo-500/60"
              placeholder="Breve descrição do propósito deste template..."
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Conteúdo do Template <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm min-h-[220px] focus:outline-none focus:border-indigo-500/60"
              placeholder="Escreva aqui o conteúdo que será copiado ao usar o template...&#10;Suporta Markdown, listas, etc."
            />
            {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar Template
          </Button>
        </div>
      </div>
    </div>
  );
}