import React, { useState, useEffect, useCallback } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

function DashboardGlobal({ token, onCancel }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarDashboard = useCallback(async () => {
    try {
      const res = await api.get("/super-admin/dashboard-global/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatos(res.data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      setNotification({ message: "Error al cargar el dashboard", type: "error" });
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDashboard();
    // Auto-refresh cada 60 segundos
    const interval = setInterval(cargarDashboard, 60000);
    return () => clearInterval(interval);
  }, [cargarDashboard]);

  const rolLabel = {
    admin: "Administradores",
    residente: "Residentes",
    guardia: "Guardias",
    super_admin: "Super Admins",
  };

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>📊 Dashboard Global</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={cargarDashboard}>
            🔄 Actualizar
          </button>
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      {ultimaActualizacion && (
        <p className="dashboard-timestamp">
          Última actualización: {ultimaActualizacion.toLocaleTimeString()}
        </p>
      )}

      {cargando ? (
        <div className="loading">Cargando métricas del sistema…</div>
      ) : datos ? (
        <div className="dashboard-global-content">
          {/* Entidades */}
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">🏢 Entidades</h3>
            <div className="dashboard-metrics-grid">
              <div className="metric-card metric-total">
                <span className="metric-number">{datos.entidades?.total ?? 0}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-card metric-activo">
                <span className="metric-number">{datos.entidades?.activas ?? 0}</span>
                <span className="metric-label">Activas</span>
              </div>
              <div className="metric-card metric-inactivo">
                <span className="metric-number">{datos.entidades?.inactivas ?? 0}</span>
                <span className="metric-label">Suspendidas</span>
              </div>
            </div>
          </section>

          {/* Usuarios */}
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">👥 Usuarios</h3>
            <div className="dashboard-metrics-grid">
              <div className="metric-card metric-total span-full">
                <span className="metric-number">{datos.usuarios?.total ?? 0}</span>
                <span className="metric-label">Total Usuarios</span>
              </div>
              {datos.usuarios?.por_rol &&
                Object.entries(datos.usuarios.por_rol).map(([rol, count]) => (
                  <div key={rol} className="metric-card metric-rol">
                    <span className="metric-number">{count}</span>
                    <span className="metric-label">{rolLabel[rol] ?? rol}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Visitas y Tickets */}
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">📋 Actividad de Hoy</h3>
            <div className="dashboard-metrics-grid">
              <div className="metric-card metric-visitas">
                <span className="metric-number">{datos.visitas_activas_hoy ?? 0}</span>
                <span className="metric-label">Visitas Activas Hoy</span>
              </div>
              <div className="metric-card metric-tickets">
                <span className="metric-number">{datos.tickets_pendientes ?? 0}</span>
                <span className="metric-label">Tickets Pendientes</span>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <p>No se pudieron cargar los datos del dashboard.</p>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

export default DashboardGlobal;
