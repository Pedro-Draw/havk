// pages/AIStudio.tsx
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
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp?: string;
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
    chatMensagens, // opcional: pode usar histórico real do store se quiser persistir
  } = useAppStore();

  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [promptCount, setPromptCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

  /* =====================================================
     🧠 CONTEXT AWARE ENGINE (pode expandir com mais dados)
  ===================================================== */
  const buildContext = () => {
    return `
Data atual: ${new Date().toLocaleDateString('pt-BR')}
Projetos ativos: ${projetos.length}
Demandas abertas: ${demandas.filter(d => d.status !== 'concluida').length}
Objetivos pendentes: ${objetivos.filter(o => !o.completed).length}
    `.trim();
  };

  /* =====================================================
     🤖 MOCK AI RESPONSE (troque por API real)
  ===================================================== */
  const generateAIResponse = async (userPrompt: string): Promise<string> => {
    const context = buildContext();

    // Simulação de delay de API
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    // Resposta mock mais elaborada e útil
    return `
✨ **Havk AI - Análise Estratégica**

**Contexto do seu workspace:**
${context}

**Seu pedido:**  
"${userPrompt}"

**Análise rápida:**
- Objetivo principal identificado: ${userPrompt.split(' ').slice(0, 5).join(' ')}...
- Complexidade estimada: Média
- Prazo sugerido: 2-4 semanas
- Recursos recomendados: 1-2 pessoas + revisão semanal

**Plano de ação sugerido (executável):**

1. **Definição**  
   - Título claro: "${userPrompt.slice(0, 40)}${userPrompt.length > 40 ? '...' : ''}"
   - Descrição detalhada: [preencher com base no prompt]

2. **Milestones**  
   - Semana 1: Pesquisa + escopo  
   - Semana 2: Prototipagem/execução inicial  
   - Semana 3: Testes + ajustes  
   - Semana 4: Entrega + revisão

3. **Próximos passos imediatos**  
   Posso criar automaticamente:  
   → Demanda no backlog  
   → Projeto com estrutura  
   → Objetivo trimestral  

Responda com "criar demanda", "criar projeto", "detalhar plano" ou continue a conversa. Estou pronto! 🚀`;
  };

  /* =====================================================
     ⚡ STREAMING SIMULATION
  ===================================================== */
  const streamText = async (fullText: string) => {
    setStreamingText('');
    for (let i = 0; i < fullText.length; i++) {
      await new Promise(r => setTimeout(r, 6 + Math.random() * 8));
      setStreamingText(prev => prev + fullText[i]);
    }
  };

  /* =====================================================
     🚀 ENVIAR PROMPT
  ===================================================== */
  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => [...prev, userMessage]);
    await addChatMensagem({
      message: prompt.trim(),
      senderId: 'current-user',
      demandaId: undefined, // ou vincule a uma demanda específica se quiser
    });

    setPrompt('');
    setLoading(true);
    setPromptCount(c => c + 1);

    try {
      const aiResponse = await generateAIResponse(prompt.trim());
      await streamText(aiResponse);

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setHistory(prev => [...prev, aiMessage]);
      await addChatMensagem({
        message: aiResponse,
        senderId: 'havk-ai',
        demandaId: undefined,
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar resposta da IA');
      setStreamingText('Desculpe, ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     🧩 QUICK ACTIONS BASEADAS NA ÚLTIMA RESPOSTA
  ===================================================== */
  const getLastAIResponse = () =>
    [...history].reverse().find(m => m.role === 'ai')?.content || '';

  const createDemandFromAI = async () => {
    const lastAI = getLastAIResponse();
    if (!lastAI) {
      toast.error('Nenhuma resposta da IA para usar como base');
      return;
    }

    // Tentativa simples de extrair título/descrição
    const lines = lastAI.split('\n');
    const titleLine = lines.find(l => l.includes('Título') || l.includes('**Seu pedido:**')) || lastAI.slice(0, 60);
    const title = titleLine.replace(/[#*:"]/g, '').trim().slice(0, 80);

    try {
      await addDemanda({
        title: title || 'Demanda gerada pela IA',
        description: lastAI,
        status: 'aberta',
        priority: 'media',
      });
      toast.success('Demanda criada com base na resposta da IA!');
    } catch (err) {
      toast.error('Erro ao criar demanda');
    }
  };

  const createGoalFromAI = async () => {
    const lastAI = getLastAIResponse();
    if (!lastAI) return toast.error('Nenhuma resposta da IA recente');

    const title = lastAI.split('\n')[0].replace(/[#*:"]/g, '').trim().slice(0, 60) || 'Objetivo gerado pela IA';

    try {
      await addObjetivo({
        title,
        completed: false,
        // deadline: sugerir data baseada na resposta (futuro)
      });
      toast.success('Objetivo criado!');
    } catch (err) {
      toast.error('Erro ao criar objetivo');
    }
  };

  const createProjectFromAI = async () => {
    try {
      await addProjeto({
        name: 'Projeto gerado pela IA ' + new Date().toLocaleDateString('pt-BR'),
        description: getLastAIResponse() || 'Criado automaticamente via AI Studio',
        status: 'ativo',
      });
      toast.success('Projeto estratégico criado!');
    } catch (err) {
      toast.error('Erro ao criar projeto');
    }
  };

  const copyLastResponse = () => {
    const last = getLastAIResponse();
    if (!last) return toast.error('Nenhuma resposta para copiar');
    
    navigator.clipboard.writeText(last);
    toast.success('Resposta copiada para a área de transferência');
  };

  /* =====================================================
     🎨 RENDER
  ===================================================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT TOOLBAR */}
            <div className="lg:col-span-3 space-y-6">
              <Card title="Ferramentas Rápidas" className="shadow-xl border-zinc-800">
                <div className="space-y-3 p-3">
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<ClipboardPlus size={16} />}
                    onClick={createDemandFromAI}
                    disabled={loading || !getLastAIResponse()}
                  >
                    Criar Demanda da IA
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Target size={16} />}
                    onClick={createGoalFromAI}
                    disabled={loading || !getLastAIResponse()}
                  >
                    Criar Objetivo da IA
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<FolderPlus size={16} />}
                    onClick={createProjectFromAI}
                  >
                    Criar Projeto Estratégico
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Clipboard size={16} />}
                    onClick={copyLastResponse}
                    disabled={!getLastAIResponse()}
                  >
                    Copiar Última Resposta
                  </Button>
                </div>
              </Card>

              <Card title="Estatísticas do Workspace" className="shadow-xl border-zinc-800">
                <div className="p-4 text-sm text-zinc-400 space-y-3">
                  <div className="flex justify-between">
                    <span>Interações com IA:</span>
                    <span className="font-medium text-zinc-200">{promptCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projetos ativos:</span>
                    <span className="font-medium text-zinc-200">{projetos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demandas abertas:</span>
                    <span className="font-medium text-zinc-200">
                      {demandas.filter(d => d.status !== 'concluida').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Objetivos pendentes:</span>
                    <span className="font-medium text-zinc-200">
                      {objetivos.filter(o => !o.completed).length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="lg:col-span-9">
              <Card
                title="Havk AI Co-Pilot"
                description="Planejamento estratégico, análise e geração automática"
                className="shadow-2xl border-zinc-800"
              >
                <div className="h-[600px] overflow-y-auto mb-6 space-y-6 p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                  {history.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                      <Sparkles className="w-16 h-16 mb-6 text-indigo-400/50" />
                      <h3 className="text-xl font-medium mb-3">Bem-vindo ao Havk AI Studio</h3>
                      <p className="max-w-md">
                        Descreva sua ideia, estratégia, problema ou objetivo.  
                        Posso analisar, sugerir planos e criar demandas, objetivos ou projetos automaticamente.
                      </p>
                      <p className="text-sm mt-6 opacity-70">
                        Exemplos: "Planejar lançamento de novo produto", "Como aumentar retenção de usuários", "Criar roadmap Q2"
                      </p>
                    </div>
                  )}

                  {history.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[85%] px-5 py-4 rounded-2xl text-base leading-relaxed
                          ${msg.role === 'user'
                            ? 'bg-indigo-600/80 text-white'
                            : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700'}
                        `}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                        {msg.timestamp && (
                          <p className="text-xs opacity-60 mt-2 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] px-5 py-4 rounded-2xl text-base bg-zinc-800/90 text-zinc-300 border border-zinc-700 animate-pulse">
                        {streamingText || (
                          <span className="flex items-center gap-2">
                            <Wand2 className="w-4 h-4 animate-spin" />
                            Havk AI está pensando...
                          </span>
                        )}
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
                    placeholder="Digite sua estratégia, ideia, análise ou comando..."
                    className="flex-1 resize-none bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    disabled={loading}
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Send size={20} />}
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading || !prompt.trim()}
                    className="min-w-[100px]"
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