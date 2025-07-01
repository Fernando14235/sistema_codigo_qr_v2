import React from 'react';

const OfflineMessage = ({ rol }) => {
  const getOfflineFeatures = () => {
    switch (rol) {
      case 'admin':
        return [
          'Ver historial de visitas',
          'Ver estadísticas recientes',
          'Ver escaneos del día',
          'Ver publicaciones recientes'
        ];
      case 'guardia':
        return [
          'Registrar entrada (se sincronizará después)',
          'Registrar salida (se sincronizará después)',
          'Ver escaneos recientes'
        ];
      case 'residente':
        return [
          'Ver comunicados recientes',
          'Ver historial de visitas'
        ];
      default:
        return [];
    }
  };

  const getRestrictedFeatures = () => {
    switch (rol) {
      case 'admin':
        return [
          'Crear usuarios',
          'Eliminar usuarios',
          'Crear publicaciones'
        ];
      case 'guardia':
        return [
          'Ver estadísticas completas'
        ];
      case 'residente':
        return [
          'Crear visitas'
        ];
      default:
        return [];
    }
  };

  const features = getOfflineFeatures();
  const restricted = getRestrictedFeatures();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
      border: '1px solid #ffc107',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      fontSize: '13px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#856404'
      }}>
        <span>📱</span>
        <span>Modo Offline Activo</span>
      </div>
      
      {features.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
            ✅ Funcionalidades disponibles:
          </div>
          <ul style={{ 
            margin: '0', 
            paddingLeft: '16px', 
            color: '#856404',
            fontSize: '12px'
          }}>
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
      
      {restricted.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
            ⚠️ Funcionalidades no disponibles:
          </div>
          <ul style={{ 
            margin: '0', 
            paddingLeft: '16px', 
            color: '#856404',
            fontSize: '12px'
          }}>
            {restricted.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #ffc107',
        fontSize: '11px',
        color: '#856404',
        fontStyle: 'italic'
      }}>
        Los datos se sincronizarán automáticamente cuando se recupere la conexión.
      </div>
    </div>
  );
};

export default OfflineMessage; 