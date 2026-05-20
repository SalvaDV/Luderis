import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_KEY } from '../supabase';

const VAPID_PUBLIC = 'BHnOLemuaXWYcphBnFBKmkdjHgumyJkyS4xz3SqDS28UtfkUkK99OQwXBhg1C09Ek3PXY2MEiERsxokoTOH98-E';
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

  // Show banner once if permission not yet decided
  useEffect(() => {
    if (!supported || !session?.access_token) return;
    if (permission !== 'default') return;
    try { if (localStorage.getItem(ASKED_KEY)) return; } catch {}
    const t = setTimeout(() => setShowBanner(true), 8000);
    return () => clearTimeout(t);
  }, [session?.access_token, permission]); // eslint-disable-line

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

  return { permission, supported, showBanner, subscribe, dismiss };
}
