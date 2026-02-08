import React from 'react';

function VisitasDelDiaCards({ visitas }) {
  const getEstadoIcon = (estado) => {
    const icons = {
      pendiente: '🟡',
      aceptado: '🟢',
      aprobado: '🟢',
      rechazado: '🔴',
      completado: '⚫'
    };
    return icons[estado] || '⚪';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      aceptado: 'Aceptado',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      completado: 'Completado'
    };
    return labels[estado] || estado;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="visitas-dia-cards">
      {visitas.map((visita) => (
        <div className="visita-card" key={visita.id}>
          {/* Header de la tarjeta */}
          <div className="visita-card-header">
            <div className="visita-card-estado">
              <span className={`estado-badge estado-${visita.estado}`}>
                {getEstadoIcon(visita.estado)} {getEstadoLabel(visita.estado)}
              </span>
            </div>
            <div className="visita-card-id">
              ID: {visita.id}
            </div>
          </div>

          {/* Información del visitante */}
          <div className="visita-card-section">
            <h4 className="visita-card-section-title">
              👤 Visitante
            </h4>
            <div className="visita-card-info">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{visita.visitante.nombre_conductor}</span>
              </div>
              <div className="info-row">
                <span className="info-label">DNI:</span>
                <span className="info-value">{visita.visitante.dni_conductor}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Teléfono:</span>
                <span className="info-value">{visita.visitante.telefono}</span>
              </div>
            </div>
          </div>

          {/* Información del vehículo */}
          <div className="visita-card-section">
            <h4 className="visita-card-section-title">
              🚗 Vehículo
            </h4>
            <div className="visita-card-info">
              <div className="info-row">
                <span className="info-label">Tipo:</span>
                <span className="info-value">{visita.visitante.tipo_vehiculo}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Marca:</span>
                <span className="info-value">{visita.visitante.marca_vehiculo}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Color:</span>
                <span className="info-value">{visita.visitante.color_vehiculo}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Placa:</span>
                <span className="info-value placa-highlight">
                  {visita.visitante.placa_vehiculo}
                </span>
              </div>
            </div>
          </div>

          {/* Información de la visita */}
          <div className="visita-card-section">
            <h4 className="visita-card-section-title">
              📝 Detalles de la Visita
            </h4>
            <div className="visita-card-info">
              <div className="info-row">
                <span className="info-label">Creado por:</span>
                <span className="info-value">
                  {visita.creador.nombre}
                  <span className={`creador-badge creador-${visita.creador.tipo}`}>
                    {visita.creador.tipo === 'admin' ? 'Admin' : 'Residente'}
                  </span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Unidad:</span>
                <span className="info-value">{visita.creador.unidad_residencial}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Fecha entrada:</span>
                <span className="info-value">{formatFecha(visita.fecha_entrada)}</span>
              </div>
              {visita.notas && (
                <div className="info-row info-row-full">
                  <span className="info-label">Motivo:</span>
                  <span className="info-value">{visita.notas}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Destino:</span>
                <span className="info-value">{visita.destino_visita}</span>
              </div>
            </div>
          </div>

          {/* Acompañantes */}
          {visita.acompanantes && visita.acompanantes.length > 0 && (
            <div className="visita-card-section">
              <h4 className="visita-card-section-title">
                👥 Acompañantes ({visita.acompanantes.length})
              </h4>
              <div className="acompanantes-list">
                {visita.acompanantes.map((acomp, index) => (
                  <span key={index} className="acompanante-badge">
                    {acomp}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Footer con observaciones */}
          {visita.observacion_entrada && (
            <div className="visita-card-footer">
              <span className="footer-icon">💬</span>
              <span className="footer-text">{visita.observacion_entrada}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default VisitasDelDiaCards;