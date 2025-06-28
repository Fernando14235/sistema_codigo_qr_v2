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
        ],
      }
    })
  ],
  server: {
    port: 3000
  }
});