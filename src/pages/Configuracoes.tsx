import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Copy,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function ChatGlobal() {

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    const saved = localStorage.getItem("ai_chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length) setCurrentChatId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ai_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const createChat = () => {

    const chat: Chat = {
      id: crypto.randomUUID(),
      title: "Nova conversa",
      messages: []
    };

    setChats(prev => [chat, ...prev]);
    setCurrentChatId(chat.id);
  };

  const fakeAI = async (prompt: string) => {

    await new Promise(r => setTimeout(r, 900));

    if (prompt.startsWith("/help")) {
      return `
### Comandos

/help → mostra ajuda  
/clear → limpar conversa  

Você pode perguntar qualquer coisa.
`;
    }

    if (prompt.startsWith("/clear")) {
      updateMessages([]);
      return "Conversa limpa.";
    }

    return `
Você perguntou:

> ${prompt}

Esta é uma **IA simulada** funcionando sem API.

### Capacidades

- responde perguntas
- mostra código
- aceita markdown

### Exemplo de código

\`\`\`ts
function hello() {
  console.log("IA funcionando")
}
\`\`\`

Quando conectar OpenAI ou Grok, respostas serão reais.
`;
  };

  const updateMessages = (messages: Message[]) => {

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages }
          : chat
      )
    );
  };

  const sendMessage = async () => {

    if (!input.trim() || !currentChat) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      createdAt: Date.now()
    };

    const newMessages = [...currentChat.messages, userMessage];

    updateMessages(newMessages);

    setInput("");
    setLoading(true);

    const response = await fakeAI(input);

    const botMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
      createdAt: Date.now()
    };

    updateMessages([...newMessages, botMessage]);

    setLoading(false);
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const regenerate = async () => {

    if (!currentChat) return;

    const lastUser = [...currentChat.messages]
      .reverse()
      .find(m => m.role === "user");

    if (!lastUser) return;

    setLoading(true);

    const response = await fakeAI(lastUser.content);

    const botMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
      createdAt: Date.now()
    };

    updateMessages([...currentChat.messages, botMessage]);

    setLoading(false);
  };

  const clearChat = () => {
    if (!currentChat) return;
    updateMessages([]);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">

      {/* sidebar */}

      <div className="w-64 border-r border-zinc-800 flex flex-col">

        <div className="p-4 border-b border-zinc-800">

          <button
            onClick={createChat}
            className="flex items-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded"
          >
            <Plus size={16} />
            Nova conversa
          </button>

        </div>

        <div className="flex-1 overflow-y-auto">

          {chats.map(chat => (

            <div
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-zinc-800 ${
                chat.id === currentChatId && "bg-zinc-800"
              }`}
            >
              {chat.title}
            </div>

          ))}

        </div>

      </div>


      {/* chat */}

      <div className="flex-1 flex flex-col">

        <div className="border-b border-zinc-800 px-6 py-4 flex justify-between">

          <div className="flex items-center gap-2">

            <Bot className="text-indigo-400" />
            <span>Chat IA</span>

          </div>

          <button
            onClick={clearChat}
            className="text-zinc-400 hover:text-white flex gap-2"
          >
            <Trash2 size={16} />
            Limpar
          </button>

        </div>


        {/* mensagens */}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {currentChat?.messages.length === 0 && (

            <div className="text-center mt-20 opacity-60">

              <Bot className="w-12 h-12 mx-auto mb-4" />

              <h2 className="text-xl font-semibold">
                Pergunte qualquer coisa
              </h2>

            </div>

          )}

          {currentChat?.messages.map(msg => {

            const isUser = msg.role === "user";

            return (

              <div
                key={msg.id}
                className={`flex gap-4 ${isUser && "justify-end"}`}
              >

                {!isUser && (
                  <Bot className="w-7 h-7 text-indigo-400 mt-1" />
                )}

                <div
                  className={`max-w-3xl rounded-xl p-4 text-sm ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >

                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>

                  {!isUser && (

                    <div className="flex gap-3 mt-3 text-zinc-400">

                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="hover:text-white"
                      >
                        <Copy size={16} />
                      </button>

                      <button
                        onClick={regenerate}
                        className="hover:text-white"
                      >
                        <RefreshCw size={16} />
                      </button>

                    </div>

                  )}

                </div>

                {isUser && (
                  <User className="w-7 h-7 text-zinc-400 mt-1" />
                )}

              </div>

            );

          })}

          {loading && (

            <div className="flex gap-3 items-center">

              <Loader2 className="animate-spin text-indigo-400" />

              <span className="text-sm opacity-70">
                IA pensando...
              </span>

            </div>

          )}

          <div ref={bottomRef} />

        </div>


        {/* input */}

        <div className="border-t border-zinc-800 p-4">

          <div className="flex gap-3">

            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte qualquer coisa..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-4 py-3 resize-none focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => {

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }

              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded flex items-center"
            >
              <Send size={18} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}