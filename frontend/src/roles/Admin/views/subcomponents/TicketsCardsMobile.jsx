import React from "react";

function TicketsCardsMobile({ tickets, onVerDetalle, onActualizar, onEliminar }) {
  if (!tickets || tickets.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          color: "#888",
          fontWeight: "bold",
          fontSize: "1.1em",
        }}
      >
        No hay tickets
      </p>
    );
  }
  return (
    <div className="tickets-cards-mobile">
      {tickets.map((ticket) => (
        <div className="ticket-card-mobile" key={ticket.id}>
          <div className="ticket-card-mobile-info">
            <div className="ticket-header-mobile">
              <b>Titulo: </b>
              <span className="ticket-titulo-mobile">{ticket.titulo}</span>
              <br />
              <b>Estado: </b>
              <span className={`ticket-estado-mobile ${ticket.estado}`}>
                {ticket.estado}
              </span>
            </div>
            <div>
              <b>Residente:</b> {ticket.nombre_residente || "N/A"}
            </div>
            <div>
              <b>Descripción:</b> {ticket.descripcion}
            </div>
            <div>
              <b>Fecha:</b> {new Date(ticket.fecha_creacion).toLocaleString()}
            </div>
            {ticket.imagen_url && (
              <div>
                <b>Imagen:</b>{" "}
                <span style={{ color: "#1976d2" }}>📎 Imagen Adjunta</span>
              </div>
            )}
            {ticket.respuesta_admin && (
              <div>
                <b>Respuesta:</b> {ticket.respuesta_admin}
              </div>
            )}
          </div>
          <br />
          <div className="ticket-card-mobile-actions">
            <span
              onClick={() => onVerDetalle(ticket)}
              style={{
                color: "#1976d2",
                cursor: "pointer",
                fontSize: 30,
                marginRight: 30,
              }}
              title="Ver ticket"
            >
              👁️
            </span>
            <span
              onClick={() => onActualizar(ticket)}
              style={{
                color: "#43a047",
                cursor: "pointer",
                fontSize: 30,
                marginRight: 30,
              }}
              title="Responder"
            >
              ✏️
            </span>
            <span
              onClick={() => onEliminar(ticket.id)}
              style={{ color: "#f44336", cursor: "pointer", fontSize: 30 }}
              title="Eliminar ticket"
            >
              🗑️
            </span>
            <br />
            <hr />
            <br />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TicketsCardsMobile;
