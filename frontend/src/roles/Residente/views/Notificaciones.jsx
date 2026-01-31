import React from "react";

function Notificaciones({ notificaciones, cargando, error, onBack }) {
  return (
    <section className="admin-section notificaciones-section">
      <button className="btn-regresar" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
        </svg>
        Regresar al Menú
      </button>
      <h3>Notificaciones</h3>
      {cargando && <div>Cargando...</div>}
      {error && <div className="qr-error">{error}</div>}
      {!cargando && notificaciones.length === 0 && <div className="notificacion-vacia">No tienes notificaciones.</div>}
      {!cargando && notificaciones.length > 0 && (
        <ul className="notificaciones-lista">
          {notificaciones.map((n, idx) => (
            <li key={idx} className="notificacion-card">
              <div className="notificacion-titulo">{n.titulo || "Notificación"}</div>
              <div className="notificacion-mensaje">{n.mensaje}</div>
              <div className="notificacion-fecha">
                {n.fecha_envio ? new Date(n.fecha_envio).toLocaleString() : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Notificaciones;
