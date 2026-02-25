import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { NotebookPen, Plus, Save } from 'lucide-react';
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
      setNotas(data);
    };
    loadNotas();
  }, []);

  const handleNewNota = () => {
    setCurrentNota({ id: null, title: '', content: '' });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentNota.title.trim() && !currentNota.content.trim()) return;

    if (currentNota.id) {
      await updateItem('notas', currentNota);
      setNotas((prev) =>
        prev.map((n) => (n.id === currentNota.id ? currentNota : n))
      );
    } else {
      const newNota = { ...currentNota, createdAt: new Date().toISOString() };
      const id = await addItem('notas', newNota);
      setNotas((prev) => [...prev, { ...newNota, id }]);
    }

    setIsEditing(false);
    setCurrentNota({ id: null, title: '', content: '' });
  };

  const selectNota = (nota: any) => {
    setCurrentNota(nota);
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de notas */}
        <div className="lg:col-span-1">
          <Card title={t('notas')}>
            <Button
              variant="primary"
              fullWidth
              icon={<Plus />}
              onClick={handleNewNota}
              className="mb-4"
            >
              Nova Nota
            </Button>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {notas.map((nota) => (
                <button
                  key={nota.id}
                  onClick={() => selectNota(nota)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    currentNota.id === nota.id
                      ? 'border-zinc-100 bg-zinc-800'
                      : 'border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  <p className="font-medium truncate">{nota.title || 'Sem título'}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(nota.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {isEditing ? (
            <Card title={currentNota.id ? 'Editar Nota' : 'Nova Nota'}>
              <input
                type="text"
                value={currentNota.title}
                onChange={(e) => setCurrentNota({ ...currentNota, title: e.target.value })}
                placeholder="Título da nota..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-lg font-medium text-zinc-100 mb-4 focus:outline-none focus:border-zinc-500"
              />

              <textarea
                value={currentNota.content}
                onChange={(e) => setCurrentNota({ ...currentNota, content: e.target.value })}
                placeholder="Escreva sua nota aqui... (suporte a markdown no futuro)"
                className="w-full h-96 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />

              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t('cancelar')}
                </Button>
                <Button variant="primary" icon={<Save />} onClick={handleSave}>
                  {t('salvar')}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-96 text-zinc-500">
              Selecione ou crie uma nota
            </div>
          )}
        </div>
      </div>
    </div>
  );
}