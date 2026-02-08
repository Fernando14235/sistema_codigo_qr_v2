import React, { useState, useEffect } from "react";
import BtnRegresar from "../components/BtnRegresar";
import VisitasDelDiaCards from "../components/VisitasDelDiaCards";
import PaginationControls from "../../../components/PaginationControls";
import api from "../../../api";

function VisitasDelDia({ token, onCancel }) {
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtros, setFiltros] = useState({
    fecha: new Date().toLocaleDateString('en-CA'), // Fecha actual en formato YYYY-MM-DD (Local)
    estado: "",
    busqueda: ""
  });
  const limit = 12;

  useEffect(() => {
    cargarVisitas();
  }, [page, filtros]);

  const cargarVisitas = async () => {
    setCargando(true);
    setError("");
    try {
      const params = {
        page,
        limit,
        ...(filtros.fecha && { fecha: filtros.fecha }),
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.busqueda && { busqueda: filtros.busqueda })
      };

      const response = await api.get("/visitas/guardia/visitas-del-dia", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setVisitas(response.data.visitas || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error("Error cargando visitas:", err);
      setError(err.response?.data?.detail || "No se pudieron cargar las visitas del día.");
    }
    setCargando(false);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1); // Resetear a página 1 al cambiar filtros
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: new Date().toLocaleDateString('en-CA'),
      estado: "",
      busqueda: ""
    });
    setPage(1);
  };

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3 className="visitas-dia-title">📋 Visitas del Día</h3>
      
      {/* Filtros */}
      <div className="visitas-dia-filtros">
        <div className="filtro-group">
          <label htmlFor="estado-filtro">🔍 Estado:</label>
          <select
            id="estado-filtro"
            value={filtros.estado}
            onChange={(e) => handleFiltroChange("estado", e.target.value)}
            className="filtro-select">
            <option value="">Todos</option>
            <option value="pendiente">🟡 Pendiente</option>
            <option value="aceptado">🟢 Aceptado</option>
            <option value="aprobado">🟢 Aprobado</option>
            <option value="rechazado">🔴 Rechazado</option>
            <option value="completado">⚫ Completado</option>
          </select>
        </div>

        <div className="filtro-group filtro-busqueda">
          <label htmlFor="busqueda-filtro">🔎 Buscar:</label>
          <input
            id="busqueda-filtro"
            type="text"
            placeholder="Nombre o placa..."
            value={filtros.busqueda}
            onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
            className="filtro-input"
          />
        </div>

        <button onClick={limpiarFiltros} className="btn-limpiar-filtros">
          🗑️ Limpiar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      {!cargando && visitas.length > 0 && (
        <div className="visitas-dia-stats">
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{visitas.length}</span>
            <span className="stat-label">Visitas</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🟢</span>
            <span className="stat-value">
              {visitas.filter(v => v.estado === 'aceptado').length}
            </span>
            <span className="stat-label">Aceptadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🟢</span>
            <span className="stat-value">
              {visitas.filter(v => v.estado === 'aprobado').length}
            </span>
            <span className="stat-label">Aprobadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🟡</span>
            <span className="stat-value">
              {visitas.filter(v => v.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⚫</span>
            <span className="stat-value">
              {visitas.filter(v => v.estado === 'completado').length}
            </span>
            <span className="stat-label">Completadas</span>
          </div>
        </div>
      )}

      {cargando && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando visitas...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}
      
      {!cargando && !error && visitas.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No hay visitas para mostrar con los filtros seleccionados.</p>
        </div>
      )}
      
      {!cargando && !error && visitas.length > 0 && (
        <>
          <VisitasDelDiaCards visitas={visitas} />
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

export default VisitasDelDia;
