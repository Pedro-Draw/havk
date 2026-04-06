import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: 'bg-green-900/30 border-green-800 text-green-300',
    error: 'bg-red-900/30 border-red-800 text-red-300',
    info: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-300',
  };

  return (
    <div 
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-slideIn',
        types[type]
      )}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-black/20 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}