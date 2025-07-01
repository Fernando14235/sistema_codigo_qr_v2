import React, { useState, useEffect } from "react";
import QrScannerGuardia from "./QrScannerGuardia";
import axios from "axios";
import { API_URL } from "./api";
import "./GuardiaDashboard.css";
import UserMenu from "./UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import { useOfflineOperations } from "./hooks/useOfflineOperations";
import OfflineMessage from "./components/OfflineMessage";
import DataStatusIndicator from "./components/DataStatusIndicator";

function BtnRegresar({ onClick }) {
  return (
    <button className="btn-regresar" onClick={onClick}>
      ← Regresar
    </button>
  );
}

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
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("entrada")}>🚪<div>Registrar Entrada</div></button>
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("salida")}>🚗<div>Registrar Salida</div></button>
        <button className="guardia-main-menu-card" onClick={() => onSelectVista("escaneos")}>🕒<div>Mis Escaneos del Día</div></button>
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
  const [vista, setVista] = useState("menu");
  const [escaneos, setEscaneos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [modoScanner, setModoScanner] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  
  // Hook para operaciones offline
  const { isOnline, registerEntry, registerExit, loadEscaneosGuardia } = useOfflineOperations(token, 'guardia');

  useEffect(() => {
    axios.get(`${API_URL}/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  const cargarEscaneos = async () => {
    setCargando(true);
    setError("");
    try {
      const result = await loadEscaneosGuardia();
      setEscaneos(result.data.escaneos || []);
      setDataSource(result.source);
    } catch (err) {
      setError("No se pudieron cargar los escaneos del día.");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (vista === "escaneos") {
      cargarEscaneos();
    }
  }, [vista]);

  const handleVolver = () => setVista("menu");

  // Renderizado de vistas
  return (
    <div className="guardia-dashboard">
      <UserMenu
        usuario={usuario || { nombre, rol: "guardia" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={setVista}
        selected={vista}
      />
      <div style={{ marginTop: 60 }}>
        {vista === 'perfil' && <PerfilUsuario usuario={usuario} onRegresar={() => setVista('menu')} />}
        {vista === 'config' && <ConfiguracionUsuario onRegresar={() => setVista('menu')} usuario={{ id: 2, rol: 'guardia' }} />}
        {vista === 'menu' && (
          <MainMenuGuardia nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={setVista} />
        )}
        {vista === 'entrada' && (
          <div className="guardia-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Registrar Entrada</h3>
            <button className="btn-primary" onClick={() => { setModoScanner("entrada"); setMostrarScanner(true); }}>
              Activar Cámara para Escanear QR
            </button>
            {mostrarScanner && modoScanner === "entrada" && (
              <QrScannerGuardia modo="entrada" token={token} onClose={() => { setMostrarScanner(false); setModoScanner(null); }} />
            )}
          </div>
        )}
        {vista === 'salida' && (
          <div className="guardia-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Registrar Salida</h3>
            <button className="btn-primary" onClick={() => { setModoScanner("salida"); setMostrarScanner(true); }}>
              Activar Cámara para Escanear QR
            </button>
            {mostrarScanner && modoScanner === "salida" && (
              <QrScannerGuardia modo="salida" token={token} onClose={() => { setMostrarScanner(false); setModoScanner(null); }} />
            )}
          </div>
        )}
        {vista === 'escaneos' && (
          <div className="guardia-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Mis Escaneos del Día</h3>
            {!isOnline && <OfflineMessage rol="guardia" />}
            <DataStatusIndicator source={dataSource} isOnline={isOnline} />
            {cargando && <p>Cargando escaneos...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!cargando && <TablaEscaneosGuardia escaneos={escaneos} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default GuardiaDashboard;