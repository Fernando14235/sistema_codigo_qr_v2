// Service Worker para Residencial Access PWA
const CACHE_NAME = 'porto-pass-v3.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/resi192.png',
  '/resi512.png'
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
  // Solo cachear http y https
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
  let notificationData = {
    title: '🔔 PortoPass',
    body: 'Nueva notificación',
    icon: '/resi192.png',
    badge: '/resi64.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Si hay datos en el evento push, usarlos
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
    }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        vibrate: notificationData.vibrate,
        data: notificationData.data,
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'Ver',
            icon: '/resi32.png'
          },
          {
            action: 'close',
            title: 'Cerrar',
            icon: '/resi32.png'
          }
        ],
        tag: 'residencial-notification',
        renotify: true
      }),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'PUSH_NOTIFICATION', data: notificationData });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'residencial-sync') {
    event.waitUntil(
    );
  }
});

self.addEventListener('error', (event) => {
});

self.addEventListener('unhandledrejection', (event) => {
});