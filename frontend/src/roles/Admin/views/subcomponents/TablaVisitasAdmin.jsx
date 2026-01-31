import React from "react";

function TablaVisitasAdmin({ visitas, onEditar, onEliminar }) {
  const isMobile = window.innerWidth < 800;
  if (!visitas || visitas.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888" }}>
        No hay visitas registradas.
      </p>
    );
  }
  if (isMobile) {
    return (
      <div className="visitas-cards-mobile">
        {visitas.map((v, i) => (
          <div className="visita-card-mobile" key={i}>
            <div className="visita-card-mobile-info">
              <div>
                <b>Visitante:</b> {v.visitante?.nombre_conductor || "-"}
              </div>
              <div>
                <b>Teléfono:</b> {v.visitante?.telefono || "-"}
              </div>
              <div>
                <b>Vehículo:</b> {v.visitante?.tipo_vehiculo || "-"}
              </div>
              <div>
                <b>Motivo:</b> {v.notas || "-"}
              </div>
              <div>
                <b>Estado:</b> {v.estado}
              </div>
              <div>
                <b>Expiración:</b> {v.expiracion == "S" ? "Sí" : "No"}
              </div>
              <div>
                <b>Fecha Entrada:</b>{" "}
                {v.fecha_entrada
                  ? new Date(v.fecha_entrada).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div className="visita-card-mobile-action">
              <span
                onClick={() => onEliminar(v.id)}
                style={{
                  color: "#e53935",
                  cursor: "pointer",
                  fontSize: 28,
                  marginRight: 8,
                }}
                title="Eliminar visita"
              >
                🗑️
              </span>
              <span
                onClick={() =>
                  v.estado === "pendiente" && v.expiracion === "N"
                    ? onEditar(v)
                    : null
                }
                style={{
                  color:
                    v.estado === "pendiente" && v.expiracion === "N"
                      ? "#1976d2"
                      : "#bdbdbd",
                  cursor:
                    v.estado === "pendiente" && v.expiracion === "N"
                      ? "pointer"
                      : "not-allowed",
                  fontSize: 28,
                }}
                title={
                  v.estado === "pendiente" && v.expiracion === "N"
                    ? "Editar visita"
                    : "Solo puedes editar visitas pendientes y no expiradas"
                }
              >
                ✏️
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: "#1976d2" }}>Mis Visitas</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Visitante</th>
              <th>Teléfono</th>
              <th>Vehículo</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Expiración</th>
              <th>Fecha Entrada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map((v, i) => (
              <tr key={i}>
                <td>{v.visitante?.nombre_conductor || "-"}</td>
                <td>{v.visitante?.telefono || "-"}</td>
                <td>{v.visitante?.tipo_vehiculo || "-"}</td>
                <td>{v.notas || "-"}</td>
                <td>{v.estado}</td>
                <td>{v.expiracion === "S" ? "Sí" : "No"}</td>
                <td>
                  {v.fecha_entrada
                    ? new Date(v.fecha_entrada).toLocaleString()
                    : "-"}
                </td>
                <td>
                  <span
                    onClick={() => onEliminar(v.id)}
                    style={{
                      color: "#e53935",
                      cursor: "pointer",
                      fontSize: 20,
                      marginRight: 8,
                    }}
                    title="Eliminar visita"
                  >
                    🗑️
                  </span>
                  <span
                    onClick={() =>
                      v.estado === "pendiente" && v.expiracion === "N"
                        ? onEditar(v)
                        : null
                    }
                    style={{
                      color:
                        v.estado === "pendiente" && v.expiracion === "N"
                          ? "#1976d2"
                          : "#bdbdbd",
                      cursor:
                        v.estado === "pendiente" && v.expiracion === "N"
                          ? "pointer"
                          : "not-allowed",
                      fontSize: 20,
                    }}
                    title={
                      v.estado === "pendiente" && v.expiracion === "N"
                        ? "Editar visita"
                        : "Solo puedes editar visitas pendientes y no expiradas"
                    }
                  >
                    ✏️
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

export default TablaVisitasAdmin;
