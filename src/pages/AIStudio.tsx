import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  Bot,
  Send,
  Sparkles,
  Clipboard,
  ClipboardPlus,
  Target,
  FolderPlus,
  Wand2,
  BarChart3,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function AIStudio() {
  const { t } = useTranslation();

  const {
    addChatMensagem,
    addDemanda,
    addObjetivo,
    addProjeto,
    demandas,
    projetos,
    objetivos,
  } = useAppStore();

  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [promptCount, setPromptCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

  /* =====================================================
     🧠 CONTEXT AWARE ENGINE
  ===================================================== */

  const buildContext = () => {
    return `
Projetos ativos: ${projetos.length}
Demandas abertas: ${demandas.length}
Objetivos ativos: ${objetivos.length}
`;
  };

  const generateAIResponse = async (text: string) => {
    const context = buildContext();

    await new Promise((resolve) => setTimeout(resolve, 800));

    return `✨ Havk AI Strategic Analysis

Contexto do sistema:
${context}

Baseado no seu pedido:
"${text}"

📌 Plano sugerido:

1. Definir escopo claro
2. Criar milestones
3. Priorizar entregáveis
4. Monitorar progresso

Posso transformar isso automaticamente em estrutura organizada.`;
  };

  /* =====================================================
     ⚡ STREAMING EFFECT
  ===================================================== */

  const streamText = async (fullText: string) => {
    setStreamingText('');
    for (let i = 0; i < fullText.length; i++) {
      await new Promise((r) => setTimeout(r, 8));
      setStreamingText((prev) => prev + fullText[i]);
    }
  };

  /* =====================================================
     🚀 SUBMIT
  ===================================================== */

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };

    setHistory((prev) => [...prev, userMessage]);
    await addChatMensagem({ message: prompt });

    setPrompt('');
    setLoading(true);
    setPromptCount((c) => c + 1);

    const aiResponse = await generateAIResponse(prompt);

    await streamText(aiResponse);

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: aiResponse,
    };

    setHistory((prev) => [...prev, aiMessage]);
    await addChatMensagem({ message: aiResponse });

    setStreamingText('');
    setLoading(false);
  };

  /* =====================================================
     🧩 QUICK ACTIONS
  ===================================================== */

  const getLastAI = () =>
    [...history].reverse().find((m) => m.role === 'ai');

  const createDemand = async () => {
    const last = getLastAI();
    if (!last) return;

    await addDemanda({
      title: 'Demanda gerada pela IA',
      description: last.content,
      status: 'pendente',
      priority: 'media',
    });

    alert('Demanda criada!');
  };

  const createGoal = async () => {
    const last = getLastAI();
    if (!last) return;

    await addObjetivo({
      title: 'Objetivo gerado pela IA',
      completed: false,
    });

    alert('Objetivo criado!');
  };

  const createProject = async () => {
    await addProjeto({
      name: 'Projeto estratégico IA',
      description: 'Criado automaticamente via AIStudio',
    });

    alert('Projeto criado!');
  };

  const copyLast = () => {
    const last = getLastAI();
    if (!last) return;
    navigator.clipboard.writeText(last.content);
  };

  /* =====================================================
     🎨 UI
  ===================================================== */

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
        <div className="mx-auto max-w-7xl pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT TOOLBAR - Ferramentas e Estatísticas */}
            <div className="lg:col-span-3 space-y-6">
              <Card title="Ferramentas IA" className="shadow-xl border-zinc-800">
                <div className="space-y-3 p-2">
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<ClipboardPlus size={16} />}
                    onClick={createDemand}
                  >
                    Criar Demanda
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Target size={16} />}
                    onClick={createGoal}
                  >
                    Criar Objetivo
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<FolderPlus size={16} />}
                    onClick={createProject}
                  >
                    Criar Projeto
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Clipboard size={16} />}
                    onClick={copyLast}
                  >
                    Copiar Última Resposta
                  </Button>
                </div>
              </Card>

              <Card title="Estatísticas" className="shadow-xl border-zinc-800">
                <div className="p-4 text-sm text-zinc-400 space-y-3">
                  <div className="flex justify-between">
                    <span>Prompts enviados:</span>
                    <span className="font-medium text-zinc-200">{promptCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projetos:</span>
                    <span className="font-medium text-zinc-200">{projetos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demandas:</span>
                    <span className="font-medium text-zinc-200">{demandas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Objetivos:</span>
                    <span className="font-medium text-zinc-200">{objetivos.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* CHAT AREA - Principal */}
            <div className="lg:col-span-9">
              <Card
                title="Havk AI Co-Pilot"
                description="Planejamento estratégico inteligente"
                className="shadow-2xl border-zinc-800"
              >
                <div className="h-[600px] overflow-y-auto mb-6 space-y-6 p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                  {history.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600/90 text-white'
                            : 'bg-zinc-800/90 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-5 py-4 rounded-2xl text-sm bg-zinc-800/90 text-zinc-300 border border-zinc-700 animate-pulse">
                        {streamingText || 'Havk AI está analisando...'}
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    placeholder="Digite sua estratégia, ideia ou comando..."
                    className="flex-1 resize-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />

                  <Button
                    variant="primary"
                    icon={<Send size={18} />}
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                  >
                    Enviar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}