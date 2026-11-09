import { useAppStore } from '../store/useAppStore';

const recent = new Map<string, number>();

function iconUrl() {
  return new URL(`${import.meta.env.BASE_URL}apple-touch-icon.png`, window.location.origin).href;
}

function polish(message: string) {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (clean.length <= 140) return clean;
  return `${clean.slice(0, 137)}…`;
}

export function devicePermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestDevicePermission() {
  if (typeof Notification === 'undefined') return 'unsupported' as const;
  return Notification.requestPermission();
}

export async function showDeviceNotification(body: string) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (useAppStore.getState().notificationPreferences.device === false) return;

  const message = polish(body);
  if (!message) return;

  const now = Date.now();
  const last = recent.get(message) || 0;
  if (now - last < 3500) return;
  recent.set(message, now);

  const state = useAppStore.getState();
  const empresa = state.empresas.find((item) => item.id === state.activeEmpresaId);
  const title = empresa?.name ? `Havk · ${empresa.name}` : 'Havk';
  const icon = iconUrl();
  const tag = `havk-${message.slice(0, 48)}`;

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, {
        body: message,
        icon,
        badge: icon,
        tag,
        data: { url: window.location.href },
      });
      return;
    }
  } catch {
    /* o aviso da página cobre o caso */
  }

  const controller = navigator.serviceWorker?.controller;
  if (controller) {
    controller.postMessage({
      type: 'havk-notify',
      title,
      body: message,
      icon,
      badge: icon,
      tag,
      url: window.location.href,
    });
    return;
  }

  new Notification(title, { body: message, icon, tag });
}
