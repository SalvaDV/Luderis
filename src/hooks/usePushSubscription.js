import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_KEY } from '../supabase';

const VAPID_PUBLIC = process.env.REACT_APP_VAPID_PUBLIC || 'BHnOLemuaXWYcphBnFBKmkdjHgumyJkyS4xz3SqDS28UtfkUkK99OQwXBhg1C09Ek3PXY2MEiERsxokoTOH98-E';
const ASKED_KEY = 'cl_push_asked';

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function usePushSubscription(session) {
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState(() => supported ? Notification.permission : 'unsupported');
  const [showBanner, setShowBanner] = useState(false);

  // Mostrar el banner solo si el permiso aún no fue decidido, no se pidió antes,
  // y el usuario ya completó el onboarding (momento de máximo contexto/engagement).
  // Para el usuario que JUSTO termina el onboarding, App llama a triggerBanner().
  const canAsk = useCallback(() => {
    if (!supported || !session?.access_token) return false;
    if (permission !== 'default') return false;
    try { if (localStorage.getItem(ASKED_KEY)) return false; } catch {}
    return true;
  }, [supported, session?.access_token, permission]);

  // Usuarios que ya completaron el onboarding en sesiones previas: mostrar el banner
  // poco después de cargar la app (no a ciegas a los 8s sin contexto).
  useEffect(() => {
    if (!canAsk()) return;
    let done = false;
    try { done = !!localStorage.getItem('cl_onboarding_done_' + session.user.email); } catch {}
    if (!done) return; // todavía no completó onboarding → App disparará el banner al terminar
    const t = setTimeout(() => setShowBanner(true), 1500);
    return () => clearTimeout(t);
  }, [canAsk, session?.user?.email]); // eslint-disable-line

  // Llamado por App.js cuando el usuario termina el onboarding en esta sesión.
  const triggerBanner = useCallback(() => {
    if (!canAsk()) return;
    setTimeout(() => setShowBanner(true), 800);
  }, [canAsk]);

  const subscribe = useCallback(async () => {
    if (!supported || !session?.access_token) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      try { localStorage.setItem(ASKED_KEY, '1'); } catch {}
      setShowBanner(false);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=ignore-duplicates',
        },
        body: JSON.stringify({ user_email: session.user.email, subscription: sub.toJSON() }),
      });
      return true;
    } catch (e) {
      console.error('[Push] subscribe error', e);
      return false;
    }
  }, [session, supported]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(ASKED_KEY, '1'); } catch {}
    setShowBanner(false);
  }, []);

  return { permission, supported, showBanner, subscribe, dismiss, triggerBanner };
}
