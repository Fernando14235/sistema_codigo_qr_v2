import React from "react";

function TablaTickets({ tickets, onVerDetalle, onActualizar, onEliminar }) {
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
    <div style={{ width: "100%", marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: "#1976d2" }}>Tickets de Soporte</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Residente</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Hora Creación</th>
              <th>Imagenes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>#{ticket.id}</td>
                <td>{ticket.titulo}</td>
                <td>{ticket.nombre_residente || "N/A"}</td>
                <td>
                  <span className={`ticket-estado-badge ${ticket.estado}`}>
                    {ticket.estado}
                  </span>
                </td>
                <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                <td>{new Date(ticket.fecha_creacion).toLocaleTimeString()}</td>
                <td>{ticket.imagen_url ? "📎" : "-"}</td>
                <td>
                  <span
                    onClick={() => onVerDetalle(ticket)}
                    style={{
                      color: "#1976d2",
                      cursor: "pointer",
                      fontSize: 20,
                      marginRight: 8,
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
                      fontSize: 20,
                      marginRight: 8,
                    }}
                    title="Responder"
                  >
                    ✏️
                  </span>
                  <span
                    onClick={() => onEliminar(ticket.id)}
                    style={{
                      color: "#f44336",
                      cursor: "pointer",
                      fontSize: 20,
                    }}
                    title="Eliminar ticket"
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaTickets;
