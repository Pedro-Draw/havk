import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Configurações do Dragão
const SEGMENT_COUNT = 12; // Número de segmentos do corpo
const SEGMENT_SIZE = 16;  // Tamanho base de cada segmento em pixels

const DragonSegment = ({ index, x, y }: { index: number; x: any; y: any }) => {
  // Tamanho diminui conforme se aproxima da cauda para dar o efeito da imagem
  const size = Math.max(4, SEGMENT_SIZE - index * 1.2);
  const opacity = 1 - (index / SEGMENT_COUNT) * 0.5;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        x: '-50%',
        y: '-50%',
        opacity: opacity,
        zIndex: SEGMENT_COUNT - index,
      }}
      className="dragon-pixel"
    />
  );
};

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Coordenadas da cabeça (alvo do movimento)
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  // Estados para cada segmento seguir o anterior
  const segments = Array.from({ length: SEGMENT_COUNT }).map((_, i) => ({
    x: useSpring(0, { stiffness: 100 - i * 5, damping: 20 + i * 2 }),
    y: useSpring(0, { stiffness: 100 - i * 5, damping: 20 + i * 2 }),
  }));

  useEffect(() => {
    // Centraliza inicialmente
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    targetX.set(centerX);
    targetY.set(centerY);
    segments.forEach(s => {
      s.x.set(centerX);
      s.y.set(centerY);
    });

    // Lógica de movimento autônomo (nadando pela tela)
    let angle = 0;
    const moveInterval = setInterval(() => {
      angle += 0.05;
      const radiusX = window.innerWidth * 0.3;
      const radiusY = window.innerHeight * 0.3;
      
      // Movimento em "infinito" ou circular fluido
      const nextX = centerX + Math.cos(angle) * radiusX + Math.sin(angle * 0.5) * (radiusX * 0.5);
      const nextY = centerY + Math.sin(angle * 0.8) * radiusY;
      
      targetX.set(nextX);
      targetY.set(nextY);
    }, 16);

    // Cada segmento segue o anterior
    const followInterval = setInterval(() => {
      segments[0].x.set(targetX.get());
      segments[0].y.set(targetY.get());
      
      for (let i = 1; i < SEGMENT_COUNT; i++) {
        // Delay suave para criar o efeito de serpente
        segments[i].x.set(segments[i - 1].x.get());
        segments[i].y.set(segments[i - 1].y.get());
      }
    }, 50);

    const exitTimer = setTimeout(() => setIsVisible(false), 5000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(followInterval);
      clearTimeout(exitTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center overflow-hidden">
        
        {/* Glow de fundo - Roxo Meia Noite */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[120px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Dragão Serpentina */}
        <div className="absolute inset-0 pointer-events-none">
          {segments.map((pos, i) => (
            <DragonSegment key={i} index={i} x={pos.x} y={pos.y} />
          ))}
        </div>

        {/* Conteúdo Central */}
        <div className="flex flex-col items-center justify-center gap-6 relative z-10">
          
          {/* Logo Havk Personalizado */}
          <div className="relative">
            <motion.h1
              className="text-7xl font-black tracking-tighter italic text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                textShadow: '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(79, 70, 229, 0.3)'
              }}
            >
              HAVK
            </motion.h1>
            
            {/* Linhas decorativas roxas */}
            <motion.div 
              className="absolute -bottom-2 left-0 h-[2px] bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5, duration: 1.5 }}
            />
            <motion.div 
              className="absolute -top-1 right-0 h-[1px] bg-indigo-400/50"
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ delay: 0.8, duration: 1.2 }}
            />
          </div>

          <motion.p 
            className="text-indigo-300/60 text-xs tracking-[0.3em] uppercase font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Sincronizando Sistemas...
          </motion.p>
        </div>
      </div>

      <style>
        {`
          .dragon-pixel {
            background: transparent;
            /* Pixel Art do segmento: tons de roxo meia-noite e indigo */
            box-shadow: 
              0px 0px #4338ca, 1px 0px #4338ca,
              0px 1px #4338ca, 1px 1px #312e81,
              /* Brilho externo (Roxo Meia Noite) */
              0 0 10px rgba(67, 56, 202, 0.6);
            border-radius: 2px;
          }

          /* Detalhe especial para a cabeça (index 0) */
          .dragon-pixel:first-child {
            box-shadow: 
              0px 0px #6366f1, 1px 0px #6366f1, 2px 0px #6366f1,
              0px 1px #6366f1, 1px 1px #ffffff, 2px 1px #6366f1,
              0px 2px #6366f1, 1px 2px #6366f1, 2px 2px #6366f1,
              0 0 15px rgba(99, 102, 241, 0.8);
            width: 20px !important;
            height: 20px !important;
          }

          /* Efeito de rastro/partículas no fundo */
          .fixed::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.05) 1px, transparent 0);
            background-size: 40px 40px;
          }
        `}
      </style>
    </>
  );
};

export default SplashScreen;