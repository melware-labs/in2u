import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export type PushStatus = 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed';

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';

  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'prompt';

  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return 'unsubscribed';
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'subscribed' : 'unsubscribed';
  } catch {
    return 'unsubscribed';
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.error('Error registrando service worker:', err);
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;

  const keyResponse = await api.getPushPublicKey();
  if (!keyResponse?.publicKey) {
    throw new Error('No se pudo obtener la clave pública VAPID.');
  }

  const convertedKey = urlBase64ToUint8Array(keyResponse.publicKey);
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey as unknown as BufferSource,
  });

  const subJson = sub.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error('Suscripción Web Push incompleta.');
  }

  await api.subscribePush({
    endpoint: subJson.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
  });

  return true;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try {
        await api.unsubscribePush(sub.endpoint);
      } catch (e) {
        console.warn('Error eliminando endpoint en el servidor:', e);
      }
      await sub.unsubscribe();
    }
    return true;
  } catch (e) {
    console.error('Error al cancelar suscripción push:', e);
    return false;
  }
}
