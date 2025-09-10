import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  server: {
    host: true,
    port: process.env.PORT || 5173,
    allowedHosts: [
      "tsapp.tekhnosupport.com"      
    ]
  },
  preview: {
    host: true,
    port: process.env.PORT || 4173,
    allowedHosts: [
      "tsapp.tekhnosupport.com"    
    ]
  },
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
          { src: 'resi16.png', sizes: '16x16', type: 'image/png' },
          { src: 'resi24.png', sizes: '24x24', type: 'image/png' },
          { src: 'resi32.png', sizes: '32x32', type: 'image/png' },
          { src: 'resi64.png', sizes: '64x64', type: 'image/png' },
          { src: 'resi192.png', sizes: '192x192', type: 'image/png' },
          { src: 'resi512.png', sizes: '512x512', type: 'image/png' }
        ],
        "screenshots": [
          { src: 'screenshot1.png', sizes: '772x607', type: 'image/png', form_factor: 'wide' },
          { src: 'screenshot2.png', sizes: '390x844', type: 'image/png' }
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,           
        clientsClaim: true, 
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
          {
            urlPattern: /.*\/admin\/estadisticas/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-estadisticas',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 21600, // 6 horas
              },
              backgroundSync: {
                name: 'residencial-sync',
                options: { maxRetentionTime: 1440 },
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
                maxAgeSeconds: 86400, // 24 horas
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
                maxAgeSeconds: 86400, // 24 horas
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
                maxAgeSeconds: 43200, // 12 horas
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
                maxAgeSeconds: 43200, // 12 horas
              },
            },
          },
        ],
      }
    })
  ],
});