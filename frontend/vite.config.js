import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  server: {
    host: true,
    port: process.env.PORT || 5173,
    allowedHosts: [
      "tsapp.tekhnosupport.com",
      "exquisite-healing-production.up.railway.app"      
    ],
    hmr: {
      clientPort: 5173,
      protocol: 'ws',
      host: 'localhost'
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
});