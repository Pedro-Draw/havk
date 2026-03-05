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
  Send,
  Sparkles,
  ShieldCheck,
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
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, [mouseX, mouseY]);

  const subscribe = () => {
    if (!email || !email.includes("@")) return;

    setSubscribed(true);
    setEmail("");

    setTimeout(() => {
      setSubscribed(false);
    }, 2500);
  };

  return (
    <footer className="relative bg-black border-t border-zinc-800 text-zinc-500 overflow-hidden text-[10px]">
      {/* GLOW BACKGROUND */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          x: springX,
          y: springY,
          background:
            "radial-gradient(circle at center, rgba(120,120,255,0.15), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 lg:pl-[280px] py-6 relative z-10">
        {/* TRUST BADGES */}
        <div className="flex flex-wrap justify-center gap-3 opacity-70 mb-4">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            Segurança
          </div>

          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            Performance
          </div>

          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-purple-400" />
            Premium
          </div>

          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" />
            Paixão
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="p-[1px] rounded-lg bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 mb-6">
          <div className="bg-zinc-950 rounded-lg p-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-center sm:text-left">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="text-yellow-400 w-3.5 h-3.5" />
                  Havk Comunidade
                </h2>

                <p className="text-[9px] text-zinc-500 mt-0.5">
                  Novidades SaaS no e-mail.
                </p>
              </div>

              <div className="flex w-full sm:w-auto gap-1.5">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] focus:outline-none focus:border-purple-500"
                />

                <button
                  onClick={subscribe}
                  disabled={subscribed}
                  className={clsx(
                    "px-3 py-1.5 rounded-md font-semibold flex items-center gap-1 text-[10px] whitespace-nowrap transition",
                    subscribed
                      ? "bg-green-500 text-white"
                      : "bg-white text-black hover:opacity-90"
                  )}
                >
                  <Send className="w-3 h-3" />
                  {subscribed ? "OK" : "Ir"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GRID LINKS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BRAND */}
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Havk
            </h1>

            <p className="mt-1 text-[10px] text-zinc-500">
              SaaS para equipes e produtividade.
            </p>

            <div className="flex gap-3 mt-2">
              <a href="#" aria-label="Github">
                <Github className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
              </a>

              <a href="#" aria-label="Twitter">
                <Twitter className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
              </a>

              <a href="mailto:pedrocesar.draw@gmail.com" aria-label="Email">
                <Mail className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-white font-semibold mb-1.5 text-[11px]">
              Contato
            </h3>

            <div className="space-y-1 text-[10px]">
              <a
                href="tel:+5561982610405"
                className="flex gap-1.5 hover:text-white items-center transition-colors"
              >
                <Phone className="w-3 h-3 text-blue-400" />
                (61) 98261-0405
              </a>

              <a
                href="https://wa.me/5561982610405"
                className="flex gap-1.5 hover:text-white items-center transition-colors"
              >
                <MessageCircle className="w-3 h-3 text-blue-400" />
                WhatsApp
              </a>

              <a
                href="mailto:pedrocesar.draw@gmail.com"
                className="flex gap-1.5 hover:text-white items-center transition-colors"
              >
                <Mail className="w-3 h-3 text-blue-400" />
                Email
              </a>
            </div>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="text-white font-semibold mb-1.5 text-[11px]">
              Legal
            </h3>

            <div className="space-y-1 text-[10px]">
              <a className="flex gap-1.5 hover:text-white items-center transition-colors">
                <FileText className="w-3 h-3 text-purple-400" />
                Termos
              </a>

              <a className="flex gap-1.5 hover:text-white items-center transition-colors">
                <FileText className="w-3 h-3 text-purple-400" />
                Privacidade
              </a>

              <a className="flex gap-1.5 hover:text-white items-center transition-colors">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Compliance
              </a>
            </div>
          </div>

          {/* TECHNOLOGY */}
          <div>
            <h3 className="text-white font-semibold mb-1.5 text-[11px]">
              Tecnologia
            </h3>

            <div className="space-y-1 text-[10px]">
              <div className="flex gap-1.5 items-center">
                <Server className="w-3 h-3 text-emerald-400" />
                Cloud
              </div>

              <div className="flex gap-1.5 items-center">
                <Database className="w-3 h-3 text-emerald-400" />
                Cripto
              </div>

              <div className="flex gap-1.5 items-center">
                <Code className="w-3 h-3 text-emerald-400" />
                Seguro
              </div>
            </div>
          </div>
        </div>

        {/* HELP */}
        <div className="mt-6 border-t border-zinc-800 pt-4 text-[10px] text-zinc-500">
          <h3 className="text-white mb-2 flex items-center gap-1.5 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            Ajuda & Support
          </h3>

          <div className="grid md:grid-cols-2 gap-2">
            <div className="bg-zinc-900 p-2.5 rounded-md">
              <p className="text-white font-medium text-[11px]">FAQ</p>
              <p className="text-[9px] mt-0.5 text-zinc-400">
                Ajuda e suporte.
              </p>
            </div>

            <div className="bg-zinc-900 p-2.5 rounded-md">
              <p className="text-white font-medium text-[11px]">Legal</p>
              <p className="text-[9px] mt-0.5 text-zinc-400">
                Termos e compliance.
              </p>
            </div>
          </div>
        </div>

        {/* META */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-center text-[10px] text-zinc-500 space-y-1">
          <div className="flex justify-center gap-3">
            <Globe className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
            <Moon className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
            <Sun className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
            <BarChart3 className="w-3.5 h-3.5 text-zinc-400 hover:text-white transition-colors" />
          </div>

          <div>© {year} Havk — Todos os direitos reservados.</div>
        </div>
      </div>
    </footer>
  );
}