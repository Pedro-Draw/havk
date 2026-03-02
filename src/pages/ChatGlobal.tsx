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

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMensagens]);

  const mensagensOrdenadas = [...chatMensagens]
    .filter((m) => m.channel === 'global')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('chat')}</h1>
        </div>

        <Card
          title="Chat Global da Equipe"
          description="Converse com todos os membros"
        >
          <div className="h-[60vh] overflow-y-auto mb-6 space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            {mensagensOrdenadas.length === 0 && (
              <p className="text-zinc-500 text-center mt-20">
                Nenhuma mensagem ainda.
              </p>
            )}

            {mensagensOrdenadas.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.user === 'Você' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.user === 'Você'
                      ? 'bg-zinc-700 rounded-tr-none'
                      : 'bg-zinc-800 rounded-tl-none'
                  }`}
                >
                  <p className="font-medium text-sm text-zinc-300">
                    {msg.user}
                  </p>
                  <p className="text-zinc-100 mt-1">{msg.text}</p>
                  <p className="text-xs text-zinc-500 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
            />

            <Button
              variant="primary"
              icon={<Send className="w-5 h-5" />}
              onClick={handleEnviar}
            >
              Enviar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}