// pages/ChatGlobal.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export default function ChatGlobal() {
  const { t } = useTranslation();
  const {
    chatMensagens,
    addChatMensagem,
    user,           // para mostrar nome real do usuário logado
    isLoading,
  } = useAppStore();

  const [novaMensagem, setNovaMensagem] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;

    try {
      await addChatMensagem({
        message: novaMensagem.trim(),
        senderId: user?.id || 'current-user', // usa ID real do usuário logado
        channel: 'global',
      });

      setNovaMensagem('');
      toast.success('Mensagem enviada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar mensagem');
    }
  };

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMensagens]);

  // Filtra apenas mensagens do canal global e ordena por data
  const mensagensGlobais = useMemo(() => {
    return [...chatMensagens]
      .filter((m) => m.channel === 'global')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [chatMensagens]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pt-20 lg:pl-64 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-5xl pb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-800/70 rounded-xl">
              <MessageSquare className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('chat') || 'Chat Global'}</h1>
          </div>

          <Card
            title="Chat Global da Equipe"
            description="Converse com todos os membros da equipe em tempo real"
            className="shadow-2xl border-zinc-800"
          >
            <div className="h-[65vh] overflow-y-auto mb-6 space-y-5 p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              {mensagensGlobais.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma mensagem ainda.</p>
                  <p className="text-sm mt-2">Seja o primeiro a falar!</p>
                </div>
              ) : (
                mensagensGlobais.map((msg) => {
                  const isMe = msg.senderId === (user?.id || 'current-user');
                  const senderName = isMe ? 'Você' : msg.senderId || 'Equipe';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`
                          max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                          ${
                            isMe
                              ? 'bg-indigo-600/90 text-white rounded-tr-none'
                              : 'bg-zinc-800/90 text-zinc-100 rounded-tl-none border border-zinc-700'
                          }
                        `}
                      >
                        <p className="font-medium text-xs opacity-90 mb-1">
                          {senderName}
                        </p>
                        <p className="whitespace-pre-line">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-2 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={bottomRef} />
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="
                  flex-1 bg-zinc-900 border border-zinc-700 rounded-xl 
                  px-5 py-3.5 text-zinc-100 placeholder-zinc-500 
                  focus:outline-none focus:border-indigo-500 focus:ring-1 
                  focus:ring-indigo-500/30 transition-all
                "
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
                disabled={isLoading}
              />

              <Button
                variant="primary"
                icon={<Send className="w-5 h-5" />}
                onClick={handleEnviar}
                disabled={!novaMensagem.trim() || isLoading}
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