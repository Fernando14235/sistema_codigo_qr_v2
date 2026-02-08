import React, { useState, useEffect } from "react";
import api from "../../../api";
import { DeleteIcon } from "../components/Icons";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import cardStyles from "../../../css/Cards.module.css";
import { handleOrden } from "../utils/helpers";

// Listado de historial (Diseño Moderno de Tarjetas)
function HistorialVisitasList({ historial, onEliminar }) {
  if (!historial || historial.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: "40px" }}>
        No hay registros en el historial.
      </p>
    );
  }

  return (
    <div className={cardStyles["cards-container"]}>
      {historial.map((h, i) => (
        <div className={cardStyles["horizontal-card"]} key={i}>
          <div className={`${cardStyles["status-stripe"]} ${
            h.estado === 'completado' || h.estado === 'aprobado' ? cardStyles["success"] : 
            h.estado === 'rechazado' || h.estado === 'expirado' ? cardStyles["danger"] : cardStyles["warning"]
          }`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Miembro / Unidad</span>
              <span className={cardStyles["section-value"]}>{h.nombre_residente}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>🏢 {h.unidad_residencial}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Visitante / Motivo</span>
              <span className={cardStyles["section-value"]}>{h.nombre_visitante}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>📌 {h.motivo_visita || '-'} / 📍 {h.destino_visita || '-'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🆔 DNI: {h.dni_conductor || '-'}</span>
                {h.placa_vehiculo && (
                   <span style={{ fontSize: '0.75rem', color: '#1e293b' }}>🚗 Placa: {h.placa_vehiculo}</span>
                )}
                {h.placa_chasis && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⚙️ Chasis: {h.placa_chasis}</span>
                )}
              </div>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Entrada / Salida</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                <span>📥 {h.fecha_entrada ? new Date(h.fecha_entrada).toLocaleString() : 'Pendiente'}</span>
                <span>📤 {h.fecha_salida ? new Date(h.fecha_salida).toLocaleString() : '-'}</span>
              </div>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado</span>
              <span className={`${cardStyles["badge"]} ${cardStyles["badge-" + h.estado]}`}>
                {h.estado}
              </span>
            </div>
          </div>

          <div className={cardStyles["card-actions"]}>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["delete"]}`}
              onClick={() => onEliminar(h.id || h.visita_id)}
              title="Eliminar del historial"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistorialVisitas({ token, onCancel, onNotification }) {
  const [historial, setHistorial] = useState([]);
  const [filtroHistResidente, setFiltroHistResidente] = useState("");
  const [filtroHistUnidad, setFiltroHistUnidad] = useState("");
  const [filtroHistVisitante, setFiltroHistVisitante] = useState("");
  const [filtroHistEstado, setFiltroHistEstado] = useState("");
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [ordenHistorial, setOrdenHistorial] = useState({
    campo: "fecha_entrada",
    asc: false,
  });
  const [pageHistorial, setPageHistorial] = useState(1);
  const [totalPagesHistorial, setTotalPagesHistorial] = useState(1);
  const limitHistorial = 15;

  // Cargar historial de visitas con filtros y orden
  const cargarHistorial = async () => {
    try {
      const params = {};
      if (filtroHistResidente) params.nombre_residente = filtroHistResidente;
      if (filtroHistUnidad) params.unidad_residencial = filtroHistUnidad;
      if (filtroHistVisitante) params.nombre_visitante = filtroHistVisitante;
      if (filtroHistEstado) params.estado = filtroHistEstado;
      if (busquedaHistorial) params.q = busquedaHistorial;
      params.orden = ordenHistorial.campo;
      params.asc = ordenHistorial.asc;
      params.page = pageHistorial;
      params.limit = limitHistorial;

      const res = await api.get(`/visitas/admin/historial`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.data) {
        setHistorial(res.data.data);
        setTotalPagesHistorial(res.data.total_pages);
      } else {
        setHistorial(res.data.visitas || []);
      }
    } catch {
      onNotification({ message: "Error al cargar historial", type: "error" });
    }
  };

  const eliminarVisitaAdmin = async (id) => {
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar este registro del historial?"
      )
    )
      return;
    try {
      await api.delete(`/visitas/admin/historial/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onNotification({ message: "Registro eliminado", type: "success" });
      cargarHistorial();
    } catch (error) {
      onNotification({ message: "Error al eliminar registro", type: "error" });
    }
  };

  // Effects to reset pagination when filters change
  useEffect(() => {
    setPageHistorial(1);
  }, [
    filtroHistResidente,
    filtroHistUnidad,
    filtroHistVisitante,
    filtroHistEstado,
    busquedaHistorial,
  ]);

  // Effects to fetch data when page changes
  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line
  }, [
    filtroHistResidente,
    filtroHistUnidad,
    filtroHistVisitante,
    filtroHistEstado,
    busquedaHistorial,
    ordenHistorial,
    pageHistorial,
  ]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>Historial de Visitas</h3>
      <div className="admin-search">
        <input
          type="text"
          placeholder="Residente"
          value={filtroHistResidente}
          onChange={(e) => setFiltroHistResidente(e.target.value)}
        />
        <input
          type="text"
          placeholder="Unidad Residencial"
          value={filtroHistUnidad}
          onChange={(e) => setFiltroHistUnidad(e.target.value)}
        />
        <input
          type="text"
          placeholder="Visitante"
          value={filtroHistVisitante}
          onChange={(e) => setFiltroHistVisitante(e.target.value)}
        />
        <input
          type="text"
          placeholder="Placa o Chasis"
          value={busquedaHistorial}
          onChange={(e) => setBusquedaHistorial(e.target.value)}
        />
        <select
          value={filtroHistEstado}
          onChange={(e) => setFiltroHistEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazado">Rechazado</option>
          <option value="aprobado">Aprobado</option>
          <option value="completado">Completado</option>
          <option value="expirado">Expirado</option>
        </select>
      </div>
      <HistorialVisitasList 
        historial={historial} 
        onEliminar={eliminarVisitaAdmin} 
      />
      <PaginationControls
        currentPage={pageHistorial}
        totalPages={totalPagesHistorial}
        onPageChange={setPageHistorial}
      />
    </section>
  );
}

export default HistorialVisitas;
