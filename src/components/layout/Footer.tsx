import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import clsx from "clsx";

import {
  Github,
  Twitter,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  HelpCircle,
  UserPlus,
  Users,
  ShieldCheck,
  Send,
  Sparkles,
  Lock,
  Globe,
  Sun,
  Moon,
  Heart,
  Award,
  Zap,
  Server,
  Database,
  Code,
  BarChart3,
} from "lucide-react";

export default function Footer() {

  const year = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200 };

  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const subscribe = () => {
    if (!email.includes("@")) return;

    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="relative bg-black border-t border-zinc-800 text-zinc-400 overflow-hidden">

      {/* GLOW BACKGROUND */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          x: springX,
          y: springY,
          background:
            "radial-gradient(circle at center, rgba(120,120,255,0.25), transparent 70%)"
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 lg:pl-[280px] py-28 relative z-10">

        {/* TRUST BADGES */}
        <div className="flex flex-wrap justify-center gap-8 text-sm mb-20">

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Segurança Enterprise
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Alta Performance
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            SaaS Premium
          </div>

          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            Construído com paixão
          </div>

        </div>

        {/* NEWSLETTER */}
         {/* NEWSLETTER */}
        <div className="p-[2px] rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-16">
          <div className="bg-zinc-950 rounded-3xl p-6">

            <div className="flex flex-col md:flex-row justify-between gap-6">

              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-yellow-400 w-5 h-5" />
                  Comunidade Havk
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  Receba novidades SaaS e segurança.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm"
                />

                <button
                  onClick={subscribe}
                  className="bg-white text-black px-5 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {subscribed ? "Inscrito" : "Inscrever"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* GRID LINKS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16">

          {/* BRAND */}
          <div>
            <h1 className="text-4xl font-bold text-white">
              Havk
            </h1>

            <p className="mt-5 text-sm text-zinc-500">
              Plataforma SaaS moderna para gestão de equipes e produtividade.
            </p>

            <div className="flex gap-5 mt-6">
              <Github className="hover:text-white cursor-pointer" />
              <Twitter className="hover:text-white cursor-pointer" />
              <Mail className="hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contato</h3>

            <div className="space-y-4 text-sm">

              <a className="flex gap-3 hover:text-white">
                <Phone className="w-4 h-4" />
                (61) 98261-0405
              </a>

              <a className="flex gap-3 hover:text-white">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>

              <a
                href="mailto:pedrocesar.draw@gmail.com"
                className="flex gap-3 hover:text-white"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>

            </div>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="text-white font-semibold mb-6">
              Legal
            </h3>

            <div className="space-y-4 text-sm">

              <a className="flex gap-3 hover:text-white">
                <FileText className="w-4 h-4" />
                Termos de Uso
              </a>

              <a className="flex gap-3 hover:text-white">
                <FileText className="w-4 h-4" />
                Política de Privacidade
              </a>

              <a className="flex gap-3 hover:text-white">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Compliance de dados
              </a>

            </div>
          </div>

          {/* TECHNOLOGY */}
          <div>
            <h3 className="text-white font-semibold mb-6">
              Tecnologia
            </h3>

            <div className="space-y-4 text-sm">

              <div className="flex gap-3">
                <Server className="w-4 h-4 text-green-500" />
                Infra Cloud
              </div>

              <div className="flex gap-3">
                <Database className="w-4 h-4" />
                Dados criptografados
              </div>

              <div className="flex gap-3">
                <Code className="w-4 h-4" />
                Código seguro
              </div>

            </div>
          </div>

        </div>

        {/* FUTURE AI ASSISTANT NOTE (COMMENT STYLE FOR YOU) */}
        <div className="mt-24 border-t border-zinc-800 pt-12 text-sm text-zinc-500">

          {/* 
          FUTURO PLANO (IDEIA SUA 👇)

          ✔ Criar botão flutuante arrastável (position fixed + draggable)
          ✔ Abrir modal chat tipo ChatGPT dentro do site
          ✔ Integrar com backend / IA API
          ✔ Persistir conversa no localStorage ou DB
          ✔ Mostrar bolha de notificação de mensagens

          Componentes futuros sugeridos:
          - FloatingAIAssistantButton.jsx
          - AIChatModal.jsx
          */}

          <h3 className="text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Ajuda & Support
          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            <div className="bg-zinc-900 p-5 rounded-2xl">
              <p className="text-white font-medium">FAQ</p>
              <p className="text-xs mt-2">
                Central de ajuda e suporte.
              </p>
            </div>

            <div className="bg-zinc-900 p-5 rounded-2xl">
              <p className="text-white font-medium">Termos & Legal</p>
              <p className="text-xs mt-2">
                Proteção jurídica e compliance.
              </p>
            </div>

          </div>

        </div>

        {/* META */}
        <div className="mt-24 pt-10 border-t border-zinc-800 text-center text-xs text-zinc-500 space-y-4">

          <div className="flex justify-center gap-6">
            <Globe />
            <Moon />
            <Sun />
            <BarChart3 />
          </div>

          <div>
            © {year} Havk — Todos os direitos reservados.
          </div>

        </div>

      </div>
    </footer>
  );
}