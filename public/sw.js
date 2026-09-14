// Service Worker de MarketSaaS para Notificaciones Push y Alertas de Pedidos
const CACHE_NAME = 'marketsaas-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Manejo de clic sobre una notificación en el dispositivo (móvil / PC)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/?view=admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta de MarketSaaS, enfocarla y navegar
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.registration.scope)) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Evento push para mensajes entrantes de notificación
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '🔔 ¡Nuevo Pedido en MarketSaaS!';
    const options = {
      body: data.body || 'Tienes una nueva orden de compra para despachar.',
      icon: data.icon || '/iconoPestana.png',
      badge: data.badge || '/iconoPestana.png',
      tag: data.tag || `order-${Date.now()}`,
      vibrate: [250, 100, 250, 100, 250],
      data: {
        url: data.url || '/?view=admin'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error al procesar notificación push en SW:', err);
  }
});
