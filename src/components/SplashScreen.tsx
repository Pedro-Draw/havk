import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Configurações do Dragão - Inspirado na silhueta da imagem
const SEGMENT_COUNT = 30; // Mais segmentos para um corpo longo e fluido

const DragonSegment = ({ index, x, y, angle }: { index: number; x: any; y: any; angle: number }) => {
  const isHead = index === 0;
  
  // O tamanho diminui conforme chega na cauda
  const scale = isHead ? 1.8 : 1.4 - (index / SEGMENT_COUNT) * 1.0;
  const opacity = 1 - (index / SEGMENT_COUNT) * 0.4;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        rotate: angle,
        scale: scale,
        opacity: opacity,
        zIndex: SEGMENT_COUNT - index,
        width: 1,
        height: 1,
      }}
    >
      <div className="relative flex items-center justify-center">
        {isHead ? (
          /* Cabeça do Dragão (Silhueta Negra) */
          <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
            <path 
              d="M30 5 L38 20 L55 25 L38 30 L42 55 L30 45 L18 55 L22 30 L5 25 L22 20 Z" 
              fill="#000" 
            />
            {/* Olhos Brancos Brilhantes */}
            <circle cx="24" cy="25" r="2" fill="#fff" />
            <circle cx="36" cy="25" r="2" fill="#fff" />
            {/* Chifres Longos e Curvos (Estilo Imagem) */}
            <path d="M22 15 Q15 0 5 10" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M38 15 Q45 0 55 10" stroke="#000" strokeWidth="3" fill="none" />
          </svg>
        ) : (
          /* Vértebras e Cerdas Longas (Idêntico à imagem) */
          <div className="relative flex items-center justify-center">
            {/* Vértebra Central (Preta) */}
            <div className="w-5 h-5 bg-black rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]" />
            
            {/* Cerdas/Crinas Laterais Longas e Finas (Inspiradas na foto) */}
            <div className="absolute flex items-center justify-center pointer-events-none">
              <svg width="160" height="80" viewBox="0 0 160 80" className="overflow-visible">
                {/* Cerdas Esquerda - Longas e Curvas */}
                <path d="M80 40 Q40 10 0 30" stroke="rgba(0,0,0,0.9)" strokeWidth="0.8" fill="none" />
                <path d="M80 40 Q40 40 10 65" stroke="rgba(0,0,0,0.7)" strokeWidth="0.8" fill="none" />
                <path d="M80 40 Q55 75 25 80" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" fill="none" />
                
                {/* Cerdas Direita - Longas e Curvas */}
                <path d="M80 40 Q120 10 160 30" stroke="rgba(0,0,0,0.9)" strokeWidth="0.8" fill="none" />
                <path d="M80 40 Q120 40 150 65" stroke="rgba(0,0,0,0.7)" strokeWidth="0.8" fill="none" />
                <path d="M80 40 Q105 75 135 80" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" fill="none" />
                
                {/* Brilho Roxo Meia-Noite nas Cerdas */}
                <path d="M80 40 Q40 10 0 30" stroke="rgba(99,102,241,0.2)" strokeWidth="3" fill="none" className="blur-[3px]" />
                <path d="M80 40 Q120 10 160 30" stroke="rgba(99,102,241,0.2)" strokeWidth="3" fill="none" className="blur-[3px]" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  const segments = Array.from({ length: SEGMENT_COUNT }).map((_, i) => ({
    x: useSpring(0, { stiffness: 180 - i * 5, damping: 40 + i }),
    y: useSpring(0, { stiffness: 180 - i * 5, damping: 40 + i }),
    angle: useMotionValue(0)
  }));

  useEffect(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    targetX.set(centerX);
    targetY.set(centerY);
    segments.forEach(s => { s.x.set(centerX); s.y.set(centerY); });

    let time = 0;
    const moveInterval = setInterval(() => {
      time += 0.02;
      const rx = window.innerWidth * 0.4;
      const ry = window.innerHeight * 0.38;
      const nx = centerX + Math.cos(time) * rx + Math.sin(time * 0.5) * (rx * 0.4);
      const ny = centerY + Math.sin(time * 0.7) * ry;
      targetX.set(nx);
      targetY.set(ny);
    }, 16);

    const followInterval = setInterval(() => {
      const tx = targetX.get();
      const ty = targetY.get();
      
      const dx = tx - segments[0].x.get();
      const dy = ty - segments[0].y.get();
      if (Math.abs(dx) > 0.1) segments[0].angle.set(Math.atan2(dy, dx) * 180 / Math.PI + 90);
      segments[0].x.set(tx);
      segments[0].y.set(ty);

      for (let i = 1; i < SEGMENT_COUNT; i++) {
        const px = segments[i-1].x.get();
        const py = segments[i-1].y.get();
        const cx = segments[i].x.get();
        const cy = segments[i].y.get();
        const sdx = px - cx;
        const sdy = py - cy;
        if (Math.abs(sdx) > 0.1) segments[i].angle.set(Math.atan2(sdy, sdx) * 180 / Math.PI + 90);
        segments[i].x.set(px);
        segments[i].y.set(py);
      }
    }, 25);

    const timer = setTimeout(() => setIsVisible(false), 10000);
    return () => { clearInterval(moveInterval); clearInterval(followInterval); clearTimeout(timer); };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center overflow-hidden">
        
        {/* Glow de fundo Atmosférico */}
        <motion.div
          className="absolute w-[1200px] h-[1200px] rounded-full bg-indigo-900/10 blur-[250px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        {/* DRAGÃO (SILHUETA VERTEBRAL DA IMAGEM) */}
        <div className="absolute inset-0 pointer-events-none">
          {segments.map((pos, i) => (
            <DragonSegment key={i} index={i} x={pos.x} y={pos.y} angle={pos.angle} />
          ))}
        </div>

        {/* LOGO HAVK CENTRAL */}
        <div className="flex flex-col items-center justify-center gap-16 relative z-50">
          <div className="relative">
            <motion.h1
              className="text-9xl font-black tracking-tighter italic text-white select-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{
                textShadow: '0 0 40px rgba(99, 102, 241, 0.5), 0 0 80px rgba(79, 70, 229, 0.3)'
              }}
            >
              HAVK
            </motion.h1>
            <motion.div 
              className="absolute -bottom-6 left-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              initial={{ width: 0, left: '50%' }}
              animate={{ width: '100%', left: '0%' }}
              transition={{ delay: 1.5, duration: 2.5 }}
            />
          </div>

          <motion.div 
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
          >
            <div className="w-60 h-[1px] bg-white/5 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-indigo-500/50"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <span className="text-indigo-400/20 text-[10px] tracking-[1em] uppercase font-bold">
              ESTABELECENDO DOMÍNIO
            </span>
          </motion.div>
        </div>
      </div>

      <style>
        {`
          body { margin: 0; background: #020617; overflow: hidden; }
        `}
      </style>
    </>
  );
};

export default SplashScreen;
