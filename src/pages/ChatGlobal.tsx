import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

export default function ChatGlobal() {
  const { t } = useTranslation();
  const { chatMensagens, addChatMensagem } = useAppStore();

  const [novaMensagem, setNovaMensagem] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;

    await addChatMensagem({
      user: 'Você',
      text: novaMensagem,
      channel: 'global',
    });

    setNovaMensagem('');
  };

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMensagens]);

  const mensagensOrdenadas = [...chatMensagens]
    .filter((m) => m.channel === 'global')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

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
        <div className="mx-auto max-w-5xl pb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-800/70 rounded-xl">
              <MessageSquare className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('chat')}</h1>
          </div>

          <Card
            title="Chat Global da Equipe"
            description="Converse com todos os membros da equipe em tempo real"
            className="shadow-2xl border-zinc-800"
          >
            <div className="h-[65vh] overflow-y-auto mb-6 space-y-5 p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              {mensagensOrdenadas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma mensagem ainda.</p>
                  <p className="text-sm mt-2">Seja o primeiro a falar!</p>
                </div>
              ) : (
                mensagensOrdenadas.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.user === 'Você' ? 'justify-end' : 'justify-start'
                    } animate-fade-in`}
                  >
                    <div
                      className={`
                        max-w-[75%] rounded-2xl px-5 py-3.5 text-sm
                        ${
                          msg.user === 'Você'
                            ? 'bg-indigo-600/90 text-white rounded-tr-none'
                            : 'bg-zinc-800/90 text-zinc-100 rounded-tl-none border border-zinc-700'
                        }
                      `}
                    >
                      <p className="font-medium text-xs opacity-90 mb-1">
                        {msg.user}
                      </p>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-2 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
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
              />

              <Button
                variant="primary"
                icon={<Send className="w-5 h-5" />}
                onClick={handleEnviar}
                disabled={!novaMensagem.trim()}
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