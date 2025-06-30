import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import "./GuardiaDashboard.css";
import './App.css';
import './ResidenteDashboard.css'; // Agrega este import para los nuevos estilos
import SocialDashboard from "./SocialDashboard";
import UserMenu from "./UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";

// Tarjeta de notificación reutilizable
function Notification({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

// Menú principal para residente
function MainMenuResidente({ nombre, rol, onLogout, onSelectVista }) {
  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <div>
          <span className="main-menu-user">👤 {nombre}</span>
          <span className="main-menu-role">{rol && `(${rol})`}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
      <h1 className="main-menu-title">Panel Residente</h1>
      <div className="main-menu-cards">
        <button className="main-menu-card" onClick={() => onSelectVista("visitas")}>
          <span>📋</span>
          <div>Mis Visitas</div>
        </button>
        <button className="main-menu-card" onClick={() => onSelectVista("crear")}>
          <span>➕</span>
          <div>Crear Visita</div>
        </button>
        <button className="main-menu-card" onClick={() => onSelectVista("notificaciones")}>
          <span>🔔</span>
          <div>Notificaciones</div>
        </button>
        <button className="main-menu-card" onClick={() => onSelectVista("social")}>
          <span>💬</span>
          <div>Social</div>
        </button>
      </div>
    </div>
  );
}

// Botón de regresar
function BtnRegresar({ onClick }) {
  return (
    <button className="btn-regresar" onClick={onClick}>
      ← Regresar
    </button>
  );
}

// Tabla de visitas (responsive)
function TablaVisitasResidente({ visitas }) {
  return (
    <div className="tabla-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Visitante</th>
            <th>Teléfono</th>
            <th>Vehículo</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Fecha Entrada</th>
          </tr>
        </thead>
        <tbody>
          {visitas.map((v, i) => (
            <tr key={i}>
              <td>{v.nombre_conductor}</td>
              <td>{v.telefono}</td>
              <td>{v.tipo_vehiculo}</td>
              <td>{v.motivo_visita}</td>
              <td>{v.estado}</td>
              <td>{v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormCrearVisita({ token, onSuccess, onCancel }) {
  const [nombre_conductor, setNombreConductor] = useState("");
  const [dni_conductor, setDNIConductor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [marca_vehiculo, setMarcaVehiculo] = useState("");
  const [placa_vehiculo, setPlacaVehiculo] = useState("");
  const [tipo_vehiculo, setTipoVehiculo] = useState("");
  const [color_vehiculo, setColorVehiculo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fecha_entrada, setFechaEntrada] = useState("");
  const [cantidadAcompanantes, setCantidadAcompanantes] = useState(0);
  const [acompanantes, setAcompanantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const tiposVehiculo = ["Moto", "Bicicleta", "Camioneta", "Turismo", "Otro"];
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];

  useEffect(() => {
    setAcompanantes((prev) => {
      const nuevaCantidad = parseInt(cantidadAcompanantes) || 0;
      if (nuevaCantidad <= 0) return [];
      if (prev.length > nuevaCantidad) return prev.slice(0, nuevaCantidad);
      return [...prev, ...Array(nuevaCantidad - prev.length).fill("")];
    });
  }, [cantidadAcompanantes]);

  const handleAcompananteChange = (idx, value) => {
    setAcompanantes((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const data = {
        visitantes: [{
          nombre_conductor,
          dni_conductor,
          telefono: "+504" + telefono,
          tipo_vehiculo,
          marca_vehiculo,
          color_vehiculo,
          placa_vehiculo,
          motivo_visita: motivo,
        }],
        motivo,
        fecha_entrada: fecha_entrada ? new Date(fecha_entrada).toISOString() : null,
        acompanantes: acompanantes.filter(a => a && a.trim().length > 0)
      };
      await axios.post(`${API_URL}/visitas/residente/crear_visita`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al crear la visita. Verifica los datos."
      );
    }
    setCargando(false);
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(value);
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombre_conductor} onChange={e => setNombreConductor(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>DNI del visitante:</label>
        <input type="text" value={dni_conductor} onChange={e => setDNIConductor(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <span className="input-prefix">+504</span>
        <input placeholder="XXXXXXXX" value={telefono} onChange={handleTelefonoChange} required maxLength={8} />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipo_vehiculo} onChange={e => setTipoVehiculo(e.target.value)} required>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={color_vehiculo} onChange={e => setColorVehiculo(e.target.value)} required>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <input type="text" value={marca_vehiculo} onChange={e => setMarcaVehiculo(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Placa del vehículo:</label>
        <input type="text" value={placa_vehiculo} onChange={e => setPlacaVehiculo(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fecha_entrada} onChange={e => setFechaEntrada(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Cantidad de acompañantes:</label>
        <input type="number" min="0" max="10" value={cantidadAcompanantes} onChange={e => setCantidadAcompanantes(e.target.value)} />
      </div>
      {acompanantes.map((a, idx) => (
        <div className="form-row" key={idx}>
          <label>Nombre del acompañante #{idx + 1}:</label>
          <input type="text" value={a} onChange={e => handleAcompananteChange(idx, e.target.value)} required />
        </div>
      ))}
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando}>
          {cargando ? "Creando..." : "Crear Visita"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ResidenteDashboard({ token, nombre, onLogout }) {
  const [vista, setVista] = useState("menu");
  const [visitas, setVisitas] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [notificaciones, setNotificaciones] = useState([]);

  // Obtener datos completos del usuario autenticado
  useEffect(() => {
    axios.get(`${API_URL}/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  // Cargar visitas del residente
  const cargarVisitas = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/visitas/residente/mis_visitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Solo los campos requeridos
      const visitasFiltradas = (res.data || []).map(v => ({
        nombre_conductor: v.visitante?.nombre_conductor || "-",
        dni_conductor: v.visitante?.dni_conductor || "-",
        telefono: v.visitante?.telefono || "-",
        tipo_vehiculo: v.visitante?.tipo_vehiculo || "-",
        motivo_visita: v.visitante?.motivo_visita || "-",
        estado: v.estado,
        fecha_entrada: v.fecha_entrada,
      }));
      setVisitas(visitasFiltradas);
    } catch (err) {
      setNotification({ message: "Error al cargar las visitas", type: "error" });
    }
    setCargando(false);
  };

  // Cargar notificaciones del residente
  const cargarNotificaciones = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/notificaciones/residente/ver_notificaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificaciones(res.data || []);
    } catch (err) {
      setNotification({ message: "Error al cargar las notificaciones", type: "error" });
    }
    setCargando(false);
  };

  useEffect(() => {
    if (vista === "visitas") cargarVisitas();
    if (vista === "notificaciones") cargarNotificaciones();
  }, [vista]);

  // Volver al menú principal
  const handleVolver = () => {
    setVista("menu");
    setError("");
  };

  return (
    <div className="admin-dashboard">
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      <UserMenu
        usuario={usuario || { nombre, rol: "residente" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={setVista}
        selected={vista}
      />
      <div style={{ marginTop: 60 }}>
        {vista === 'perfil' && <PerfilUsuario usuario={usuario} onRegresar={() => setVista('menu')} />}
        {vista === 'config' && <ConfiguracionUsuario onRegresar={() => setVista('menu')} />}
        {vista === 'menu' && (
          <MainMenuResidente nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={setVista} />
        )}
        {vista === 'visitas' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Mis Visitas</h3>
            {cargando && <div>Cargando...</div>}
            {error && <div className="qr-error">{error}</div>}
            {!cargando && visitas.length === 0 && <div>No tienes visitas registradas.</div>}
            {!cargando && visitas.length > 0 && (
              <TablaVisitasResidente visitas={visitas} />
            )}
          </section>
        )}
        {vista === 'crear' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Crear Nueva Visita</h3>
            <FormCrearVisita
              token={token}
              onSuccess={() => {
                setNotification({ message: "Visita creada correctamente", type: "success" });
                setVista("visitas");
              }}
              onCancel={handleVolver}
            />
          </section>
        )}
        {vista === 'notificaciones' && (
          <section className="admin-section notificaciones-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Notificaciones</h3>
            {cargando && <div>Cargando...</div>}
            {error && <div className="qr-error">{error}</div>}
            {!cargando && notificaciones.length === 0 && <div className="notificacion-vacia">No tienes notificaciones.</div>}
            {!cargando && notificaciones.length > 0 && (
              <ul className="notificaciones-lista">
                {notificaciones.map((n, idx) => (
                  <li key={idx} className="notificacion-card">
                    <div className="notificacion-titulo">{n.titulo || "Notificación"}</div>
                    <div className="notificacion-mensaje">{n.mensaje}</div>
                    <div className="notificacion-fecha">
                      {n.fecha_envio ? new Date(n.fecha_envio).toLocaleString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {vista === 'social' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <SocialDashboard token={token} rol={usuario?.rol || "residente"} />
          </section>
        )}
      </div>
    </div>
  );
}

export default ResidenteDashboard;