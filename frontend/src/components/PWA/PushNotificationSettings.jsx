import React, { useState, useEffect } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';
import './PushNotificationSettings.css';

function PushNotificationSettings({ token, usuario }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Verificar soporte y permisos
    setIsSupported(pushNotificationService.isPushSupported());
    setPermission(pushNotificationService.getPermissionStatus());
    
    // Verificar si ya está suscrito
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error verificando suscripción:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const success = await pushNotificationService.subscribeToPush(token);
      
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        setMessage({
          type: 'success',
          text: '✅ ¡Suscrito exitosamente! Ahora recibirás notificaciones push.'
        });
      } else {
        setMessage({
          type: 'error',
          text: '❌ No se pudo suscribir. Verifica los permisos del navegador.'
        });
      }
    } catch (error) {
      console.error('Error suscribiéndose:', error);
      setMessage({
        type: 'error',
        text: '❌ Error al suscribirse. Intenta nuevamente.'
      });
    }

    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const success = await pushNotificationService.unsubscribeFromPush(token);
      
      if (success) {
        setIsSubscribed(false);
        setMessage({
          type: 'success',
          text: '✅ Desuscrito exitosamente. Ya no recibirás notificaciones push.'
        });
      } else {
        setMessage({
          type: 'error',
          text: '❌ No se pudo desuscribir. Intenta nuevamente.'
        });
      }
    } catch (error) {
      console.error('Error desuscribiéndose:', error);
      setMessage({
        type: 'error',
        text: '❌ Error al desuscribirse. Intenta nuevamente.'
      });
    }

    setLoading(false);
  };

  const handleTestNotification = () => {
    if (permission === 'granted') {
      pushNotificationService.showLocalNotification(
        '🔔 Notificación de Prueba',
        {
          body: 'Esta es una notificación de prueba de PortoPass',
          icon: '/genfavicon-180-v3.png',
          badge: '/genfavicon-64-v3.png',
          data: {
            url: '/',
            tipo: 'test'
          }
        }
      );
      setMessage({
        type: 'success',
        text: '✅ Notificación de prueba enviada'
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="push-settings-container">
        <div className="push-settings-header">
          <h4>🔔 Notificaciones Push</h4>
        </div>
        <div className="push-settings-not-supported">
          <span className="not-supported-icon">⚠️</span>
          <p>Tu navegador no soporta notificaciones push.</p>
          <p className="not-supported-hint">
            Intenta usar Chrome, Firefox, Edge o Safari en un dispositivo compatible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="push-settings-container">
      <div className="push-settings-header">
        <h4>🔔 Notificaciones Push</h4>
        <span className={`status-badge status-${permission}`}>
          {permission === 'granted' ? '✅ Activadas' : 
           permission === 'denied' ? '❌ Bloqueadas' : 
           '⚠️ No configuradas'}
        </span>
      </div>

      <div className="push-settings-content">
        {/* Información */}
        <div className="push-info-box">
          <p>
            Las notificaciones push te permiten recibir alertas instantáneas sobre:
          </p>
          <ul className="push-benefits-list">
            {usuario?.rol === 'admin' && (
              <>
                <li>🚨 Nuevas visitas programadas</li>
                <li>✏️ Actualizaciones de visitas</li>
                <li>📋 Solicitudes de visita pendientes</li>
                <li>🎫 Nuevos tickets de soporte</li>
                <li>📢 Nuevas publicaciones</li>
              </>
            )}
            {usuario?.rol === 'guardia' && (
              <>
                <li>🚨 Nuevas visitas programadas</li>
                <li>📢 Nuevas publicaciones</li>
              </>
            )}
            {usuario?.rol === 'residente' && (
              <>
                <li>🚪 Entrada de visitantes</li>
                <li>🚗 Salida de visitantes</li>
                <li>✏️ Actualizaciones de visitas</li>
                <li>✅ Actualizaciones de tickets</li>
                <li>📢 Nuevas publicaciones</li>
              </>
            )}
          </ul>
        </div>

        {/* Estado actual */}
        <div className="push-status-box">
          <div className="status-row">
            <span className="status-label">Estado:</span>
            <span className={`status-value status-${isSubscribed ? 'active' : 'inactive'}`}>
              {isSubscribed ? '🟢 Suscrito' : '⚪ No suscrito'}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Permisos:</span>
            <span className={`status-value status-${permission}`}>
              {permission === 'granted' ? '🟢 Concedidos' : 
               permission === 'denied' ? '🔴 Denegados' : 
               '🟡 Pendientes'}
            </span>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {message.text && (
          <div className={`push-message push-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Acciones */}
        <div className="push-actions">
          {!isSubscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={loading || permission === 'denied'}
              className="btn-push btn-push-primary"
            >
              {loading ? '⏳ Suscribiendo...' : '🔔 Activar Notificaciones'}
            </button>
          ) : (
            <>
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="btn-push btn-push-secondary"
              >
                {loading ? '⏳ Desuscribiendo...' : '🔕 Desactivar Notificaciones'}
              </button>
              <button
                onClick={handleTestNotification}
                disabled={loading}
                className="btn-push btn-push-test"
              >
                🧪 Probar Notificación
              </button>
            </>
          )}
        </div>

        {/* Ayuda para permisos denegados */}
        {permission === 'denied' && (
          <div className="push-help-box">
            <h4>⚠️ Permisos Bloqueados</h4>
            <p>
              Has bloqueado las notificaciones para este sitio. Para activarlas:
            </p>
            <ol>
              <li>Haz clic en el icono de candado 🔒 en la barra de direcciones</li>
              <li>Busca "Notificaciones" en los permisos</li>
              <li>Cambia el permiso a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default PushNotificationSettings;
