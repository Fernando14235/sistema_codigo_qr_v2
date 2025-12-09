import React, { useEffect, useState } from 'react';
import './ServiceWorkerUpdater.css';

const ServiceWorkerUpdater = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
      console.log('🔍 ServiceWorkerUpdater: Iniciando verificación de actualizaciones...');
      // Obtener el registro del Service Worker
      navigator.serviceWorker.ready.then((registration) => {
        // Verificar si hay un SW esperando
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }

        // Escuchar cambios en el estado del SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        });
      });

      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // El SW ha cambiado, recargar la página
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Enviar mensaje al SW para que se active inmediatamente
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="sw-update-toast">
      <div className="sw-update-content">
        <div className="sw-update-icon">🔄</div>
        <div className="sw-update-text">
          <strong>Nueva versión disponible</strong>
          <p>Hay una actualización lista para instalar</p>
        </div>
        <div className="sw-update-actions">
          <button className="sw-update-btn sw-update-btn-primary" onClick={handleUpdate}>
            Actualizar ahora
          </button>
          <button className="sw-update-btn sw-update-btn-secondary" onClick={handleDismiss}>
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdater;
