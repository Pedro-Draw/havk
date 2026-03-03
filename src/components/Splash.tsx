import { useEffect, useState } from "react";

interface SplashProps {
  duration?: number; // tempo que o splash ficará visível em ms
  onFinish?: () => void; // callback quando acabar o splash
}

export default function Splash({ duration = 2000, onFinish }: SplashProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), duration);
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, duration + 500); // espera a animação de fade-out
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 bg-zinc-950 flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/image/splash.png"
        alt="Havk Logo"
        className="w-48 h-48 animate-fade-in"
      />
    </div>
  );
}