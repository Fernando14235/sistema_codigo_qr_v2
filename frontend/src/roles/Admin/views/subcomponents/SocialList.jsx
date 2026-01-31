import React from "react";
import styles from "../../../../SocialDashboard.module.css";

function SocialList({
  publicaciones,
  onVerDetalle,
  onEditar,
  onEliminar,
  isAdmin,
  isOwnTab,
}) {
  const isMobile = window.innerWidth < 700;

  const IconVer = () => (
    <span title="Ver" style={{ cursor: "pointer", fontSize: 20 }} role="img" aria-label="ver">
      🔍
    </span>
  );
  const IconEditar = () => (
    <span title="Editar" style={{ cursor: "pointer", fontSize: 20 }} role="img" aria-label="editar">
      ✏️
    </span>
  );
  const IconEliminar = () => (
    <span
      title="Eliminar"
      style={{ cursor: "pointer", color: "#e53935", fontSize: 20 }}
      role="img"
      aria-label="eliminar"
    >
      🗑️
    </span>
  );

  if (!publicaciones || publicaciones.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          color: "#888",
          fontWeight: "bold",
          fontSize: "1.1em",
          marginTop: 32,
        }}
      >
        No hay publicaciones
      </p>
    );
  }

  if (isMobile) {
    return (
      <div className="social-cards-mobile">
        {publicaciones.map((pub) => (
          <div
            className="social-card-mobile"
            key={pub.id}
            style={pub.estado === "fallido" ? { backgroundColor: "#ffebee" } : {}}
          >
            <div className="social-card-mobile-info">
              <div>
                <b>Título:</b> {pub.titulo}
              </div>
              <div>
                <b>Tipo:</b> {pub.tipo_publicacion}
              </div>
              <div>
                <b>Estado:</b>{" "}
                <span
                  style={{
                    color:
                      pub.estado === "fallido"
                        ? "#d32f2f"
                        : pub.estado === "publicado"
                        ? "#2e7d32"
                        : "#f57c00",
                    fontWeight: "bold",
                  }}
                >
                  {pub.estado}
                </span>
              </div>
              <div>
                <b>Fecha Creación:</b>{" "}
                {new Date(pub.fecha_creacion).toLocaleDateString()}
              </div>
              <div>
                <b>Hora Creación:</b>{" "}
                {new Date(pub.fecha_creacion).toLocaleTimeString()}
              </div>
            </div>
            <div
              className="social-card-mobile-actions"
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 15,
              }}
            >
              <span onClick={() => onVerDetalle(pub)}>
                <IconVer />
              </span>
              {isAdmin && isOwnTab && (
                <>
                  <span onClick={() => onEditar(pub)}>
                    <IconEditar />
                  </span>
                  <span onClick={() => onEliminar(pub.id)}>
                    <IconEliminar />
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className={styles["social-table"]}>
      <thead>
        <tr>
          <th>Título</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {publicaciones.map((pub) => (
          <tr
            key={pub.id}
            style={pub.estado === "fallido" ? { backgroundColor: "#ffebee" } : {}}
          >
            <td>{pub.titulo}</td>
            <td>{pub.tipo_publicacion}</td>
            <td>
              <span
                style={{
                  color:
                    pub.estado === "fallido"
                      ? "#d32f2f"
                      : pub.estado === "publicado"
                      ? "#2e7d32"
                      : "#f57c00",
                  fontWeight: "bold",
                }}
              >
                {pub.estado}
              </span>
            </td>
            <td>{new Date(pub.fecha_creacion).toLocaleDateString()}</td>
            <td>{new Date(pub.fecha_creacion).toLocaleTimeString()}</td>
            <td
              className={styles["social-table-actions"]}
              style={{ display: "flex", gap: 15, justifyContent: "center" }}
            >
              <span onClick={() => onVerDetalle(pub)}>
                <IconVer />
              </span>
              {isAdmin && isOwnTab && (
                <>
                  <span onClick={() => onEditar(pub)}>
                    <IconEditar />
                  </span>
                  <span onClick={() => onEliminar(pub.id)}>
                    <IconEliminar />
                  </span>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SocialList;
