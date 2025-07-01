import React from 'react';

const DataStatusIndicator = ({ source, isOnline }) => {
  if (!source) return null;

  const getStatusInfo = () => {
    switch (source) {
      case 'online':
        return { icon: '🟢', text: 'Datos en tiempo real', color: '#4caf50' };
      case 'offline':
        return { icon: '📱', text: 'Datos offline', color: '#ff9800' };
      case 'offline-fallback':
        return { icon: '⚠️', text: 'Datos offline (sin conexión)', color: '#f44336' };
      default:
        return { icon: '❓', text: 'Origen desconocido', color: '#9e9e9e' };
    }
  };

  const status = getStatusInfo();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      background: status.color + '20',
      color: status.color,
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      border: `1px solid ${status.color}40`,
      marginBottom: '8px'
    }}>
      <span>{status.icon}</span>
      <span>{status.text}</span>
      {!isOnline && (
        <span style={{ fontSize: '10px', opacity: 0.8 }}>
          (Sin conexión)
        </span>
      )}
    </div>
  );
};

export default DataStatusIndicator; 