import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './App';
import ServiceWorkerUpdater from './components/ServiceWorkerUpdater';

// Registrar Service Worker con lógica de actualización mejorada
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // ✅ PERSISTENCE FIX: Explicit scope and cache bypass
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',  // ✅ Global scope ensures SW controls all pages
      updateViaCache: 'none'  // ✅ Force fresh SW checks (critical for persistence fix)
    })
      .then(registration => {
        console.log('✅ Service Worker registrado correctamente');

        // Verificar actualizaciones cada 30 segundos
        setInterval(() => {
          registration.update();
        }, 30000);

        // Verificar si hay un SW esperando al cargar
        if (registration.waiting) {
          console.log('🔄 Hay una actualización esperando');
        }

        // Escuchar cuando se encuentra una actualización
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔍 Nueva versión del Service Worker encontrada');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nueva versión lista para instalar');
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
    <ServiceWorkerUpdater />
  </React.StrictMode>,
  document.getElementById('root')
);