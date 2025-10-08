import React, { useState, useEffect } from "react";
import QrScannerGuardia from "./QrScannerGuardia";
import axios from "axios";
import { API_URL } from "./api";
import "./css/GuardiaDashboard.css";
import UserMenu from "./components/UI/UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import { useOfflineOperations } from "./hooks/offline/useOfflineOperations";
import OfflineMessage from "./components/Offline/OfflineMessage";
import DataStatusIndicator from "./components/Offline/DataStatusIndicator";

function BtnRegresar({ onClick }) {
  return (
    <button className="btn-regresar" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
      </svg>
      Regresar al Menú
    </button>
  );
}

// Menú principal para guardia (diseño versión 1)
function MainMenuGuardia({ nombre, rol, onLogout, onSelectVista }) {
  const menuItems = [
    { id: "entrada", title: "Registrar Entrada", icon: "🚪", description: "Escanear QR para registrar entrada de visitantes" },
    { id: "salida", title: "Registrar Salida", icon: "🚗", description: "Escanear QR para registrar salida de visitantes" },
    { id: "escaneos", title: "Mis Escaneos del Día", icon: "🕒", description: "Ver historial de escaneos realizados hoy" }
  ];

  // No agregar opciones adicionales - el guardia solo ve sus propios escaneos

  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <div>
          <span className="main-menu-user">{nombre}</span>
          <span className="main-menu-role">{rol}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>
      <h1 className="main-menu-title">Panel de Guardia</h1>
      <div className="main-menu-cards">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="main-menu-card"
            onClick={() => onSelectVista(item.id)}
          >
            <div className="menu-card-icon">{item.icon}</div>
            <h3 className="menu-card-title">{item.title}</h3>
            <p className="menu-card-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tabla de escaneos del guardia (estilo versión 1)
function TablaEscaneosGuardia({ escaneos }) {
  return (
    <div className="admin-section">
      <h3>Escaneos del día</h3>
      {escaneos.length === 0 ? (
        <p>No hay escaneos registrados hoy.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Visitante</th>
                <th>Vehículo</th>
                <th>Creado por</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {escaneos.map(e => (
                <tr key={e.id_escaneo}>
                  <td style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {new Date(e.fecha_escaneo).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '14px' }}>
                    <span className={`tipo-badge tipo-${e.tipo_escaneo}`}>
                      {e.tipo_escaneo}
                    </span>
                    {e.entrada_anticipada && e.tipo_escaneo === 'entrada' && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#f57c00',
                        fontWeight: 'bold',
                        marginTop: '2px'
                      }}>
                        ⚠️ Anticipada
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '14px' }}>{e.nombre_visitante}</td>
                  <td style={{ fontSize: '14px' }}>{e.tipo_vehiculo} - {e.placa_vehiculo}</td>
                  <td style={{ fontSize: '14px' }}>
                    {e.nombre_residente}
                    {e.tipo_creador && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: e.tipo_creador === 'admin' ? '#1976d2' : '#4caf50',
                        marginLeft: '5px',
                        fontWeight: 'bold'
                      }}>
                        ({e.tipo_creador === 'admin' ? 'Admin' : 'Residente'})
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '14px' }}>{e.unidad_residencial}</td>
                  <td style={{ fontSize: '14px' }}>
                    <span className={`estado-badge estado-${e.estado_visita}`}>
                      {e.estado_visita}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{e.dispositivo}</td>
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
    <div className="admin-dashboard">
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
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Registrar Entrada</h3>
            <button className="btn-primary" onClick={() => { setModoScanner("entrada"); setMostrarScanner(true); }}>
              Activar Cámara para Escanear QR
            </button>
            {mostrarScanner && modoScanner === "entrada" && (
              <QrScannerGuardia modo="entrada" token={token} onClose={() => { setMostrarScanner(false); setModoScanner(null); }} />
            )}
          </section>
        )}
        {vista === 'salida' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Registrar Salida</h3>
            <button className="btn-primary" onClick={() => { setModoScanner("salida"); setMostrarScanner(true); }}>
              Activar Cámara para Escanear QR
            </button>
            {mostrarScanner && modoScanner === "salida" && (
              <QrScannerGuardia modo="salida" token={token} onClose={() => { setMostrarScanner(false); setModoScanner(null); }} />
            )}
          </section>
        )}
        {vista === 'escaneos' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Mis Escaneos del Día</h3>
            {!isOnline && <OfflineMessage rol="guardia" />}
            <DataStatusIndicator source={dataSource} isOnline={isOnline} />
            {cargando && <p>Cargando escaneos...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!cargando && <TablaEscaneosGuardia escaneos={escaneos} />}
          </section>
        )}

      </div>
    </div>
  );
}

export default GuardiaDashboard;