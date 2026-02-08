import React, { useState, useEffect } from "react";
import api from "../../../api";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import cardStyles from "../../../css/Cards.module.css";

// Listado de escaneos (Diseño Moderno de Tarjetas)
function EscaneosList({ escaneos }) {
  if (!escaneos || escaneos.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: "40px" }}>
        No hay escaneos registrados.
      </p>
    );
  }

  return (
    <div className={cardStyles["cards-container"]}>
      {escaneos.map((e) => (
        <div className={cardStyles["horizontal-card"]} key={e.id_escaneo}>
          <div className={`${cardStyles["status-stripe"]} ${cardStyles["info"]}`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Fecha / Tipo</span>
              <span className={cardStyles["section-value"]}>{new Date(e.fecha_escaneo).toLocaleDateString()}</span>
              <span style={{ fontSize: '0.85rem', color: '#1a237e', fontWeight: 'bold' }}>
                {new Date(e.fecha_escaneo).toLocaleTimeString()} - {e.tipo_escaneo}
              </span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Visitante / Vehículo</span>
              <span className={cardStyles["section-value"]}>{e.nombre_visitante}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🆔 DNI: {e.dni_visitante || '-'}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>🚗 {e.tipo_vehiculo} - {e.placa_vehiculo}</span>
                {e.placa_chasis && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⚙️ Chasis: {e.placa_chasis}</span>
                )}
              </div>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Miembro / Unidad</span>
              <span className={cardStyles["section-value"]}>{e.nombre_residente}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>🏢 {e.unidad_residencial}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado / Guardia</span>
              <span className={`${cardStyles["badge"]} ${cardStyles["badge-" + (e.estado_visita === 'completada' ? 'resuelto' : 'pendiente')]}`}>
                {e.estado_visita}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>🛡️ {e.nombre_guardia}</span>
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
      <EscaneosList
        escaneos={
          vistaEscaneos === "diario"
            ? escaneosDia?.escaneos || []
            : escaneosTotales?.escaneos || []
        }
      />
      <PaginationControls
        currentPage={pageEscaneos}
        totalPages={totalPagesEscaneos}
        onPageChange={setPageEscaneos}
      />
    </section>
  );
}

export default Escaneos;
