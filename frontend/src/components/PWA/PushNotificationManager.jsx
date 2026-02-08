import { useEffect, useState, useCallback } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';
import './PushNotificationManager.css';

function PushNotificationManager({ token, usuario }) {
  const [showBanner, setShowBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Función para re-suscribir automáticamente (memoizada con useCallback)
  const handleAutoSubscribe = useCallback(async () => {
    try {
      const success = await pushNotificationService.subscribeToPush(token);
      if (success) {
        console.log('✅ Re-suscripción automática exitosa');
      }
    } catch (error) {
      console.error('Error en suscripción automática:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !usuario || hasChecked) return; // Si no hay token, usuario, o ya revisamos en esta sesión, no hacer nada

    let timeoutId = null; // Para limpiar el timeout si el componente se desmonta

    const checkPushStatus = async () => {
      // 1. Verificar soporte técnico del navegador
      const isSupported = pushNotificationService.isPushSupported();
      if (!isSupported) {
        console.log('🚫 Las notificaciones Push no son soportadas en este navegador.');
        setHasChecked(true);
        return;
      }

      // 2. Verificar estado actual (Permisos y Suscripción)
      const currentPermission = pushNotificationService.getPermissionStatus(); 
      
      try {
        // Obtenemos el registro del Service Worker y la suscripción actual
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        // --- CASO A: Ya tiene permiso y está suscrito ---
        if (currentPermission === 'granted' && subscription) {
          console.log('✅ Usuario ya suscrito y configurado correctamente.');
          setHasChecked(true);
          return;
        }

        // --- CASO B: Tiene permiso pero perdió la suscripción (ej. limpió caché) ---
        if (currentPermission === 'granted' && !subscription) {
          console.log('🔄 Permisos otorgados pero sin suscripción. Recuperando en segundo plano...');
          await handleAutoSubscribe();
          setHasChecked(true);
          return;
        }

        // --- CASO C: Permiso denegado permanentemente ---
        if (currentPermission === 'denied') {
          console.log('🔕 Notificaciones bloqueadas en el navegador por el usuario.');
          setHasChecked(true);
          return;
        }

        // --- CASO D: Estado 'default' (No ha decidido aún) ---
        if (currentPermission === 'default') {
          const dismissed = localStorage.getItem('push_banner_dismissed');
          
          if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const now = Date.now();
            const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);

            // Si el usuario le dio a "Más tarde" hace menos de 24 horas, no molestamos
            if (hoursPassed < 24) {
              console.log(`⏳ Banner pospuesto. Faltan ${Math.round(24 - hoursPassed)} horas para volver a mostrar.`);
              setHasChecked(true);
              return;
            }
          }

          // Si llegamos aquí, mostramos el banner tras un breve delay (mejor UX)
          timeoutId = setTimeout(() => {
            setShowBanner(true);
          }, 2000);
        }

      } catch (error) {
        console.error('Error verificando estado de push:', error);
      } finally {
        setHasChecked(true);
      }
    };

    checkPushStatus();

    // Cleanup: Limpiar timeout si el componente se desmonta
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [token, usuario, handleAutoSubscribe]); 

  // Acción: Aceptar y Activar
  const handleEnable = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Solicitar permisos nativos del navegador
      const granted = await pushNotificationService.requestPermission();

      if (granted) {
        // Suscribirse
        const success = await pushNotificationService.subscribeToPush(token);
        if (success) {
          setShowBanner(false);
          // Limpiar cualquier "dismissed" previo ya que ahora aceptó
          localStorage.removeItem('push_banner_dismissed');
          
          // Feedback visual (notificación de bienvenida)
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
        // El usuario bloqueó en el prompt nativo
        setShowBanner(false);
        // Guardamos esto para no volver a intentar mostrar el banner
        localStorage.setItem('push_banner_dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Error al intentar activar notificaciones:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [token]);

  // Acción: Más tarde (Cerrar banner)
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    // Guardar fecha actual para no molestar por 24h
    localStorage.setItem('push_banner_dismissed', Date.now().toString());
  }, []);

  // Obtener beneficios según rol (memoizado para mejor rendimiento)
  const getBenefitsByRole = useCallback(() => {
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
  }, [usuario?.rol]);

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
          <button
            className="push-banner-btn push-banner-btn-primary"
            onClick={handleEnable}
            disabled={isProcessing}>
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
            disabled={isProcessing}>
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