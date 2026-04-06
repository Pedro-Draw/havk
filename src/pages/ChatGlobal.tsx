// pages/ChatGlobal.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, Send, Loader2, Copy, Reply, ThumbsUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
// Adicione date-fns para timestamps relativos (instale via npm install date-fns)
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Adicione react-markdown e remark-gfm (instale via npm install react-markdown remark-gfm)
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Adicione uuid (instale via npm install uuid)
import { v4 as uuidv4 } from 'uuid';

export default function ChatGlobal() {
  const { t } = useTranslation();
  const { user, isLoading } = useAppStore(); // Removido chatMensagens do store, usando local

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega mensagens do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat_global');
    if (saved) {
      setMensagens(JSON.parse(saved));
    }
  }, []);

  // Salva mensagens no localStorage
  useEffect(() => {
    localStorage.setItem('chat_global', JSON.stringify(mensagens));
  }, [mensagens]);

  // Ajusta altura da textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [novaMensagem]);

  // Scroll automático
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, autoScroll]);

  // Detecta se o usuário está no fundo ou rolou para cima
  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100; // Threshold de 100px
    setAutoScroll(atBottom);
  };

  // Filtra e ordena mensagens
  const mensagensGlobais = useMemo(() => {
    let filtered = mensagens
      .filter((m) => m.message.toLowerCase().includes(search.toLowerCase()));
    return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [mensagens, search]);

  const handleEnviar = () => {
    const trimmed = novaMensagem.trim();
    if (!trimmed) return;

    const userMessage = {
      id: uuidv4(),
      message: trimmed,
      senderId: user?.id || 'current-user',
      senderName: user?.name || 'Pedro',
      createdAt: new Date().toISOString(),
      replyToId: replyingTo?.id,
      reactions: [],
    };

    setMensagens((prev) => [...prev, userMessage]);
    setNovaMensagem('');
    setReplyingTo(null);
    toast.success('Mensagem enviada');

    // Simula resposta da IA com streaming
    const botId = uuidv4();
    const botMessage = {
      id: botId,
      message: '',
      senderId: 'grok',
      senderName: 'Grok',
      createdAt: new Date().toISOString(),
      reactions: [],
    };
    setMensagens((prev) => [...prev, botMessage]);

    // Resposta simulada completa
    const fullResponse = `Olá, Pedro! Você disse: "${trimmed}".

Esta é uma resposta simulada porque não há backend ou API integrada ainda.

Em uma aplicação real, aqui viria a resposta gerada por uma IA como eu, o Grok, respondendo corretamente à sua pergunta sobre qualquer tópico.

Por exemplo, se você perguntar sobre programação, eu explicaria o código, ou sobre ciência, fatos interessantes.

Por enquanto, imagine que eu estou respondendo de forma inteligente! 😊`;

    let index = 0;
    const streamInterval = setInterval(() => {
      if (index < fullResponse.length) {
        const current = fullResponse.slice(0, index + 1);
        setMensagens((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, message: current } : m))
        );
        index++;
      } else {
        clearInterval(streamInterval);
      }
    }, 20); // Velocidade do streaming
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const handleReact = (id: string, emoji: string) => {
    setMensagens((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const reactions = m.reactions || [];
          if (!reactions.includes(emoji)) {
            return { ...m, reactions: [...reactions, emoji] };
          }
        }
        return m;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex flex-col">
      <div className="flex-1 pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300 flex flex-col">
        <div className="mx-auto max-w-5xl flex-1 flex flex-col pb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-800/70 rounded-xl shadow-md">
              <MessageSquare className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('chat') || 'Chat Global'}</h1>
          </div>

          <Card
            className="flex-1 flex flex-col shadow-2xl border border-zinc-800 bg-zinc-900/50 rounded-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Chat Global da Equipe</h2>
              <p className="text-sm text-zinc-400 mt-1">Converse com todos os membros da equipe em tempo real</p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar mensagens..."
                className="mt-4 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div
              ref={chatRef}
              className="flex-1 min-h-0 overflow-y-auto space-y-5 p-6"
              onScroll={handleScroll}
            >
              {mensagensGlobais.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-xl font-medium">Nenhuma mensagem ainda.</p>
                  <p className="text-base mt-2 opacity-80">Seja o primeiro a falar!</p>
                </div>
              ) : (
                mensagensGlobais.map((msg) => {
                  const isMe = msg.senderId === (user?.id || 'current-user');
                  const senderName = msg.senderName || (isMe ? 'Você' : msg.senderId || 'Equipe');
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=4B5563&color=fff&rounded=true&bold=true&size=128`;
                  const replyMsg = msg.replyToId ? mensagensGlobais.find((m) => m.id === msg.replyToId) : null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`}
                      onMouseEnter={() => setHoveredId(msg.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {!isMe && (
                        <div className="relative">
                          <img
                            src={avatarUrl}
                            alt={senderName}
                            className="w-8 h-8 rounded-full flex-shrink-0 mt-1 shadow-sm"
                          />
                          {msg.senderId === 'grok' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-zinc-900" />
                          )}
                        </div>
                      )}
                      <div
                        className={`relative max-w-[70%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md
                          ${isMe ? 'bg-indigo-600/90 text-white rounded-tr-none' : 'bg-zinc-800/90 text-zinc-100 rounded-tl-none border border-zinc-700'}`}
                      >
                        <p className="font-semibold text-sm opacity-90 mb-1">{senderName}</p>
                        {replyMsg && (
                          <div className="mb-2 p-2 bg-zinc-900/50 rounded border-l-4 border-indigo-500">
                            <p className="text-xs font-medium">{replyMsg.senderName}</p>
                            <p className="text-xs text-zinc-400 line-clamp-2">{replyMsg.message}</p>
                          </div>
                        )}
                        {msg.message === '' ? (
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                        ) : (
                          <div className="prose prose-invert text-inherit prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:text-inherit prose-a:text-indigo-400">
                            {msg.message}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-2 text-right">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {msg.reactions.map((r: string, i: number) => (
                              <span key={i} className="text-sm bg-zinc-700/50 px-2 py-1 rounded-full">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                        {hoveredId === msg.id && (
                          <div
                            className={`absolute top-0 -translate-y-1/2 flex gap-2 bg-zinc-800/80 p-1 rounded-full shadow-lg ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}`}
                          >
                            <button
                              onClick={() => handleReact(msg.id, '👍')}
                              className="hover:text-indigo-400"
                              title="Reagir com 👍"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(msg.message)}
                              className="hover:text-indigo-400"
                              title="Copiar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="hover:text-indigo-400"
                              title="Responder"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isMe && (
                        <img
                          src={avatarUrl}
                          alt={senderName}
                          className="w-8 h-8 rounded-full flex-shrink-0 mt-1 shadow-sm"
                        />
                      )}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} className="h-0" />
            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
              {replyingTo && (
                <div className="mb-3 bg-zinc-800/50 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Respondendo a {replyingTo.senderName}</p>
                    <p className="text-xs text-zinc-400 line-clamp-1">{replyingTo.message}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-white">
                    X
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  ref={textareaRef}
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="
                    flex-1 bg-zinc-900 border border-zinc-700 rounded-xl 
                    px-5 py-3.5 text-zinc-100 placeholder-zinc-500 
                    focus:outline-none focus:border-indigo-500 focus:ring-1 
                    focus:ring-indigo-500/30 transition-all resize-none overflow-hidden
                    max-h-32
                  "
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviar();
                    }
                  }}
                  disabled={enviando || isLoading}
                />

                <Button
                  variant="primary"
                  icon={<Send className="w-5 h-5" />}
                  onClick={handleEnviar}
                  disabled={!novaMensagem.trim() || enviando || isLoading}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}