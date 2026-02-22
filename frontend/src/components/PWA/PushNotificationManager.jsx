import { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/pwa/usePushNotifications';
import pushNotificationService from '../../services/pwa/pushNotifications';
import './PushNotificationManager.css';

/**
 * Componente "tonto" de UI para manejar el banner de notificaciones push
 * ✅ Solo maneja presentación y eventos de UI
 * ✅ Toda la lógica de negocio está en usePushNotifications hook
 */
function PushNotificationManager({ token, usuario }) {
  const [localDismissed, setLocalDismissed] = useState(false);
  
  const { 
    isSupported,
    permission, 
    isSubscribed,
    isLoading,
    isInitializing,  // 🆕 Prevents UI flicker during initial verification
    requestPermissionAndSubscribe 
  } = usePushNotifications(token, usuario?.id, usuario?.rol);
  
  // Check if banner was dismissed within 24 hours
  useEffect(() => {
    const dismissed = localStorage.getItem('push_banner_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        setLocalDismissed(true);
      } else {
        localStorage.removeItem('push_banner_dismissed');
      }
    }
  }, []);
  
  // ✅ IMPROVED: Banner visibility includes isInitializing check
  // Also show even if supported is false but it's iOS (to show install instructions)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  const shouldShowBanner = 
    (isSupported || isIOS) &&
    permission === 'default' &&
    !isSubscribed &&
    !localDismissed &&
    !isLoading &&
    !isInitializing &&
    token &&
    usuario;
  
  const handleEnable = async () => {
    const success = await requestPermissionAndSubscribe();
    if (success) {
      localStorage.removeItem('push_banner_dismissed');
      
      // Show welcome notification after a delay
      setTimeout(() => {
        pushNotificationService.showLocalNotification(
          '🎉 ¡Notificaciones Activadas!',
          {
            body: 'Ahora recibirás alertas importantes en tiempo real',
            icon: '/resi192.png',
            badge: '/resi64.png'
          }
        );
      }, 500);
    } else if (permission === 'denied') {
      // User denied in the native prompt
      localStorage.setItem('push_banner_dismissed', Date.now().toString());
    }
  };
  
  const handleDismiss = () => {
    setLocalDismissed(true);
    localStorage.setItem('push_banner_dismissed', Date.now().toString());
  };
  
  // Get benefits by role for display
  const getBenefitsByRole = () => {
    const benefits = {
      admin: [
        { icon: '🚨', text: 'Nuevas visitas programadas' },
        { icon: '📋', text: 'Solicitudes pendientes' },
        { icon: '🎫', text: 'Tickets de soporte' }
      ],
      guardia: [
        { icon: '🚨', text: 'Nuevas visitas del día' },
        { icon: '📢', text: 'Anuncios importantes' }
      ],
      residente: [
        { icon: '🚪', text: 'Entrada de visitantes' },
        { icon: '🚗', text: 'Salida de visitantes' },
        { icon: '✅', text: 'Actualizaciones de tickets' },
        { icon: '📢', text: 'Anuncios importantes' }
      ]
    };
    return benefits[usuario?.rol] || [];
  };
  
  if (!shouldShowBanner) return null;
  
  return (
    <div className="push-banner-overlay">
      <div className="push-banner">
        <button 
          className="push-banner-close" 
          onClick={handleDismiss}
          aria-label="Cerrar"
        >
          ×
        </button>
        
        <div className="push-banner-icon">🔔</div>
        
        <div className="push-banner-content">
          <h3 className="push-banner-title">
            ¿Activar Notificaciones?
          </h3>
          <p className="push-banner-description">
            Recibe alertas instantáneas sobre:
          </p>
          <ul className="push-banner-benefits">
            {getBenefitsByRole().map((benefit, index) => (
              <li key={index}>
                {benefit.icon} {benefit.text}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="push-banner-actions">
          {(!isStandalone && isIOS) ? (
            <div className="ios-install-hint">
              <p>💡 <strong>Para activar notificaciones en iOS:</strong></p>
              <ol>
                <li>Toca el botón <strong>Compartir</strong> <span className="share-icon">⎋</span></li>
                <li>Selecciona <strong>"Agregar a Inicio"</strong> <span className="add-icon">+</span></li>
                <li>Abre la app desde tu pantalla de inicio</li>
              </ol>
            </div>
          ) : (
            <>
              <button
                className="push-banner-btn push-banner-btn-primary"
                onClick={handleEnable}
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="push-banner-spinner"></span>
                    Activando...
                  </>
                ) : (
                  <>
                    <span>🔔</span>
                    Activar Notificaciones
                  </>
                )}
              </button>
              <button
                className="push-banner-btn push-banner-btn-secondary"
                onClick={handleDismiss}
                disabled={isLoading}>
                Más tarde
              </button>
            </>
          )}
        </div>
        <p className="push-banner-note">
          💡 Puedes cambiar esto después en Configuración
        </p>
      </div>
    </div>
  );
}

export default PushNotificationManager;