import React, { useState, useEffect } from "react";
import api from "../../../../api";
import styles from "../../../../SocialDashboard.module.css";
import { getImageUrl } from "../../../../utils/imageUtils";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

function SocialDetail({ detalle, token, rol, onClose }) {
  const [modalImagen, setModalImagen] = useState({
    isOpen: false,
    currentIndex: 0,
    images: [],
  });
  const [adminNombre, setAdminNombre] = useState("");
  const [resultadosEncuesta, setResultadosEncuesta] = useState(null);
  const [residentes, setResidentes] = useState([]);

  // Cargar nombre del admin y resultados de encuesta
  useEffect(() => {
    if (detalle && detalle.admin_id) {
      api
        .get(`/usuarios/usuario_nombre/${detalle.admin_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setAdminNombre(res.data.nombre))
        .catch(() => setAdminNombre(""));
    }

    if (detalle && detalle.tipo_publicacion === "encuesta") {
      cargarResultadosEncuesta(detalle.id);
    }

    if (rol === "admin" && detalle && !detalle.para_todos) {
      api
        .get(`/usuarios/residentes_full`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const data = res.data.data || res.data;
          setResidentes(Array.isArray(data) ? data : []);
        })
        .catch(() => setResidentes([]));
    }
    // eslint-disable-next-line
  }, [detalle, token]);

  const cargarResultadosEncuesta = async (id) => {
    try {
      const res = await api.get(`/social/resultados/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResultadosEncuesta(res.data);
    } catch {
      setResultadosEncuesta(null);
    }
  };

  return (
    <div className={styles["social-detail-card"]}>
      <h3>{detalle.titulo}</h3>
      <div className={styles["social-detail-row"]}>
        <b>Creado por:</b>
        {adminNombre ? ` ${adminNombre}` : " Desconocido"}
      </div>
      <div className={styles["social-detail-row"]}>
        <b>Tipo:</b> {detalle.tipo_publicacion}
      </div>
      <div className={styles["social-detail-row"]}>
        <b>Estado:</b>
        <span
          style={{
            color:
              detalle.estado === "fallido"
                ? "#d32f2f"
                : detalle.estado === "publicado"
                ? "#2e7d32"
                : "#f57c00",
            fontWeight: "bold",
            marginLeft: "8px",
          }}
        >
          {detalle.estado}
        </span>
      </div>

      {rol === "admin" && (
        <div className={styles["social-detail-row"]}>
          <b>Destinatarios:</b>
          {detalle.para_todos ? (
            <span style={{ color: "#2e7d32", marginLeft: "8px" }}>
              Todos los residentes
            </span>
          ) : (
            <div style={{ marginTop: "4px" }}>
              {detalle.destinatarios && detalle.destinatarios.length > 0 ? (
                <ul style={{ margin: "0", paddingLeft: "20px" }}>
                  {detalle.destinatarios.map((dest) => {
                    const residente = residentes.find(
                      (r) =>
                        r.residente_id === dest.residente_id ||
                        r.id === dest.residente_id
                    );
                    return (
                      <li key={dest.id}>
                        {residente
                          ? residente.nombre
                          : `ID: ${dest.residente_id}`}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span style={{ color: "#d32f2f" }}>
                  No se especificaron destinatarios
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles["social-detail-row"]}>
        <b>Contenido:</b>
        <div style={{ marginTop: "4px" }}>
          {detalle.contenido}
          {detalle.estado === "fallido" &&
            detalle.contenido.includes("[ERROR:") && (
              <div
                style={{
                  backgroundColor: "#ffebee",
                  border: "1px solid #d32f2f",
                  borderRadius: "4px",
                  padding: "8px",
                  marginTop: "8px",
                  color: "#d32f2f",
                  fontWeight: "bold",
                }}
              >
                ⚠️ Error:{" "}
                {detalle.contenido.split("[ERROR:")[1]?.split("]")[0] ||
                  "Error desconocido"}
              </div>
            )}
        </div>
      </div>

      <div className={styles["social-detail-row"]}>
        <b>Fecha:</b> {new Date(detalle.fecha_creacion).toLocaleString()}
      </div>

      <div className={styles["social-detail-row"]}>
        <b>Imágenes:</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {detalle.imagenes && detalle.imagenes.length > 0 ? (
            detalle.imagenes.map((imagen, index) => (
              <div key={imagen.id || index} className="imagen-container">
                <img
                  src={getImageUrl(imagen.imagen_url)}
                  alt={`Imagen ${index + 1}`}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "2px solid #e0e0e0",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.2)",
                    display: "block",
                  }}
                  onClick={() =>
                    setModalImagen({
                      isOpen: true,
                      currentIndex: index,
                      images: detalle.imagenes,
                    })
                  }
                  title="Haz clic para ver en grande"
                />
              </div>
            ))
          ) : (
            <span style={{ color: "#888", marginLeft: 8 }}>Sin imágenes</span>
          )}

          {modalImagen.isOpen && (
            <div
              className="modal-imagen"
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
              onClick={() =>
                setModalImagen({ isOpen: false, currentIndex: 0, images: [] })
              }
            >
              <img
                src={getImageUrl(
                  modalImagen.images[modalImagen.currentIndex].imagen_url
                )}
                alt={`Imagen ${modalImagen.currentIndex + 1}`}
                style={{
                  maxWidth: "95vw",
                  maxHeight: "95vh",
                  borderRadius: 16,
                  boxShadow: "0 4px 32px #0008",
                  background: "#fff",
                  display: "block",
                  objectFit: "contain",
                }}
                onClick={(e) => e.stopPropagation()}
              />

              {modalImagen.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImagen((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex > 0
                            ? prev.currentIndex - 1
                            : prev.images.length - 1,
                      }));
                    }}
                    style={{
                      position: "fixed",
                      left: 20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 32,
                      color: "#fff",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      cursor: "pointer",
                      zIndex: 10000,
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImagen((prev) => ({
                        ...prev,
                        currentIndex:
                          prev.currentIndex < prev.images.length - 1
                            ? prev.currentIndex + 1
                            : 0,
                      }));
                    }}
                    style={{
                      position: "fixed",
                      right: 20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 32,
                      color: "#fff",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      cursor: "pointer",
                      zIndex: 10000,
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ›
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  setModalImagen({ isOpen: false, currentIndex: 0, images: [] })
                }
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
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {detalle.tipo_publicacion === "encuesta" && (
        <div className={styles["social-detail-row"]}>
          <b>Opciones de encuesta:</b>
          <div style={{ marginTop: 8 }}>
            {resultadosEncuesta &&
            resultadosEncuesta.opciones &&
            resultadosEncuesta.opciones.length > 0 ? (
              <>
                <ul>
                  {resultadosEncuesta.opciones.map((res) => (
                    <li key={res.opcion_id}>
                      {res.texto}: <b>{res.votos}</b> voto(s)
                    </li>
                  ))}
                </ul>
                <div>
                  Total de votos: <b>{resultadosEncuesta.total_votos}</b>
                </div>
                <div style={{ maxWidth: 320, marginTop: 16, margin: "0 auto" }}>
                  <Pie
                    data={{
                      labels: resultadosEncuesta.opciones.map((o) => o.texto),
                      datasets: [
                        {
                          data: resultadosEncuesta.opciones.map((o) => o.votos),
                          backgroundColor: [
                            "#1976d2",
                            "#43a047",
                            "#e53935",
                            "#fbc02d",
                            "#8e24aa",
                            "#00bcd4",
                            "#ff9800",
                            "#c2185b",
                          ],
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { position: "bottom" } },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ color: "#888", marginTop: 8 }}>
                Aún no hay votos registrados para esta encuesta.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="btn-secondary"
        style={{ marginTop: 20, width: "100%" }}
      >
        Cerrar
      </button>
    </div>
  );
}

export default SocialDetail;
