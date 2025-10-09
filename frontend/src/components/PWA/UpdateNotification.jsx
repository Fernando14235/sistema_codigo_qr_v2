import React, { useEffect, useState } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    // Registrar el service worker y manejar actualizaciones
    if ('serviceWorker' in navigator) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        const updateFunc = registerSW({
          onNeedRefresh() {
            console.log('🔄 Nueva versión disponible');
            setShowUpdate(true);
          },
          onOfflineReady() {
            console.log('✅ Aplicación lista para funcionar sin conexión');
          },
          onRegistered(registration) {
            console.log('✅ Service Worker registrado correctamente');
            
            // Verificar actualizaciones cada 30 segundos cuando la app está activa
            if (registration) {
              setInterval(() => {
                registration.update();
              }, 30000); // 30 segundos
            }
          },
          onRegisterError(error) {
            console.error('❌ Error al registrar Service Worker:', error);
          },
        });
        
        setUpdateSW(() => updateFunc);
      });
    }
  }, []);

  const handleUpdate = () => {
    if (updateSW) {
      setShowUpdate(false);
      updateSW(true); // Esto fuerza la actualización inmediata
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="update-notification-overlay">
      <div className="update-notification-banner">
        <div className="update-notification-content">
          <div className="update-icon">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" 
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="update-text">
            <h3>🎉 Nueva versión disponible</h3>
            <p>Hay una actualización de la aplicación. Actualiza para obtener las últimas mejoras y correcciones.</p>
          </div>
        </div>
        
        <div className="update-actions">
          <button 
            className="update-btn update-btn-dismiss" 
            onClick={handleDismiss}
            aria-label="Recordar más tarde"
          >
            Más tarde
          </button>
          <button 
            className="update-btn update-btn-primary" 
            onClick={handleUpdate}
            aria-label="Actualizar ahora"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
