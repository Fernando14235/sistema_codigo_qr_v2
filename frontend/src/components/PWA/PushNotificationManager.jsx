import { useEffect, useState, useCallback } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';
import './PushNotificationManager.css';

/**
 * Componente que gestiona automáticamente las notificaciones push
 * Se muestra después del login y solicita permisos de forma amigable
 */
function PushNotificationManager({ token, usuario }) {
  const [showBanner, setShowBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, setPermission] = useState('default');
  const [hasChecked, setHasChecked] = useState(false);

  // Verificar estado inicial
  useEffect(() => {
    if (!token || !usuario || hasChecked) return;

    const checkPushStatus = async () => {
      // Verificar si el navegador soporta push
      const isSupported = pushNotificationService.isPushSupported();
      if (!isSupported) {
        console.log('📱 Push notifications no soportadas en este navegador');
        setHasChecked(true);
        return;
      }

      // Verificar permisos actuales
      const currentPermission = pushNotificationService.getPermissionStatus();
      setPermission(currentPermission);

      // Verificar si ya está suscrito
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (currentPermission === 'default' && !subscription) {
          // No ha decidido aún y no está suscrito - mostrar banner
          // Esperar 2 segundos después del login para no ser intrusivo
          setTimeout(() => {
            setShowBanner(true);
          }, 2000);
        } else if (currentPermission === 'granted' && !subscription) {
          // Tiene permisos pero no está suscrito - suscribir automáticamente
          console.log('🔔 Permisos concedidos, suscribiendo automáticamente...');
          await handleAutoSubscribe();
        } else if (currentPermission === 'granted' && subscription) {
          // Ya está todo configurado
          console.log('✅ Usuario ya suscrito a notificaciones push');
        }
      } catch (error) {
        console.error('Error verificando estado de push:', error);
      }

      setHasChecked(true);
    };

    checkPushStatus();
  }, [token, usuario, hasChecked]);

  // Suscribir automáticamente (cuando ya tiene permisos)
  const handleAutoSubscribe = async () => {
    try {
      const success = await pushNotificationService.subscribeToPush(token);
      if (success) {
        console.log('✅ Suscripción automática exitosa');
      }
    } catch (error) {
      console.error('Error en suscripción automática:', error);
    }
  };

  // Manejar activación de notificaciones
  const handleEnable = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Solicitar permisos
      const granted = await pushNotificationService.requestPermission();

      if (granted) {
        setPermission('granted');
        
        // Suscribirse automáticamente
        const success = await pushNotificationService.subscribeToPush(token);
        
        if (success) {
          console.log('✅ Notificaciones activadas exitosamente');
          setShowBanner(false);
          
          // Mostrar notificación de bienvenida
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
        }
      } else {
        setPermission('denied');
        setShowBanner(false);
        console.log('❌ Usuario rechazó los permisos de notificación');
      }
    } catch (error) {
      console.error('Error activando notificaciones:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [token]);

  // Manejar rechazo (más tarde)
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    // Guardar en localStorage que el usuario rechazó (para no molestar de nuevo)
    localStorage.setItem('push_banner_dismissed', Date.now().toString());
  }, []);

  // No mostrar si ya fue rechazado recientemente (últimas 24 horas)
  useEffect(() => {
    const dismissed = localStorage.getItem('push_banner_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        setShowBanner(false);
      }
    }
  }, []);

  // No renderizar nada si no debe mostrarse
  if (!showBanner) return null;

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
        
        <div className="push-banner-icon">
          🔔
        </div>
        
        <div className="push-banner-content">
          <h3 className="push-banner-title">
            ¿Activar Notificaciones?
          </h3>
          <p className="push-banner-description">
            Recibe alertas instantáneas sobre:
          </p>
          <ul className="push-banner-benefits">
            {usuario?.rol === 'admin' && (
              <>
                <li>🚨 Nuevas visitas programadas</li>
                <li>📋 Solicitudes pendientes</li>
                <li>🎫 Tickets de soporte</li>
              </>
            )}
            {usuario?.rol === 'guardia' && (
              <>
                <li>🚨 Nuevas visitas del día</li>
                <li>📢 Anuncios importantes</li>
              </>
            )}
            {usuario?.rol === 'residente' && (
              <>
                <li>🚪 Entrada de visitantes</li>
                <li>🚗 Salida de visitantes</li>
                <li>✅ Actualizaciones de tickets</li>
              </>
            )}
          </ul>
        </div>
        
        <div className="push-banner-actions">
          <button
            className="push-banner-btn push-banner-btn-primary"
            onClick={handleEnable}
            disabled={isProcessing}
          >
            {isProcessing ? (
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
            disabled={isProcessing}
          >
            Más tarde
          </button>
        </div>
        
        <p className="push-banner-note">
          💡 Puedes cambiar esto después en Configuración
        </p>
      </div>
    </div>
  );
}

export default PushNotificationManager;
