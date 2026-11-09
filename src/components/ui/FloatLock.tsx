import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function FloatLock({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <button
      type="button"
      data-havk-overlay
      aria-label="Fechar"
      className="fixed inset-0 z-30 cursor-default border-0 bg-transparent"
      onClick={onClose}
    />,
    document.body,
  );
}
