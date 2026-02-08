import React, { useState } from "react";
import PaginationControls from "../../../components/PaginationControls";
import cardStyles from "../../../css/Cards.module.css";

// Listado de visitas (Diseño Moderno de Tarjetas)
function VisitasList({ visitas, onEditar, onEliminar }) {
  if (!visitas || visitas.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#888", padding: "40px" }}>
        No tienes visitas registradas.
      </div>
    );
  }

  return (
    <div className={cardStyles["cards-container"]}>
      {visitas.map((v, i) => (
        <div className={cardStyles["horizontal-card"]} key={i}>
          <div className={`${cardStyles["status-stripe"]} ${
            v.estado === 'aprobada' || v.estado === 'completada' ? cardStyles["success"] : 
            v.estado === 'rechazada' || v.expiracion === 'S' ? cardStyles["danger"] : cardStyles["warning"]
          }`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Visitante</span>
              <span className={cardStyles["section-value"]} style={{ fontSize: '1.1rem' }}>
                {v.visitante?.nombre_conductor || 'Anónimo'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 {v.visitante?.telefono || '-'}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Vehículo / Motivo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🆔 DNI: {v.visitante?.dni_conductor || '-'}</span>
                <span className={cardStyles["section-value"]}>{v.visitante?.tipo_vehiculo || '-'}</span>
                {v.visitante?.placa_vehiculo && (
                  <span style={{ fontSize: '0.75rem', color: '#1e293b' }}>🚗 Placa: {v.visitante.placa_vehiculo}</span>
                )}
                {v.visitante?.placa_chasis && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⚙️ Chasis: {v.visitante.placa_chasis}</span>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>💬 {v.visitante?.motivo_visita || '-'}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado / Expiración</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={`${cardStyles["badge"]} ${cardStyles["badge-" + (v.estado === 'solicitada' ? 'pendiente' : v.estado)]}`}>
                  {v.estado === 'pendiente' ? '⏳ Pendiente' : 
                   v.estado === 'aprobada' ? '✅ Aprobada' : 
                   v.estado === 'completada' ? '🏁 Completada' : 
                   v.estado === 'rechazada' ? '❌ Rechazada' : v.estado}
                </span>
                {v.expiracion === 'S' && (
                  <span className={`${cardStyles["badge"]} ${cardStyles["badge-expirado"]}`} style={{ fontSize: '0.65rem' }}>
                    ⚠️ Expirada
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={cardStyles["card-actions"]}>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["edit"]}`}
              onClick={() => (v.estado === 'pendiente' && v.expiracion === 'N') ? onEditar(v) : null}
              disabled={!(v.estado === 'pendiente' && v.expiracion === 'N')}
              style={{ opacity: (v.estado === 'pendiente' && v.expiracion === 'N') ? 1 : 0.3, cursor: (v.estado === 'pendiente' && v.expiracion === 'N') ? 'pointer' : 'not-allowed' }}
              title="Editar visita"
            >
              ✏️
            </button>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["delete"]}`}
              onClick={() => onEliminar(v.id)}
              title="Eliminar visita"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MisVisitas({ visitas, onEditar, onEliminar, cargando, error, page, totalPages, setPage }) {
  if (cargando) return <div>Cargando...</div>;
  if (error) return <div className="qr-error">{error}</div>;
  if (!visitas || visitas.length === 0) return <div>No tienes visitas registradas.</div>;

  return (
    <>
      <VisitasList 
        visitas={visitas} 
        onEditar={onEditar} 
        onEliminar={onEliminar}
      />
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
}

export default MisVisitas;
