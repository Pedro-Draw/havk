import { useTranslation } from '../i18n/useTranslation';
import { CopyPlus, Sparkles, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Templates() {
  const { t } = useTranslation();

  const templates = [
    { id: 1, name: 'Reunião de Planejamento', category: 'Reuniões', description: 'Template padrão para reuniões semanais' },
    { id: 2, name: 'Bug Report', category: 'Desenvolvimento', description: 'Relato de erro com passos para reproduzir' },
    { id: 3, name: 'Nova Feature', category: 'Produto', description: 'Solicitação de nova funcionalidade' },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CopyPlus className="w-8 h-8 text-zinc-300" />
            <h1 className="text-3xl font-bold text-white">{t('templates')}</h1>
          </div>
          <Button variant="primary" icon={<Sparkles />}>
            Gerar com IA
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} title={template.name} hoverable>
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">{template.description}</p>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>{template.category}</span>
                  <Button variant="outline" size="sm">
                    Usar Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Card hoverable className="border-dashed border-zinc-700 flex items-center justify-center h-full">
            <div className="text-center py-12">
              <Plus className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">Criar novo template</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}