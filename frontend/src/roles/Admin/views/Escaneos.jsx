import React, { useState, useEffect } from "react";
import api from "../../../api";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";

// Subcomponente: Tabla de escaneos
function TablaEscaneos({ escaneos, titulo }) {
  if (!escaneos || escaneos.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888" }}>
        No hay escaneos registrados.
      </p>
    );
  }
  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: "#1976d2" }}>{titulo}</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Visitante</th>
              <th>Vehículo</th>
              <th>Residente</th>
              <th>Unidad</th>
              <th>Estado</th>
              <th>Dispositivo</th>
              <th>Guardia</th>
            </tr>
          </thead>
          <tbody>
            {escaneos.map((e) => (
              <tr key={e.id_escaneo}>
                <td>{new Date(e.fecha_escaneo).toLocaleString()}</td>
                <td>{e.tipo_escaneo}</td>
                <td>{e.nombre_visitante}</td>
                <td>
                  {e.tipo_vehiculo} - {e.placa_vehiculo}
                </td>
                <td>{e.nombre_residente}</td>
                <td>{e.unidad_residencial}</td>
                <td>{e.estado_visita}</td>
                <td>{e.dispositivo}</td>
                <td>{e.nombre_guardia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Subcomponente: Cards móviles para escaneos
function EscaneosCardsMobile({ escaneos }) {
  return (
    <div className="escaneos-cards-mobile">
      {escaneos.map((e) => (
        <div className="escaneo-card-mobile" key={e.id_escaneo}>
          <div className="escaneo-card-mobile-info">
            <div>
              <b>Fecha:</b> {new Date(e.fecha_escaneo).toLocaleString()}
            </div>
            <div>
              <b>Tipo:</b> {e.tipo_escaneo}
            </div>
            <div>
              <b>Visitante:</b> {e.nombre_visitante}
            </div>
            <div>
              <b>Vehículo:</b> {e.tipo_vehiculo} - {e.placa_vehiculo}
            </div>
            <div>
              <b>Residente:</b> {e.nombre_residente}
            </div>
            <div>
              <b>Unidad:</b> {e.unidad_residencial}
            </div>
            <div>
              <b>Estado:</b> {e.estado_visita}
            </div>
            <div>
              <b>Dispositivo:</b> {e.dispositivo}
            </div>
            <div>
              <b>Guardia:</b> {e.nombre_guardia}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Escaneos({ token, onCancel, onNotification }) {
  const [escaneosDia, setEscaneosDia] = useState(null);
  const [escaneosTotales, setEscaneosTotales] = useState(null);
  const [filtroEscGuardia, setFiltroEscGuardia] = useState("");
  const [filtroEscTipo, setFiltroEscTipo] = useState("");
  const [filtroEscEstado, setFiltroEscEstado] = useState("");
  const [ordenEscaneos, setOrdenEscaneos] = useState({
    campo: "fecha_escaneo",
    asc: false,
  });
  const [vistaEscaneos, setVistaEscaneos] = useState("diario");
  const [pageEscaneos, setPageEscaneos] = useState(1);
  const [totalPagesEscaneos, setTotalPagesEscaneos] = useState(1);
  const limitEscaneos = 15;

  // Cargar escaneos del día con filtros y orden
  const cargarEscaneosDia = async () => {
    try {
      const params = {};
      if (filtroEscGuardia) params.nombre_guardia = filtroEscGuardia;
      if (filtroEscTipo) params.estado_escaneo = filtroEscTipo;
      params.page = pageEscaneos;
      params.limit = limitEscaneos;

      const res = await api.get(`/visitas/admin/escaneos-dia`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.escaneos) {
        setEscaneosDia(res.data);
        setTotalPagesEscaneos(res.data.total_pages);
      } else {
        setEscaneosDia(res.data);
      }
    } catch (e) {
      console.error(e);
      onNotification({
        message: "Error al cargar escaneos del día",
        type: "error",
      });
    }
  };

  const cargarEscaneosTotales = async () => {
    try {
      const params = {};
      if (filtroEscGuardia) params.nombre_guardia = filtroEscGuardia;
      if (filtroEscTipo) params.tipo_escaneo = filtroEscTipo;
      if (filtroEscEstado) params.estado_visita = filtroEscEstado;
      params.orden = ordenEscaneos.campo;
      params.asc = ordenEscaneos.asc;
      params.page = pageEscaneos;
      params.limit = limitEscaneos;

      const res = await api.get(`/visitas/admin/escaneos-totales`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (res.data.escaneos) {
        setEscaneosTotales(res.data);
        setTotalPagesEscaneos(res.data.total_pages);
      } else {
        setEscaneosTotales(res.data);
      }
    } catch {
      onNotification({
        message: "Error al cargar todos los escaneos ",
        type: "error",
      });
    }
  };

  // Effects to reset pagination when filters change
  useEffect(() => {
    setPageEscaneos(1);
  }, [filtroEscGuardia, filtroEscTipo, filtroEscEstado, vistaEscaneos]);

  // Effects to fetch data based on current tab
  useEffect(() => {
    if (vistaEscaneos === "diario") {
      cargarEscaneosDia();
    } else {
      cargarEscaneosTotales();
    }
    // eslint-disable-next-line
  }, [
    filtroEscGuardia,
    filtroEscTipo,
    ordenEscaneos,
    vistaEscaneos,
    pageEscaneos,
    filtroEscEstado,
  ]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button
          className={`main-menu-card${
            vistaEscaneos === "diario" ? " selected" : ""
          }`}
          style={{ padding: "10px 18px", fontSize: "1em" }}
          onClick={() => setVistaEscaneos("diario")}
        >
          Escaneos Diario
        </button>
        <button
          className={`main-menu-card${
            vistaEscaneos === "historicos" ? " selected" : ""
          }`}
          style={{ padding: "10px 18px", fontSize: "1em" }}
          onClick={() => setVistaEscaneos("historicos")}
        >
          Escaneos Históricos
        </button>
      </div>
      {window.innerWidth < 700 ? (
        <EscaneosCardsMobile
          escaneos={
            vistaEscaneos === "diario"
              ? escaneosDia?.escaneos || []
              : escaneosTotales?.escaneos || []
          }
        />
      ) : (
        <TablaEscaneos
          escaneos={
            vistaEscaneos === "diario"
              ? escaneosDia?.escaneos || []
              : escaneosTotales?.escaneos || []
          }
          titulo={
            vistaEscaneos === "diario"
              ? "Escaneos Diarios"
              : "Escaneos Históricos"
          }
        />
      )}
      <PaginationControls
        currentPage={pageEscaneos}
        totalPages={totalPagesEscaneos}
        onPageChange={setPageEscaneos}
      />
    </section>
  );
}

export default Escaneos;
