import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  server: {
    host: true,
    port: process.env.PORT || 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "192.168.1.35",
      "tsapp.tekhnosupport.com",
      "exquisite-healing-production.up.railway.app"      
    ],
    hmr: {
      clientPort: 5173,
      protocol: 'ws',
    }
  },
  preview: {
    host: true,
    port: process.env.PORT || 4173,
    allowedHosts: [
      "tsapp.tekhnosupport.com",
      "exquisite-healing-production.up.railway.app"      
    ]
  },
  plugins: [
    react()
  ],
  // Eliminar console.* y debugger en producción
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});