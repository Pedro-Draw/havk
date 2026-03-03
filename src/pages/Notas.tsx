import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { NotebookPen, Plus, Save, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { addItem, getAll, updateItem } from '../db/indexedDB';

export default function Notas() {
  const { t, translateUserContent } = useTranslation();
  const [notas, setNotas] = useState<any[]>([]);
  const [currentNota, setCurrentNota] = useState<any>({ id: null, title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadNotas = async () => {
      const data = await getAll<any>('notas');
      setNotas(data || []);
    };
    loadNotas();
  }, []);

  const handleNewNota = () => {
    setCurrentNota({ id: null, title: '', content: '' });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentNota.title.trim() && !currentNota.content.trim()) {
      return toast.error(t('preenchaTituloOuConteudo') || 'Preencha título ou conteúdo');
    }

    try {
      let updatedNota;

      if (currentNota.id) {
        // Edição
        updatedNota = {
          ...currentNota,
          updatedAt: new Date().toISOString(),
        };
        await updateItem('notas', updatedNota);
        setNotas((prev) =>
          prev.map((n) => (n.id === currentNota.id ? updatedNota : n))
        );
        toast.success(t('notaAtualizada') || 'Nota atualizada');
      } else {
        // Criação
        const newNota = {
          ...currentNota,
          createdAt: new Date().toISOString(),
        };
        const id = await addItem('notas', newNota);
        setNotas((prev) => [...prev, { ...newNota, id }]);
        toast.success(t('notaCriada') || 'Nova nota criada');
      }

      setIsEditing(false);
      setCurrentNota({ id: null, title: '', content: '' });
    } catch (err) {
      console.error(err);
      toast.error(t('erroSalvarNota') || 'Erro ao salvar nota');
    }
  };

  const selectNota = (nota: any) => {
    setCurrentNota(nota);
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Ajuste principal: pt-20 para header fixo + lg:pl-64 para sidebar fixa no desktop */}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl shadow-lg">
                <NotebookPen className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t('notas') || 'Notas'}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">
                  {notas.length} {notas.length === 1 ? 'nota' : 'notas'} • Ideias, lembretes e rascunhos
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
              onClick={handleNewNota}
            >
              Nova Nota
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar de notas (lista) */}
            <div className="lg:col-span-3">
              <Card title={t('minhasNotas')} className="border-zinc-800 shadow-xl h-full">
                <div className="p-4">
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Plus className="w-5 h-5" />}
                    onClick={handleNewNota}
                    className="mb-6 py-4 text-base"
                  >
                    Criar Nova Nota
                  </Button>

                  <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                    {notas.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500">
                        <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhuma nota ainda</p>
                        <p className="text-sm mt-2">Crie sua primeira nota acima</p>
                      </div>
                    ) : (
                      notas.map((nota) => (
                        <button
                          key={nota.id}
                          onClick={() => selectNota(nota)}
                          className={`
                            w-full text-left p-4 rounded-xl border transition-all duration-200
                            ${currentNota.id === nota.id
                              ? 'border-indigo-500 bg-zinc-800/90 shadow-md'
                              : 'border-zinc-800 hover:bg-zinc-900/70 hover:border-zinc-700'}
                          `}
                        >
                          <p className="font-medium text-base truncate">
                            {nota.title || 'Sem título'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                            {nota.content?.slice(0, 80) || 'Nota vazia'}
                            {nota.content?.length > 80 ? '...' : ''}
                          </p>
                          <p className="text-xs text-zinc-600 mt-2">
                            {new Date(nota.createdAt).toLocaleDateString('pt-BR')}
                            {nota.updatedAt && ' • Atualizado'}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Editor principal */}
            <div className="lg:col-span-9">
              {isEditing ? (
                <Card
                  title={currentNota.id ? t('editarNota') : t('novaNota')}
                  className="border-zinc-800 shadow-2xl"
                >
                  <div className="space-y-6">
                    <input
                      type="text"
                      value={currentNota.title}
                      onChange={(e) => setCurrentNota({ ...currentNota, title: e.target.value })}
                      placeholder={t('tituloDaNota') || 'Título da nota...'}
                      className="
                        w-full bg-zinc-900 border border-zinc-700 rounded-xl 
                        px-6 py-4 text-2xl font-medium text-zinc-100 
                        placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors
                      "
                    />

                    <textarea
                      value={currentNota.content}
                      onChange={(e) => setCurrentNota({ ...currentNota, content: e.target.value })}
                      placeholder={
                        t('escrevaSuaNotaAqui') ||
                        'Escreva sua nota aqui...\n\n• Ideias\n• Lembretes\n• Links úteis\n• Markdown suportado em breve'
                      }
                      className="
                        w-full h-[60vh] min-h-[400px] bg-zinc-900 border border-zinc-700 
                        rounded-xl p-6 text-zinc-100 placeholder-zinc-500 
                        focus:outline-none focus:border-indigo-500 resize-none 
                        font-mono text-base leading-relaxed
                      "
                    />

                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setIsEditing(false);
                          setCurrentNota({ id: null, title: '', content: '' });
                        }}
                        icon={<X className="w-5 h-5" />}
                      >
                        {t('cancelar')}
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSave}
                        icon={<Save className="w-5 h-5" />}
                        disabled={!currentNota.title.trim() && !currentNota.content.trim()}
                      >
                        {t('salvar')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-zinc-800 shadow-2xl h-full flex items-center justify-center text-zinc-500">
                  <div className="text-center py-20">
                    <NotebookPen className="w-20 h-20 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-medium mb-4">
                      {t('selecioneOuCrieNota')}
                    </h3>
                    <p className="text-lg max-w-md mx-auto">
                      Clique em "Nova Nota" ou selecione uma existente na lista à esquerda
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<Plus className="w-5 h-5" />}
                      onClick={handleNewNota}
                      className="mt-8"
                    >
                      Criar Nova Nota
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}