import React from 'react';
import { usePushNotifications } from '../../hooks/pwa/usePushNotifications';

const PushNotificationSettings = ({ userId, userRole }) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    getAllowedNotificationTypes
  } = usePushNotifications(userId, userRole);

  const getPermissionStatusText = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Permitidas', color: '#4caf50', icon: '✅' };
      case 'denied':
        return { text: 'Denegadas', color: '#f44336', icon: '❌' };
      case 'default':
        return { text: 'No configuradas', color: '#ff9800', icon: '⚠️' };
      default:
        return { text: 'No soportadas', color: '#9e9e9e', icon: '❓' };
    }
  };

  const getNotificationTypesText = () => {
    const types = getAllowedNotificationTypes();
    const typeLabels = {
      publicacion_creada: '📢 Nuevas publicaciones',
      visita_creada: '👥 Nuevas visitas',
      escaneo_entrada: '🚪 Entradas registradas',
      escaneo_salida: '🚗 Salidas registradas',
      escaneo_registrado: '📱 Escaneos registrados'
    };

    return types.map(type => typeLabels[type] || type).join(', ');
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      if (permission === 'default') {
        await requestPermission();
      } else if (permission === 'granted') {
        await subscribe();
      }
    }
  };

  if (!isSupported) {
    return (
      <div style={{
        background: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span>❌</span>
          <strong>Notificaciones Push No Soportadas</strong>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Tu navegador no soporta notificaciones push. Considera usar Chrome, Firefox o Edge.
        </p>
      </div>
    );
  }

  const status = getPermissionStatusText();

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        <strong>Notificaciones Push</strong>
      </div>

      {/* Estado de permisos */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span>{status.icon}</span>
          <span style={{ color: status.color, fontWeight: 'bold' }}>
            Estado: {status.text}
          </span>
        </div>
      </div>

      {/* Tipos de notificación */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Notificaciones que recibirás:
        </div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
          {getNotificationTypesText()}
        </div>
      </div>

      {/* Botón de control */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleToggleNotifications}
          disabled={isLoading || permission === 'denied'}
          style={{
            background: isSubscribed ? '#f44336' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: isSubscribed || permission === 'denied' ? 'not-allowed' : 'pointer',
            opacity: isSubscribed || permission === 'denied' ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? '⏳ Cargando...' : 
           isSubscribed ? '🔕 Desactivar Notificaciones' : 
           permission === 'denied' ? '❌ Permisos Denegados' :
           '🔔 Activar Notificaciones'}
        </button>

        {permission === 'denied' && (
          <div style={{ fontSize: '12px', color: '#f44336' }}>
            Ve a Configuración del navegador para permitir notificaciones
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>💡 Información:</strong>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          <li>Las notificaciones aparecerán incluso cuando la app esté cerrada</li>
          <li>Puedes desactivarlas en cualquier momento</li>
          <li>Los datos se procesan de forma segura</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationSettings; 