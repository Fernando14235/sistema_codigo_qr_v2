import React, { useState } from "react";
import { getImageUrl } from "../../../../utils/imageUtils";

function TicketDetalle({ ticket, onRegresar, onActualizar }) {
  const [modalImagen, setModalImagen] = useState(false);
  return (
    <div className="ticket-detalle">
      <div className="ticket-detalle-header">
        <h3 style={{ color: "#1976d2", margin: 0 }}>Ticket #{ticket.id}</h3>
        <span className={`ticket-estado-badge ${ticket.estado}`}>
          {ticket.estado}
        </span>
      </div>
      <br />
      <div className="ticket-detalle-content">
        <div className="ticket-section">
          <h3>📋 Información del Ticket</h3>
          <div className="ticket-info-grid">
            <div>
              <b>Título:</b> {ticket.titulo}
            </div>
            <div>
              <b>Fecha de creación:</b>{" "}
              {new Date(ticket.fecha_creacion).toLocaleString()}
            </div>
            <div>
              <b>Estado:</b> {ticket.estado}
            </div>
            {ticket.fecha_respuesta && (
              <div>
                <b>Fecha de respuesta:</b>{" "}
                {new Date(ticket.fecha_respuesta).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <br />
        <div className="ticket-section">
          <h3>👤 Información del Residente</h3>
          <div className="ticket-info-grid">
            <div>
              <b>Nombre:</b> {ticket.nombre_residente || "N/A"}
            </div>
            <div>
              <b>Unidad:</b> {ticket.unidad_residencial || "N/A"}
            </div>
            <div>
              <b>Teléfono:</b> {ticket.telefono || "N/A"}
            </div>
          </div>
        </div>
        <br />
        <div className="ticket-section">
          <h3>📝Asunto del Ticket</h3>
          <div className="ticket-description">{ticket.descripcion}</div>
        </div>

        {ticket.imagen_url && (
          <div className="ticket-section">
            <div className="ticket-imagen-container">
              <img
                src={getImageUrl(ticket.imagen_url)}
                alt="Imagen del ticket"
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "2px solid #e3eafc",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #1976d220",
                  display: "block",
                }}
                onClick={() => setModalImagen(true)}
                title="Haz clic para ver en grande"
              />
              {modalImagen && (
                <div
                  className="modal-imagen-ticket"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                  }}
                  onClick={() => setModalImagen(false)}
                >
                  <img
                    src={getImageUrl(ticket.imagen_url)}
                    alt="Imagen del ticket"
                    style={{
                      maxWidth: "90vw",
                      maxHeight: "90vh",
                      borderRadius: 16,
                      boxShadow: "0 4px 32px #0008",
                      background: "#fff",
                      display: "block",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <button
                    onClick={() => setModalImagen(false)}
                    style={{
                      position: "fixed",
                      top: 30,
                      right: 40,
                      fontSize: 32,
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      zIndex: 10000,
                    }}
                    title="Cerrar"
                  >
                    x
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {ticket.respuesta_admin && (
          <div className="ticket-section">
            <h3>💬 Respuesta del Administrador</h3>
            <div className="ticket-respuesta">{ticket.respuesta_admin}</div>
          </div>
        )}
      </div>
      <br />

      <div className="ticket-detalle-actions">
        <button className="btn-primary" onClick={() => onActualizar(ticket)}>
          ✏️ Responder/Actualizar
        </button>
        <button className="btn-secondary" onClick={onRegresar}>
          Regresar
        </button>
      </div>
    </div>
  );
}

export default TicketDetalle;
