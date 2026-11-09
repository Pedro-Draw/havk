import { settleConfirm, useConfirmRequest } from '../../lib/confirm';

export default function ConfirmDialog() {
  const request = useConfirmRequest();
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-4 sm:items-center" role="presentation" onClick={() => settleConfirm(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="havk-confirm w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="havk-toast-logo" />
        <div className="min-w-0 flex-1">
          <h2 id="confirm-title" className="text-base font-semibold text-[var(--text)]">{request.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{request.message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="glass-button glass-button-secondary touch-target rounded-full px-4 text-sm" onClick={() => settleConfirm(false)}>
              {request.cancelLabel}
            </button>
            <button
              type="button"
              className={`touch-target rounded-full px-4 text-sm font-medium text-white ${request.tone === 'danger' ? 'bg-red-600' : 'bg-violet-600'}`}
              onClick={() => settleConfirm(true)}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
