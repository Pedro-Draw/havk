import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export default function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  onConfirm,
  confirmLabel = 'Confirmar',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-2xl ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-white sm:text-xl">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>

        {onConfirm && (
          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
