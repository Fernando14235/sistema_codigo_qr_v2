import React, { useState } from 'react';
import { usePushNotifications } from '../../hooks/pwa/usePushNotifications';

const NotificationTester = ({ userId, userRole }) => {
  const { showNotification, shouldReceiveNotification, getAllowedNotificationTypes } = usePushNotifications(userId, userRole);
  const [selectedType, setSelectedType] = useState('');

  const notificationTypes = [
    { type: 'publicacion_creada', label: '📢 Nueva Publicación', data: { titulo: 'Mantenimiento programado' } },
    { type: 'visita_creada', label: '👥 Nueva Visita', data: { visitante: 'Juan Pérez' } },
    { type: 'escaneo_entrada', label: '🚪 Entrada Registrada', data: { visitante: 'María García' } },
    { type: 'escaneo_salida', label: '🚗 Salida Registrada', data: { visitante: 'Carlos López' } },
    { type: 'escaneo_registrado', label: '📱 Escaneo Registrado', data: { tipo: 'Entrada de visitante' } }
  ];

  const handleTestNotification = () => {
    if (!selectedType) return;

    const notificationType = notificationTypes.find(nt => nt.type === selectedType);
    if (notificationType) {
      showNotification(notificationType.type, notificationType.data);
    }
  };

  const allowedTypes = getAllowedNotificationTypes();

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
        <span style={{ fontSize: '20px' }}>🧪</span>
        <strong>Probador de Notificaciones</strong>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Selecciona el tipo de notificación:
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">-- Seleccionar tipo --</option>
          {notificationTypes.map(nt => (
            <option key={nt.type} value={nt.type}>
              {nt.label} {!allowedTypes.includes(nt.type) && '(No permitido para tu rol)'}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTestNotification}
        disabled={!selectedType || !shouldReceiveNotification(selectedType)}
        style={{
          background: shouldReceiveNotification(selectedType) ? '#4caf50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: shouldReceiveNotification(selectedType) ? 'pointer' : 'not-allowed',
          opacity: shouldReceiveNotification(selectedType) ? 1 : 0.6
        }}
      >
        🧪 Probar Notificación
      </button>

      {selectedType && !shouldReceiveNotification(selectedType) && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#f44336' }}>
          ⚠️ Este tipo de notificación no está permitido para tu rol ({userRole})
        </div>
      )}

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
          <li>Este probador solo muestra notificaciones locales</li>
          <li>Las notificaciones reales vendrán del servidor</li>
          <li>Solo se muestran los tipos permitidos para tu rol</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTester; 