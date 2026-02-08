import React from "react";
import cardStyles from "../../../../css/Cards.module.css";

function TablaTickets({ tickets, onVerDetalle, onActualizar, onEliminar }) {
  if (!tickets || tickets.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: "40px", fontWeight: "bold" }}>
        No hay tickets registrados
      </p>
    );
  }

  return (
    <div className={cardStyles["cards-container"]} style={{ marginTop: '10px' }}>
      {tickets.map((ticket) => (
        <div className={cardStyles["horizontal-card"]} key={ticket.id}>
          <div className={`${cardStyles["status-stripe"]} ${cardStyles[ticket.estado] || cardStyles["primary"]}`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Ticket ID</span>
              <span className={cardStyles["section-value"]}>#{ticket.id}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Residente</span>
              <span className={cardStyles["section-value"]}>{ticket.nombre_residente || "N/A"}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Asunto</span>
              <h4 className={cardStyles["card-title"]} style={{ fontSize: '1rem' }}>{ticket.titulo}</h4>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado / Fecha</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={`${cardStyles["badge"]} ${cardStyles["badge-" + ticket.estado]}`}>
                  {ticket.estado === 'pendiente' ? '⏳ Pendiente' : 
                   ticket.estado === 'en_proceso' ? '⚙️ En Proceso' : 
                   ticket.estado === 'resuelto' ? '✅ Resuelto' : '❌ Rechazado'}
                </span>
                <span className={cardStyles["section-value"]} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(ticket.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
            </div>

            {ticket.imagen_url && (
              <div className={cardStyles["card-section"]}>
                <span className={cardStyles["attachment-indicator"]}>📎 Imagen</span>
              </div>
            )}
          </div>

          <div className={cardStyles["card-actions"]}>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["view"]}`}
              onClick={() => onVerDetalle(ticket)}
              title="Ver detalle"
            >
              👁️
            </button>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["edit"]}`}
              onClick={() => onActualizar(ticket)}
              title="Responder / Actualizar"
            >
              ✏️
            </button>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["delete"]}`}
              onClick={() => onEliminar(ticket.id)}
              title="Eliminar ticket"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TablaTickets;
