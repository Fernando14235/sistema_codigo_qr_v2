import React from "react";
import './css/ConfiguracionUsuario.css';
import PushNotificationSettings from './components/PWA/PushNotificationSettings';
import NotificationTester from './components/PWA/NotificationTester';

function ConfiguracionUsuario({ onRegresar, usuario }) {
  return (
    <div className="config-usuario-main">
      {onRegresar && <button className="btn-regresar" onClick={onRegresar}>← Regresar</button>}
      <h2>Configuración</h2>
      <div className="config-usuario-datos">
        {/* Configuración de Notificaciones Push */}
        <PushNotificationSettings 
          userId={usuario?.id} 
          userRole={usuario?.rol} 
        />
        
        {/* Probador de Notificaciones */}
        <NotificationTester 
          userId={usuario?.id} 
          userRole={usuario?.rol} 
        />
        
        {/* Otras configuraciones */}
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1976d2' }}>Otras Configuraciones</h3>
          <p>Configuraciones adicionales que se implementarán:</p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>🌙 Modo Oscuro</li>
            <li>🌍 Idioma</li>
            <li>📝 Tamaño de letra</li>
            <li>🔔 Sonidos de notificación</li>
            <li>📱 Configuración de vibración</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionUsuario; 