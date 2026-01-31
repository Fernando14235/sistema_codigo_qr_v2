import React from 'react';

function EscaneosCardsMobile({ escaneos }) {
  return (
    <div className="escaneos-cards-mobile-guardia">
      {escaneos.map((e) => (
        <div className="escaneo-card-mobile-guardia" key={e.id_escaneo}>
          <div className="escaneo-card-header-guardia">
            <div className="escaneo-card-fecha-guardia">
              📅 {new Date(e.fecha_escaneo).toLocaleString()}
            </div>
            <div className="escaneo-card-badges-guardia">
              <span className={`tipo-badge tipo-${e.tipo_escaneo}`}>
                {e.tipo_escaneo}
              </span>
              <span className={`estado-badge estado-${e.estado_visita}`}>
                {e.estado_visita}
              </span>
            </div>
          </div>
          
          {e.entrada_anticipada && e.tipo_escaneo === 'entrada' && (
            <div className="escaneo-card-alerta-guardia">
              ⚠️ Entrada Anticipada
            </div>
          )}

          <div className="escaneo-card-info-guardia">
            <div className="escaneo-card-row-guardia">
              <span className="escaneo-label-guardia">👤 Visitante:</span>
              <span className="escaneo-value-guardia">{e.nombre_visitante}</span>
            </div>
            
            <div className="escaneo-card-row-guardia">
              <span className="escaneo-label-guardia">🚗 Vehículo:</span>
              <span className="escaneo-value-guardia">{e.tipo_vehiculo} - {e.placa_vehiculo}</span>
            </div>
            
            <div className="escaneo-card-row-guardia">
              <span className="escaneo-label-guardia">🏠 Unidad:</span>
              <span className="escaneo-value-guardia">{e.unidad_residencial}</span>
            </div>
            
            <div className="escaneo-card-row-guardia">
              <span className="escaneo-label-guardia">📝 Creado por:</span>
              <span className="escaneo-value-guardia">
                {e.nombre_residente}
                {e.tipo_creador && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: e.tipo_creador === 'admin' ? '#1976d2' : '#4caf50',
                    marginLeft: '5px',
                    fontWeight: 'bold'
                  }}>
                    ({e.tipo_creador === 'admin' ? 'Admin' : 'Residente'})
                  </span>
                )}
              </span>
            </div>
            
            <div className="escaneo-card-row-guardia">
              <span className="escaneo-label-guardia">📱 Dispositivo:</span>
              <span className="escaneo-value-guardia" style={{ fontSize: '12px', color: '#666' }}>
                {e.dispositivo}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EscaneosCardsMobile;
