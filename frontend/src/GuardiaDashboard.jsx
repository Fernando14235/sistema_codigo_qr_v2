import React, { useState, useEffect } from "react";
import QrScannerGuardia from "./QrScannerGuardia";
import axios from "axios";
import { API_URL } from "./api";
import "./GuardiaDashboard.css";

// Menú principal para guardia
function MainMenuGuardia({ nombre, rol, onLogout, onSelectVista }) {
  return (
    <div className="guardia-main-menu">
      <div className="guardia-main-menu-header">
        <div>
          <span className="guardia-main-menu-user">👮 {nombre}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
      <h1 className="guardia-main-menu-title">Panel Guardia</h1>
      <div className="guardia-main-menu-cards">
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("entrada")}>
          <span>🚪</span>
          <div>Registrar Entrada</div>
        </button>
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("salida")}>
          <span>🚗</span>
          <div>Registrar Salida</div>
        </button>
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("escaneos")}>
          <span>🕒</span>
          <div>Mis Escaneos del Día</div>
        </button>
      </div>
    </div>
  );
}

// Tabla de escaneos del guardia
function TablaEscaneosGuardia({ escaneos }) {
  return (
    <div className="guardia-section">
      <h3>Escaneos del día</h3>
      {escaneos.length === 0 ? (
        <p>No hay escaneos registrados hoy.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="guardia-table">
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
              </tr>
            </thead>
            <tbody>
              {escaneos.map(e => (
                <tr key={e.id_escaneo}>
                  <td>{new Date(e.fecha_escaneo).toLocaleString()}</td>
                  <td>{e.tipo_escaneo}</td>
                  <td>{e.nombre_visitante}</td>
                  <td>{e.tipo_vehiculo} - {e.placa_vehiculo}</td>
                  <td>{e.nombre_residente}</td>
                  <td>{e.unidad_residencial}</td>
                  <td>{e.estado_visita}</td>
                  <td>{e.dispositivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GuardiaDashboard({ nombre, token, onLogout }) {
  const [vista, setVista] = useState("menu"); // menu | entrada | salida | escaneos
  const [escaneos, setEscaneos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [ResInfo, setResInfo] = useState(null);
  const [error, setError] = useState("");
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [modoScanner, setModoScanner] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/auth/guardia`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setResInfo(res.data)).catch(() => {});
    // eslint-disable-next-line
  }, []);

  // Cargar escaneos del día
  const cargarEscaneos = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/visitas/guardia/escaneos-dia`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEscaneos(res.data.escaneos || []);
    } catch (err) {
      setError("No se pudieron cargar los escaneos del día.");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (vista === "escaneos") {
      cargarEscaneos();
    }
    // eslint-disable-next-line
  }, [vista]);

  // Función para abrir el scanner
  const handleAbrirScanner = (modo) => {
    setModoScanner(modo);
    setMostrarScanner(true);
  };

  // Función para cerrar el scanner y recargar escaneos si es necesario
  const handleCerrarScanner = () => {
    setMostrarScanner(false);
    setModoScanner(null);
    if (vista === "escaneos") cargarEscaneos();
  };

  // Renderizado de vistas
  return (
    <div className="guardia-dashboard">
      {vista === "menu" && (
        <MainMenuGuardia nombre={nombre} onLogout={onLogout} onSelectVista={setVista} />
      )}
      {vista === "entrada" && (
        <div className="guardia-section">
          <button className="btn-regresar" onClick={() => setVista("menu")}>← Regresar</button>
          <h3>Registrar Entrada</h3>
          <button className="btn-primary" onClick={() => handleAbrirScanner("entrada")}>
            Activar Cámara para Escanear QR
          </button>
          {mostrarScanner && modoScanner === "entrada" && (
            <QrScannerGuardia modo="entrada" token={token} onClose={handleCerrarScanner} />
          )}
        </div>
      )}
      {vista === "salida" && (
        <div className="guardia-section">
          <button className="btn-regresar" onClick={() => setVista("menu")}>← Regresar</button>
          <h3>Registrar Salida</h3>
          <button className="btn-primary" onClick={() => handleAbrirScanner("salida")}>
            Activar Cámara para Escanear QR
          </button>
          {mostrarScanner && modoScanner === "salida" && (
            <QrScannerGuardia modo="salida" token={token} onClose={handleCerrarScanner} />
          )}
        </div>
      )}
      {vista === "escaneos" && (
        <div className="guardia-section">
          <button className="btn-regresar" onClick={() => setVista("menu")}>← Regresar</button>
          <h3>Mis Escaneos del Día</h3>
          {cargando && <p>Cargando escaneos...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!cargando && <TablaEscaneosGuardia escaneos={escaneos} />}
        </div>
      )}
    </div>
  );
}

export default GuardiaDashboard;