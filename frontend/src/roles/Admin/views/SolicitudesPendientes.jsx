import React, { useState, useEffect } from "react";
import api from "../../../api";
import { IconCheckCircle } from "../components/Icons";

function SolicitudesPendientes({ token, onSuccess, onCancel }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargarSolicitudes = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.get(
        `/visitas/admin/solicitudes_pendientes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSolicitudes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cargar las solicitudes");
    }
    setCargando(false);
  };

  const aprobarSolicitud = async (visitaId) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas aprobar esta solicitud de visita?"
      )
    )
      return;
    try {
      await api.post(
        `/visitas/admin/aprobar_solicitud/${visitaId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setError("");
      onSuccess && onSuccess();
      cargarSolicitudes(); // Recargar la lista
    } catch (err) {
      setError(err.response?.data?.detail || "Error al aprobar la solicitud");
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const isMobile = window.innerWidth < 800;

  if (cargando) return <div>Cargando solicitudes...</div>;
  if (error) return <div className="qr-error">{error}</div>;

  return (
    <div className="solicitudes-container">
      <h3>Solicitudes de Visita Pendientes</h3>
      {solicitudes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          No hay solicitudes pendientes
        </div>
      ) : (
        <div className={isMobile ? "visitas-cards-mobile" : "solicitudes-grid"}>
          {solicitudes.map((solicitud, i) =>
            isMobile ? (
              <div className="visita-card-mobile" key={solicitud.id}>
                <div className="visita-card-mobile-info">
                  <div>
                    <b>Residente:</b> {solicitud.residente.nombre}
                  </div>
                  <div>
                    <b>Unidad:</b> {solicitud.residente.unidad_residencial}
                  </div>
                  <div>
                    <b>Teléfono:</b> {solicitud.residente.telefono}
                  </div>
                  <div>
                    <b>Visitante:</b> {solicitud.visitante.nombre_conductor}
                  </div>
                  <div>
                    <b>Vehículo:</b> {solicitud.visitante.tipo_vehiculo}
                  </div>
                  <div>
                    <b>Placa:</b> {solicitud.visitante.placa_vehiculo}
                  </div>
                  <div>
                    <b>Fecha Entrada:</b>{" "}
                    {new Date(solicitud.fecha_entrada).toLocaleString()}
                  </div>
                  <div>
                    <b>Motivo:</b> {solicitud.motivo_visita}
                  </div>
                </div>
                <div className="visita-card-mobile-action">
                  <IconCheckCircle
                    onClick={() => aprobarSolicitud(solicitud.id)}
                    title="Aprobar solicitud"
                  />
                </div>
              </div>
            ) : (
              <div
                className="visita-card-mobile"
                key={solicitud.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <div className="visita-card-mobile-info" style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#1976d2",
                      fontSize: "1.1em",
                      marginBottom: 4,
                    }}
                  >
                    Solicitud #{solicitud.id} -{" "}
                    {new Date(solicitud.fecha_solicitud).toLocaleString()}
                  </div>
                  <div>
                    <b>Residente:</b> {solicitud.residente.nombre}{" "}
                    <span style={{ color: "#888", fontWeight: 400 }}>
                      ({solicitud.residente.unidad_residencial})
                    </span>
                  </div>
                  <div>
                    <b>Visitante:</b> {solicitud.visitante.nombre_conductor}
                  </div>
                  <div>
                    <b>
                      <span style={{ color: "#1976d2" }}>A quién visita:</span>
                    </b>{" "}
                    {solicitud.residente.nombre}
                  </div>
                  <div>
                    <b>Vehículo:</b> {solicitud.visitante.tipo_vehiculo}{" "}
                    <span style={{ color: "#888" }}>
                      {solicitud.visitante.placa_vehiculo}
                    </span>
                  </div>
                  <div>
                    <b>Fecha Entrada:</b>{" "}
                    {new Date(solicitud.fecha_entrada).toLocaleString()}
                  </div>
                  <div>
                    <b>Motivo:</b> {solicitud.motivo_visita}
                  </div>
                </div>
                <IconCheckCircle
                  onClick={() => aprobarSolicitud(solicitud.id)}
                  title="Aprobar solicitud"
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default SolicitudesPendientes;
