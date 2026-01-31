import React, { useState, useEffect } from "react";
import api from "../../../api";
import { DeleteIcon } from "../components/Icons";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import { handleOrden } from "../utils/helpers";

// Subcomponente: Cards móviles para historial
function HistorialCardsMobile({ historial }) {
  return (
    <div className="historial-cards-mobile">
      {historial.map((h, i) => (
        <div className="historial-card-mobile" key={i}>
          <div className="historial-card-mobile-info">
            <div>
              <b>Residente:</b> {h.nombre_residente}
            </div>
            <div>
              <b>Unidad Residencial:</b> {h.unidad_residencial}
            </div>
            <div>
              <b>Visitante:</b> {h.nombre_visitante}
            </div>
            <div>
              <b>Motivo:</b> {h.motivo_visita}
            </div>
            <div>
              <b>Fecha Entrada:</b>{" "}
              {h.fecha_entrada
                ? new Date(h.fecha_entrada).toLocaleString()
                : "Pendiente"}
            </div>
            <div>
              <b>Fecha Salida:</b>{" "}
              {h.fecha_salida
                ? new Date(h.fecha_salida).toLocaleString()
                : "Pendiente"}
            </div>
            <div>
              <b>Estado:</b> {h.estado}
            </div>
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
      {window.innerWidth < 700 ? (
        <HistorialCardsMobile historial={historial} />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th
                onClick={() =>
                  handleOrden(
                    "nombre_residente",
                    ordenHistorial,
                    setOrdenHistorial,
                    cargarHistorial
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Residente{" "}
                {ordenHistorial.campo === "nombre_residente" &&
                  (ordenHistorial.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "unidad_residencial",
                    ordenHistorial,
                    setOrdenHistorial,
                    cargarHistorial
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Unidad{" "}
                {ordenHistorial.campo === "unidad_residencial" &&
                  (ordenHistorial.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "nombre_visitante",
                    ordenHistorial,
                    setOrdenHistorial,
                    cargarHistorial
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Visitante{" "}
                {ordenHistorial.campo === "nombre_visitante" &&
                  (ordenHistorial.asc ? "↑" : "↓")}
              </th>
              <th>Motivo</th>
              <th>Destino</th>
              <th>Placa/Chasis</th>
              <th
                onClick={() =>
                  handleOrden(
                    "fecha_entrada",
                    ordenHistorial,
                    setOrdenHistorial,
                    cargarHistorial
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Entrada{" "}
                {ordenHistorial.campo === "fecha_entrada" &&
                  (ordenHistorial.asc ? "↑" : "↓")}
              </th>
              <th>Salida</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((h, i) => (
              <tr key={i}>
                <td>{h.nombre_residente}</td>
                <td>{h.unidad_residencial}</td>
                <td>{h.nombre_visitante}</td>
                <td>{h.motivo_visita}</td>
                <td>{h.destino_visita || "-"}</td>
                <td>{h.placa_chasis || h.placa_vehiculo || "-"}</td>
                <td>
                  {h.fecha_entrada
                    ? new Date(h.fecha_entrada).toLocaleString()
                    : "Pendiente"}
                </td>
                <td>
                  {h.fecha_salida
                    ? new Date(h.fecha_salida).toLocaleString()
                    : "-"}
                </td>
                <td>{h.estado}</td>
                <td>
                  <span
                    onClick={() => eliminarVisitaAdmin(h.id || h.visita_id)}
                    title="Eliminar del historial"
                    style={{ cursor: "pointer", color: "#e53935" }}
                  >
                    <DeleteIcon />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PaginationControls
        currentPage={pageHistorial}
        totalPages={totalPagesHistorial}
        onPageChange={setPageHistorial}
      />
    </section>
  );
}

export default HistorialVisitas;
