import { useEffect, useRef } from 'react';
import { resolveValue, toast, Toaster, useToaster, type Toast } from 'react-hot-toast';
import { showDeviceNotification } from '../../lib/deviceNotify';

function textOf(item: Toast) {
  const value = resolveValue(item.message, item);
  return typeof value === 'string' ? value.trim() : '';
}

function kicker(type: Toast['type']) {
  if (type === 'success') return 'Concluído';
  if (type === 'error') return 'Não foi possível';
  if (type === 'loading') return 'Em andamento';
  return 'Havk';
}

function DeviceToastBridge() {
  const { toasts } = useToaster();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    for (const item of toasts) {
      if (!item.visible || item.type === 'loading' || seen.current.has(item.id)) continue;
      const message = textOf(item);
      if (!message) continue;
      seen.current.add(item.id);
      void showDeviceNotification(message);
    }
  }, [toasts]);

  return null;
}

export default function HavkToaster() {
  const logo = `${import.meta.env.BASE_URL}apple-touch-icon.png`;

  return (
    <>
      <DeviceToastBridge />
      <Toaster
        position="top-center"
        gutter={12}
        containerClassName="havk-toaster"
        toastOptions={{
          duration: 4600,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            color: 'inherit',
            maxWidth: '440px',
          },
        }}
      >
        {(item) => {
          const value = resolveValue(item.message, item);
          if (typeof value !== 'string') {
            return <div className="pointer-events-auto">{value}</div>;
          }
          const message = value.trim();
          return (
            <div className={`havk-toast havk-toast-${item.type}`} role="status">
              <img src={logo} alt="" className="havk-toast-logo" />
              <div className="min-w-0 flex-1">
                <p className="havk-toast-kicker">{kicker(item.type)}</p>
                <p className="havk-toast-message">{message}</p>
              </div>
              <button type="button" className="havk-toast-close" aria-label="Fechar aviso" onClick={() => toast.dismiss(item.id)}>
                ×
              </button>
            </div>
          );
        }}
      </Toaster>
    </>
  );
}
