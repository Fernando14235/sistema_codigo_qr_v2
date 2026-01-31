import React, { useState, useEffect } from "react";
import EscaneosCardsMobile from "./EscaneosCardsMobile";

function TablaEscaneos({ escaneos }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (escaneos.length === 0) {
    return (
      <div className="admin-section">
        <h3>Escaneos del día</h3>
        <p>No hay escaneos registrados hoy.</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h3>Escaneos del día</h3>
      {isMobile ? (
        <EscaneosCardsMobile escaneos={escaneos} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Visitante</th>
                <th>Vehículo</th>
                <th>Creado por</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {escaneos.map(e => (
                <tr key={e.id_escaneo}>
                  <td style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {new Date(e.fecha_escaneo).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '14px' }}>
                    <span className={`tipo-badge tipo-${e.tipo_escaneo}`}>
                      {e.tipo_escaneo}
                    </span>
                    {e.entrada_anticipada && e.tipo_escaneo === 'entrada' && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#f57c00',
                        fontWeight: 'bold',
                        marginTop: '2px'
                      }}>
                        ⚠️ Anticipada
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '14px' }}>{e.nombre_visitante}</td>
                  <td style={{ fontSize: '14px' }}>{e.tipo_vehiculo} - {e.placa_vehiculo}</td>
                  <td style={{ fontSize: '14px' }}>
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
                  </td>
                  <td style={{ fontSize: '14px' }}>{e.unidad_residencial}</td>
                  <td style={{ fontSize: '14px' }}>
                    <span className={`estado-badge estado-${e.estado_visita}`}>
                      {e.estado_visita}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{e.dispositivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TablaEscaneos;
