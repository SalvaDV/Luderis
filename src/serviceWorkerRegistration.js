const SW_URL = `${process.env.PUBLIC_URL}/service-worker.js`;

export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then((reg) => {
        reg.onupdatefound = () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.onstatechange = () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nueva versión disponible. Recargá para actualizar.');
            }
          };
        };
      })
      .catch((err) => console.error('[SW] Registro fallido:', err));
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.unregister())
      .catch(() => {});
  }
}
