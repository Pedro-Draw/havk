import { useEffect, useState } from 'react';

export interface ConfirmRequest {
  id: number;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: 'danger' | 'default';
  resolve: (value: boolean) => void;
}

let current: ConfirmRequest | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function publish() {
  listeners.forEach((listener) => listener());
}

export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}) {
  return new Promise<boolean>((resolve) => {
    if (current) current.resolve(false);
    current = {
      id: nextId++,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Confirmar',
      cancelLabel: options.cancelLabel || 'Cancelar',
      tone: options.tone || 'default',
      resolve,
    };
    publish();
  });
}

export function settleConfirm(value: boolean) {
  if (!current) return;
  const pending = current;
  current = null;
  pending.resolve(value);
  publish();
}

export function useConfirmRequest() {
  const [, bump] = useState(0);
  useEffect(() => {
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return current;
}
