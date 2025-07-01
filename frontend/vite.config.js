import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Residencial Access',
        short_name: 'Residencial',
        description: 'Control de acceso residencial',
        theme_color: '#1976d2',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '.',
        "icons": [
            {
                "src": "resi16.png",
                "sizes": "16x16",
                "type": "image/png"
            },
            {
                "src": "resi24.png",
                "sizes": "24x24",
                "type": "image/png"
            },
            {
                "src": "resi32.png",
                "sizes": "32x32",
                "type": "image/png"
            },
            {
                "src": "resi64.png",
                "sizes": "64x64",
                "type": "image/png"
            },
            {
                "src": "resi192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "resi512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ],
        "screenshots": [
            {
                "src": "screenshot1.png",
                "sizes": "772x607",
                "type": "image/png",
                "form_factor": "wide"
            },
            {
                "src": "screenshot2.png",
                "sizes": "390x844",
                "type": "image/png"
            }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Configuración para notificaciones push
        additionalManifestEntries: [
          { url: '/sw.js', revision: '1' }
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
            },
          },
          // Cache para datos de la API
          {
            urlPattern: /.*\/admin\/estadisticas/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-estadisticas',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 6 * 60 * 60, // 6 horas
              },
            },
          },
          {
            urlPattern: /.*\/visitas\/admin\/historial/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-historial',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60, // 24 horas
              },
            },
          },
          {
            urlPattern: /.*\/visitas\/admin\/escaneos-dia/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-escaneos-dia',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60, // 24 horas
              },
            },
          },
          {
            urlPattern: /.*\/social\/publicaciones/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-publicaciones',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 12 * 60 * 60, // 12 horas
              },
            },
          },
          {
            urlPattern: /.*\/comunicados/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-comunicados',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 12 * 60 * 60, // 12 horas
              },
            },
          },
        ],
        // Background sync para acciones offline
        backgroundSync: {
          name: 'residencial-sync',
          options: {
            maxRetentionTime: 24 * 60, // 24 horas
          },
        },
      }
    })
  ],
  server: {
    port: 3000
  }
});