import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { MessageSquare, Send, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function ChatGlobal() {
  const { t } = useTranslation();
  const [mensagens, setMensagens] = useState([
    { id: 1, user: 'Você', text: 'Bom dia equipe!', time: '09:15' },
    { id: 2, user: 'Ana', text: 'Bom dia! Hoje temos reunião às 10h', time: '09:17' },
  ]);
  const [novaMensagem, setNovaMensagem] = useState('');

  const handleEnviar = () => {
    if (!novaMensagem.trim()) return;

    setMensagens((prev) => [
      ...prev,
      { id: Date.now(), user: 'Você', text: novaMensagem, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setNovaMensagem('');
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-zinc-300" />
          <h1 className="text-3xl font-bold text-white">{t('chat')}</h1>
        </div>

        <Card title="Chat Global da Equipe" description="Converse com todos os membros">
          <div className="h-[60vh] overflow-y-auto mb-6 space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.user === 'Você' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.user === 'Você'
                      ? 'bg-zinc-700 rounded-tr-none'
                      : 'bg-zinc-800 rounded-tl-none'
                  }`}
                >
                  <p className="font-medium text-sm text-zinc-300">{msg.user}</p>
                  <p className="text-zinc-100 mt-1">{msg.text}</p>
                  <p className="text-xs text-zinc-500 mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
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