// Service Worker para Porto Pass PWA
const VERSION_SW = 'v3.2.1.3.2';
const CACHE_NAME = `porto-pass-${VERSION_SW}`;
const urlsToCache = [
  '/',
  '/index.html',
  //'/static/js/bundle.js',
  //'/static/css/main.css',
  '/genfavicon-180-v3.png',
  '/genfavicon-512-v3.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // IMPORTANTE: No cachear esquemas no soportados
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // No cachear extensiones de navegador
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:') {
    return;
  }
  
  // IMPORTANTE: No interceptar peticiones en desarrollo
  // Detectar si estamos en desarrollo (localhost o puerto de desarrollo)
  const isDevelopment = url.hostname === 'localhost' || 
                        url.hostname === '127.0.0.1' || 
                        url.port === '5173' || 
                        url.port === '3000';
  
  // No interceptar en desarrollo
  if (isDevelopment) {
    return;
  }
  
  // No interceptar peticiones a la API o auth
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('/auth/') ||
      url.hostname !== self.location.hostname) {
    return;
  }
  
  // No interceptar WebSocket (HMR de Vite)
  if (event.request.url.includes('?token=') || 
      event.request.url.includes('/@vite/') ||
      event.request.url.includes('/node_modules/') ||
      event.request.url.includes('/__vite')) {
    return;
  }
  
  // No interceptar peticiones de módulos en desarrollo
  if (event.request.destination === 'script' && 
      (url.pathname.includes('/src/') || url.pathname.includes('/@'))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si existe
        if (response) {
          return response;
        }

        // Si no está en cache, hacer petición a red
        return fetch(event.request)
          .then((response) => {
            // No cachear respuestas que no sean exitosas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para cachearla
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red, devolver página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received', event);
  
  let notificationData = {
    title: '🔔 PortoPass',
    body: 'Nueva notificación',
    icon: '/genfavicon-180-v3.png',
    badge: '/genfavicon-64-v3.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    tag: 'portopass-notification',
    requireInteraction: false
  };

  // Si hay datos en el evento push, usarlos
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('[SW] Push data parsed successfully:', pushData);
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
      
      // Configurar requireInteraction según el tipo
      if (pushData.requireInteraction !== undefined) {
        notificationData.requireInteraction = pushData.requireInteraction;
      }
      
      // Usar tag personalizado si existe
      if (pushData.tag) {
        notificationData.tag = pushData.tag;
      }
    } catch (error) {
      console.error('[SW] Error parsing push data, using fallback:', error);
      // Usar notificationData por defecto (fallback)
    }
  } else {
    console.warn('[SW] Push event received with no data payload');
  }

  // CRITICAL: Ensure waitUntil wraps the notification display
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        vibrate: notificationData.vibrate,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction,
        tag: notificationData.tag,
        renotify: true, // ✅ Ensure re-notification even with same tag
        actions: [
          {
            action: 'view',
            title: 'Ver',
            icon: '/genfavicon-32-v3.png'
          },
          {
            action: 'close',
            title: 'Cerrar',
            icon: '/genfavicon-32-v3.png'
          }
        ]
      }).then(() => {
        console.log('[SW] Notification displayed successfully');
      }).catch((error) => {
        console.error('[SW] Error displaying notification:', error);
      }),
      // Notificar a todos los clientes abiertos
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
        console.log(`[SW] Notifying ${clients.length} open client(s)`);
        clients.forEach(function(client) {
          client.postMessage({ 
            type: 'PUSH_NOTIFICATION', 
            data: notificationData 
          });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'close') {
    console.log('[SW] Close action clicked');
    return;
  }

  // Obtener URL de la notificación
  const urlToOpen = event.notification.data?.url || '/';
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log(`[SW] Found ${clientList.length} open client(s)`);
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Si hay una ventana abierta, enfocarla y navegar
            console.log('[SW] Focusing existing client');
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: event.notification.data
            });
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          console.log('[SW] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});