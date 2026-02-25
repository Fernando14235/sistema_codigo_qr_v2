import React, { useEffect } from 'react';
import './ServiceWorkerUpdater.css';

const ServiceWorkerUpdater = () => {
  useEffect(() => {
    // Verificar si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
      console.log('🔍 ServiceWorkerUpdater: Iniciando actualización en segundo plano (Silent Auto-Update)...');
      
      navigator.serviceWorker.ready.then((registration) => {
        // Si ya hay un worker esperando, lo activamos automáticamente
        if (registration.waiting) {
          console.log('🔄 SW esperando detectado. Activando automáticamente...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Escuchar cambios en el estado del SW cuando se encuentra una actualización
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible, la activamos automáticamente
              console.log('✨ Nuevo SW descargado. Activando silenciosamente...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      });

      // Escuchar cuando el nuevo ServiceWorker toma el control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // NOTA: Se eliminó window.location.reload() a propósito.
        // Forzar una recarga aquí destruiría el estado de React (ej. cuando se activan notificaciones push).
        // El nuevo SW tomará las riendas para las peticiones en segundo plano y la app se actualizará 
        // naturalmente en la próxima recarga manual o navegación completa.
        console.log('✅ Nuevo Service Worker activado. Los cambios aplicarán totalmente tras la próxima recarga.');
      });
    }
  }, []);

  // Ya no mostramos el banner (prompt) UI, todo es silencioso
  return null;
};

export default ServiceWorkerUpdater;
