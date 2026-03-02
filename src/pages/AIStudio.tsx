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
    <div className="min-h-screen pt-24 px-6 bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">

        {/* LEFT TOOLBAR */}
        <div className="col-span-3 space-y-4">
          <Card title="Ferramentas IA">
            <div className="space-y-3">
              <Button icon={<ClipboardPlus size={16} />} onClick={createDemand}>
                Criar Demanda
              </Button>
              <Button icon={<Target size={16} />} onClick={createGoal}>
                Criar Objetivo
              </Button>
              <Button icon={<FolderPlus size={16} />} onClick={createProject}>
                Criar Projeto
              </Button>
              <Button icon={<Clipboard size={16} />} onClick={copyLast}>
                Copiar Última Resposta
              </Button>
            </div>
          </Card>

          <Card title="Estatísticas">
            <div className="text-sm text-zinc-400 space-y-2">
              <div>Prompts enviados: {promptCount}</div>
              <div>Projetos: {projetos.length}</div>
              <div>Demandas: {demandas.length}</div>
              <div>Objetivos: {objetivos.length}</div>
            </div>
          </Card>
        </div>

        {/* CHAT AREA */}
        <div className="col-span-9">
          <Card
            title="Havk AI Co-Pilot"
            description="Planejamento estratégico inteligente"
          >
            <div className="h-[550px] overflow-y-auto mb-6 space-y-6 p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">

              {history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-5 py-4 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <p className="whitespace-pre-line">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="bg-zinc-800 px-5 py-4 rounded-2xl text-zinc-400 text-sm border border-zinc-700">
                  {streamingText || 'Havk AI está analisando...'}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="Digite sua estratégia..."
                className="flex-1 resize-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100"
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
              >
                Enviar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}