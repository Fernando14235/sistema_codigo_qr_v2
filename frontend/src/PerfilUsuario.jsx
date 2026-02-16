import React from "react";
import './css/PerfilUsuario.css';

function PerfilUsuario({ usuario, onRegresar }) {
  if (!usuario) return null;
  return (
    <div className="perfil-usuario-main">
      <div className="perfil-usuario-card">
      {onRegresar && <button className="btn-regresar" onClick={onRegresar}>← Regresar</button>}
        <div className="perfil-usuario-icono">
          <span role="img" aria-label="user">👤</span>
        </div>
        <h2 className="perfil-usuario-titulo">Perfil de Usuario</h2>
        <div className="perfil-usuario-datos">
          <div><span className="perfil-label">Nombre completo:</span> <span className="perfil-value">{usuario.nombre}</span></div>
          <div><span className="perfil-label">Correo:</span> <span className="perfil-value">{usuario.email}</span></div>
          <div><span className="perfil-label">Teléfono:</span> <span className="perfil-value">{usuario.telefono || '-'}</span></div>
          {usuario.residencial_nombre !== undefined && (
            <div><span className="perfil-label">Entidad:</span> <span className="perfil-value">{usuario.residencial_nombre || '-'}</span></div>
          )}
          {usuario.rol === "residente" && <div><span className="perfil-label">Unidad:</span> <span className="perfil-value">{usuario.unidad_residencial || '-'}</span></div>}
          <div><span className="perfil-label">Rol:</span> <span className="perfil-value perfil-rol">{usuario.rol}</span></div>
          <div><span className="perfil-label">Fecha de registro:</span> <span className="perfil-value">{usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleString() : '-'}</span></div>
          <div><span className="perfil-label">Última conexión:</span> <span className="perfil-value">{usuario.ult_conexion ? new Date(usuario.ult_conexion).toLocaleString() : '-'}</span></div>
        </div>
      </div>
    </div>
    
  );
}

export default PerfilUsuario; 