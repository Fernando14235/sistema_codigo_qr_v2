import React from "react";
import './ConfiguracionUsuario.css';

function ConfiguracionUsuario({ onRegresar }) {
  return (
    <div className="config-usuario-main">
      {onRegresar && <button className="btn-regresar" onClick={onRegresar}>← Regresar</button>}
      <h2>Configuración</h2>
      <div className="config-usuario-datos">
        <p>Aqui tengo que agregar configuraciones por ejemplo:</p>
        <p>Modo Oscuro</p>
        <p>Idioma</p>
        <p>Tamaño de letra</p>
      </div>
    </div>
  );
}

export default ConfiguracionUsuario; 