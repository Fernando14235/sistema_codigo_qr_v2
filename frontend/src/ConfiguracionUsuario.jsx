import React from "react";
import './css/ConfiguracionUsuario.css';
import PushNotificationSettings from './components/PWA/PushNotificationSettings';
import NotificationTester from './components/PWA/NotificationTester';

function ConfiguracionUsuario({ onRegresar, usuario }) {
  return (
    <div className="config-usuario-main">
      {onRegresar && <button className="btn-regresar" onClick={onRegresar}>← Regresar</button>}
      <h2>Configuración</h2>
      <div className="config-usuario-datos"></div>
    </div>
  );
}

export default ConfiguracionUsuario; 