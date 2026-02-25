import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Bot, Send, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function AIStudio() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setHistory((prev) => [...prev, { prompt, response: '' }]);

    // Mock de resposta da IA
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResponse = `Havk AI: Aqui está uma sugestão baseada no seu prompt "${prompt}":\n\n1. Priorize as tarefas críticas\n2. Divida em subtarefas\n3. Defina prazos realistas\n\nQuer que eu gere uma demanda completa com isso?`;

    setResponse(mockResponse);
    setHistory((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].response = mockResponse;
      return updated;
    });

    setLoading(false);
    setPrompt('');
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bot className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('aiStudio')}</h1>
        </div>

        <Card title="Co-Pilot IA" description="Pergunte qualquer coisa ou peça sugestões inteligentes">
          <div className="h-96 overflow-y-auto mb-6 space-y-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Sparkles className="w-12 h-12 mb-4" />
                <p>Comece uma conversa com a IA</p>
              </div>
            )}

            {history.map((msg, index) => (
              <div key={index} className="space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-zinc-800 rounded-2xl rounded-tr-none px-4 py-3">
                    <p className="text-zinc-100">{msg.prompt}</p>
                  </div>
                </div>
                {msg.response && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-zinc-800/70 rounded-2xl rounded-tl-none px-4 py-3">
                      <p className="text-zinc-300 whitespace-pre-line">{msg.response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pergunte à IA... (ex: gere uma demanda para redesign do site)"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button
              variant="primary"
              icon={<Send className="w-5 h-5" />}
              onClick={handleSubmit}
              loading={loading}
            >
              Enviar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}