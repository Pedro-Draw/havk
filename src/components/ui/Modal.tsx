import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide';
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
    wide: 'sm:max-w-5xl',
  };

  return (
    <div data-havk-overlay className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl ${sizeClasses[size]}`}
        style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div className="glass-bar sticky top-0 z-10 flex items-center justify-between gap-4 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-4">
            {title && (
              <h2 id="modal-title" className="truncate text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="glass-icon ml-auto"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="overlay-scroll overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>

        {onConfirm && (
          <div className="glass-bar sticky bottom-0 z-10 flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="glass-button glass-button-secondary rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="glass-button glass-button-primary rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
