import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import SocialDashboard from "./SocialDashboard";
import UserMenu from "./components/UI/UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import ResidenteDashboard from "./ResidenteDashboard";
import pushNotificationService from './services/pwa/pushNotifications';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Iconos
const DeleteIcon = () => (
  <span title="Eliminar" style={{ color: "#e53935", cursor: "pointer", marginRight: 8 }}>
    🗑️
  </span>
);
const EditIcon = () => (
  <span title="Editar" style={{ color: "#1976d2", cursor: "pointer" }}>
    ✏️
  </span>
);

// Notificación tipo tarjeta
function Notification({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

function MainMenu({ nombre, rol, onLogout, onSelectVista }) {
  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <div>
          <span className="main-menu-user">👤 {nombre}</span>
          <span className="main-menu-role">{rol && `(${rol})`}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
      <h1 className="main-menu-title">Panel Principal</h1>
      <div className="main-menu-cards">
        <button className="main-menu-card" onClick={() => onSelectVista("usuarios")}>👥<div>Gestión de Usuarios</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("crear")}>➕<div>Crear Usuario</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("historial")}>📋<div>Historial de Visitas</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("crear_visita")}>➕<div>Crear Visita</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("mis_visitas")}>📋<div>Mis Visitas</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("escaneos")}>🕒<div>Escaneos</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("social")}>💬<div>Social</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("tickets")}>🎫<div>Tickets</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("solicitudes")}>📝<div>Solicitudes Pendientes</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("estadisticas")}>📊<div>Estadísticas</div></button>
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

function CrearUsuario({ token, onUsuarioCreado, usuarioEditar, setUsuarioEditar }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("residente");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [unidadResidencial, setUnidadResidencial] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (usuarioEditar) {
      setNombre(usuarioEditar.nombre || "");
      setEmail(usuarioEditar.email || "");
      setRol(usuarioEditar.rol || "residente");
      setTelefono(usuarioEditar.telefono ? usuarioEditar.telefono.replace("+504", "") : "");
      setUnidadResidencial(usuarioEditar.unidad_residencial || "");
      setPassword("");
      setMensaje("Editando usuario");
    } else {
      setNombre(""); setEmail(""); setRol("residente"); setPassword(""); setTelefono(""); setUnidadResidencial(""); setMensaje("");
    }
  }, [usuarioEditar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (telefono.length !== 8) {
      setMensaje("El número de teléfono debe tener exactamente 8 dígitos.");
      return;
    }
    setMensaje(usuarioEditar ? "Actualizando usuario..." : "Creando usuario...");
    setBloqueado(true);
    try {
      const payload = {
        nombre,
        email,
        rol,
        password,
        telefono: "+504" + telefono,
      };
      if (rol === "residente") {
        payload.unidad_residencial = unidadResidencial;
      }
      if (usuarioEditar) {
        await axios.put(`${API_URL}/update_usuarios/admin/${usuarioEditar.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensaje("Usuario actualizado correctamente");
        setUsuarioEditar(null);
        if (typeof setVista === 'function') setVista('usuarios');
      } else {
        await axios.post(`${API_URL}/create_usuarios/admin`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensaje("Usuario creado correctamente");
      setNombre(""); setEmail(""); setRol("residente"); setPassword(""); setTelefono(""); setUnidadResidencial("");
      if (onUsuarioCreado) onUsuarioCreado();
        if (typeof setVista === 'function') setVista('usuarios');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setMensaje("Error: " + err.response.data.detail);
      } else {
        setMensaje("Error al crear/actualizar usuario");
      }
    }
    setBloqueado(false);
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(value);
  };

  return (
    <form onSubmit={handleCrear} className="crear-usuario-form crear-usuario-form-responsive">
      <h3 style={{ color: "#1976d2", marginBottom: 10 }}>
        {usuarioEditar ? "Editar Usuario" : "Crear Usuario"}
      </h3>
      <div className="form-row">
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={bloqueado} />
        <input placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required type="email" disabled={bloqueado} />
      </div>
      <div className="form-row">
        <select value={rol} onChange={e => setRol(e.target.value)} disabled={bloqueado}>
          <option value="residente">Residente</option>
          <option value="guardia">Guardia</option>
          <option value="admin">Admin</option>
        </select>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: 4, fontWeight: "bold" }}>+504</span>
          <input placeholder="XXXXXXXX" value={telefono} onChange={handleTelefonoChange} required maxLength={8} style={{ width: "120px" }} disabled={bloqueado} />
        </div>
        {rol === "residente" && (
          <input
            placeholder="Unidad Residencial"
            value={unidadResidencial}
            onChange={e => setUnidadResidencial(e.target.value)}
            required
            disabled={bloqueado}
          />
        )}
      </div>
      <div className="form-row">
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            placeholder={usuarioEditar ? "Nueva Contraseña" : "Contraseña"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            type={showPassword ? "text" : "password"}
            disabled={bloqueado}
            style={{ width: '100%', paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#1976d2',
              padding: 0
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L23 23" stroke="#1976d2" strokeWidth="2"/>
                <path d="M12 5C7 5 2.73 8.11 1 12C1.73 13.66 2.91 15.09 4.41 16.17M9.9 9.9C10.27 9.63 10.73 9.5 11.2 9.5C12.49 9.5 13.5 10.51 13.5 11.8C13.5 12.27 13.37 12.73 13.1 13.1M7.11 7.11C8.39 6.4 10.13 6 12 6C17 6 21.27 9.11 23 13C22.27 14.66 21.09 16.09 19.59 17.17" stroke="#1976d2" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="12" rx="10" ry="6" stroke="#1976d2" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2.5" fill="#1976d2"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <button type="submit" className="btn-primary" disabled={bloqueado}>
          {usuarioEditar ? "Actualizar" : "Crear"}
        </button>
        {usuarioEditar && (
          <button type="button" className="btn-secondary" style={{ marginLeft: 10 }} onClick={() => setUsuarioEditar(null)} disabled={bloqueado}>
            Cancelar
          </button>
        )}
        <span style={{ marginLeft: 16, color: mensaje.includes("Error") ? "red" : "#1976d2" }}>{mensaje}</span>
      </div>
    </form>
  );
}

// Tabla de escaneos con el mismo diseño que las otras tablas
function TablaEscaneos({ escaneos, titulo }) {
  if (!escaneos || escaneos.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888' }}>No hay escaneos registrados.</p>;
  }
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>{titulo}</h3>
      <div style={{ overflowX: 'auto' }}>
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
                <td>{e.nombre_guardia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Formulario para crear visita (igual que en el panel de residente, pero para admin)
function FormCrearVisitaAdmin({ token, onSuccess, onCancel, setVista, usuario }) {
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
  const [bloqueado, setBloqueado] = useState(false);

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
    setBloqueado(true);
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
        fecha_entrada: fecha_entrada || null,
        acompanantes: acompanantes.filter(a => a && a.trim().length > 0)
      };
      await axios.post(`${API_URL}/visitas/residente/crear_visita`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Notificación visual y push solo para admin
      if (usuario && usuario.rol === 'admin') {
        if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
          pushNotificationService.showLocalNotification(
            '👥 Nueva visita creada',
            {
              body: 'Has creado una nueva visita exitosamente.',
              icon: '/resi192.png'
            }
          );
        }
        if (typeof setVista === 'function') {
          setVista('mis_visitas');
        }
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al crear la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueado(false);
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(value);
  };

  return (
    <form className="form-visita form-visita-admin" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombre_conductor} onChange={e => setNombreConductor(e.target.value)} required disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>DNI del visitante:</label>
        <input type="text" value={dni_conductor} onChange={e => setDNIConductor(e.target.value)} required disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <span className="input-prefix">+504</span>
        <input placeholder="XXXXXXXX" value={telefono} onChange={handleTelefonoChange} required maxLength={8} disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipo_vehiculo} onChange={e => setTipoVehiculo(e.target.value)} required disabled={bloqueado}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={color_vehiculo} onChange={e => setColorVehiculo(e.target.value)} required disabled={bloqueado}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <input type="text" value={marca_vehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Placa del vehículo:</label>
        <input type="text" value={placa_vehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fecha_entrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={bloqueado} />
      </div>
      <div className="form-row">
        <label>Cantidad de acompañantes:</label>
        <input type="number" min="0" max="10" value={cantidadAcompanantes} onChange={e => setCantidadAcompanantes(e.target.value)} disabled={bloqueado} />
      </div>
      {acompanantes.map((a, idx) => (
        <div className="form-row" key={idx}>
          <label>Nombre del acompañante #{idx + 1}:</label>
          <input type="text" value={a} onChange={e => handleAcompananteChange(idx, e.target.value)} required disabled={bloqueado} />
        </div>
      ))}
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando || bloqueado}>
          {cargando ? "Creando..." : "Crear Visita"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={bloqueado}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function TablaVisitasAdmin({ visitas, onEditar, onEliminar }) {
  const isMobile = window.innerWidth < 800;
  if (!visitas || visitas.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888' }}>No hay visitas registradas.</p>;
  }
  if (isMobile) {
    return (
      <div className="visitas-cards-mobile">
        {visitas.map((v, i) => (
          <div className="visita-card-mobile" key={i}>
            <div className="visita-card-mobile-info">
              <div><b>Visitante:</b> {v.visitante?.nombre_conductor || '-'}</div>
              <div><b>Teléfono:</b> {v.visitante?.telefono || '-'}</div>
              <div><b>Vehículo:</b> {v.visitante?.tipo_vehiculo || '-'}</div>
              <div><b>Motivo:</b> {v.notas || '-'}</div>
              <div><b>Estado:</b> {v.estado}</div>
              <div><b>Expiración:</b> {v.expiracion == 'S' ? 'Sí' : 'No'}</div>
              <div><b>Fecha Entrada:</b> {v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleString() : '-'}</div>
            </div>
            <div className="visita-card-mobile-action">
              <span
                onClick={() => onEliminar(v.id)}
                style={{ color: '#e53935', cursor: 'pointer', fontSize: 28, marginRight: 8 }}
                title="Eliminar visita"
              >
                🗑️
              </span>
              <span
                onClick={() => (v.estado === 'pendiente' && v.expiracion === 'N') ? onEditar(v) : null}
                style={{ color: (v.estado === 'pendiente' && v.expiracion === 'N') ? '#1976d2' : '#bdbdbd', cursor: (v.estado === 'pendiente' && v.expiracion === 'N') ? 'pointer' : 'not-allowed', fontSize: 28 }}
                title={(v.estado === 'pendiente' && v.expiracion === 'N') ? 'Editar visita' : 'Solo puedes editar visitas pendientes y no expiradas'}
              >
                ✏️
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>Mis Visitas</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Visitante</th>
              <th>Teléfono</th>
              <th>Vehículo</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Expiración</th>
              <th>Fecha Entrada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map((v, i) => (
              <tr key={i}>
                <td>{v.visitante?.nombre_conductor || '-'}</td>
                <td>{v.visitante?.telefono || '-'}</td>
                <td>{v.visitante?.tipo_vehiculo || '-'}</td>
                <td>{v.notas || '-'}</td>
                <td>{v.estado}</td>
                <td>{v.expiracion === 'S' ? 'Sí' : 'No'}</td>
                <td>{v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleString() : '-'}</td>
                <td>
                  <span
                    onClick={() => onEliminar(v.id)}
                    style={{ color: '#e53935', cursor: 'pointer', fontSize: 20, marginRight: 8 }}
                    title="Eliminar visita"
                  >
                    🗑️
                  </span>
                  <span
                    onClick={() => (v.estado === 'pendiente' && v.expiracion === 'N') ? onEditar(v) : null}
                    style={{ color: (v.estado === 'pendiente' && v.expiracion === 'N') ? '#1976d2' : '#bdbdbd', cursor: (v.estado === 'pendiente' && v.expiracion === 'N') ? 'pointer' : 'not-allowed', fontSize: 20 }}
                    title={(v.estado === 'pendiente' && v.expiracion === 'N') ? 'Editar visita' : 'Solo puedes editar visitas pendientes y no expiradas'}
                  >
                    ✏️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormEditarVisitaAdmin({ token, visita, onSuccess, onCancel }) {
  const [nombre_conductor, setNombreConductor] = useState(visita.visitante?.nombre_conductor || "");
  const [dni_conductor, setDNIConductor] = useState(visita.visitante?.dni_conductor || "");
  const [telefono, setTelefono] = useState((visita.visitante?.telefono || '').replace('+504', ''));
  const [marca_vehiculo, setMarcaVehiculo] = useState(visita.visitante?.marca_vehiculo || "");
  const [placa_vehiculo, setPlacaVehiculo] = useState(visita.visitante?.placa_vehiculo || "");
  const [tipo_vehiculo, setTipoVehiculo] = useState(visita.visitante?.tipo_vehiculo || "");
  const [color_vehiculo, setColorVehiculo] = useState(visita.visitante?.color_vehiculo || "");
  const [motivo, setMotivo] = useState(visita.notas || "");
  const [fecha_entrada, setFechaEntrada] = useState(visita.fecha_entrada ? new Date(visita.fecha_entrada).toISOString().slice(0,16) : "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const tiposVehiculo = ["Moto", "Bicicleta", "Camioneta", "Turismo", "Otro"];
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];
  const [bloqueadoEditar, setBloqueadoEditar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueadoEditar(true);
    setError("");
    try {
      const data = {
        fecha_entrada: fecha_entrada || null,
        notas: motivo,
        visitante: {
          nombre_conductor,
          dni_conductor,
          telefono: "+504" + telefono,
          tipo_vehiculo,
          marca_vehiculo,
          color_vehiculo,
          placa_vehiculo,
          motivo_visita: motivo,
        }
      };
      await axios.patch(`${API_URL}/visitas/residente/editar_visita/${visita.id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
      if (typeof setVista === 'function') setVista('mis_visitas');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al editar la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueadoEditar(false);
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(value);
  };

  return (
    <form className="form-visita form-visita-admin" onSubmit={handleSubmit}>
      <h2 className="crear-visita-title">Editar Visita</h2>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombre_conductor} onChange={e => setNombreConductor(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>DNI del visitante:</label>
        <input type="text" value={dni_conductor} onChange={e => setDNIConductor(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <span className="input-prefix">+504</span>
        <input placeholder="XXXXXXXX" value={telefono} onChange={handleTelefonoChange} required maxLength={8} disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipo_vehiculo} onChange={e => setTipoVehiculo(e.target.value)} required disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={color_vehiculo} onChange={e => setColorVehiculo(e.target.value)} required disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <input type="text" value={marca_vehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Placa del vehículo:</label>
        <input type="text" value={placa_vehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fecha_entrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando || bloqueadoEditar}>
          {cargando ? "Guardando..." : "Guardar Cambios"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={cargando || bloqueadoEditar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// --- TARJETAS RESPONSIVAS USUARIOS ---
function UsuariosCardsMobile({ usuarios, onEditar, onEliminar }) {
  return (
    <div className="usuarios-cards-mobile">
      {usuarios.map(u => (
        <div className="usuario-card-mobile" key={u.id}>
          <div className="usuario-card-mobile-info">
            <div><b>Nombre:</b> {u.nombre}</div>
            <div><b>Email:</b> {u.email}</div>
            <div><b>Rol:</b> {u.rol}</div>
            <div><b>Teléfono:</b> {u.telefono || "N/A"}</div>
            <div><b>Unidad Residencial:</b> {u.unidad_residencial || "-"}</div>
            <div><b>Fecha Creación:</b> {new Date(u.fecha_creacion).toLocaleDateString()}</div>
            <div><b>Fecha Actualización:</b> {u.fecha_actualizacion ? new Date(u.fecha_actualizacion).toLocaleDateString() : "-"}</div>
          </div>
          <div className="usuario-card-mobile-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 8 }}>
            <span onClick={() => onEliminar(u.id)}><DeleteIcon /></span>
            <span onClick={() => onEditar(u)}><EditIcon /></span>
          </div>
        </div>
      ))}
    </div>
  );
}
// --- TARJETAS RESPONSIVAS HISTORIAL ---
function HistorialCardsMobile({ historial }) {
  return (
    <div className="historial-cards-mobile">
      {historial.map((h, i) => (
        <div className="historial-card-mobile" key={i}>
          <div className="historial-card-mobile-info">
            <div><b>Residente:</b> {h.nombre_residente}</div>
            <div><b>Unidad Residencial:</b> {h.unidad_residencial}</div>
            <div><b>Visitante:</b> {h.nombre_visitante}</div>
            <div><b>Motivo:</b> {h.motivo_visita}</div>
            <div><b>Fecha Entrada:</b> {h.fecha_entrada ? new Date(h.fecha_entrada).toLocaleString() : "Pendiente"}</div>
            <div><b>Fecha Salida:</b> {h.fecha_salida ? new Date(h.fecha_salida).toLocaleString() : "Pendiente"}</div>
            <div><b>Estado:</b> {h.estado}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
// --- TARJETAS RESPONSIVAS ESCANEOS ---
function EscaneosCardsMobile({ escaneos }) {
  return (
    <div className="escaneos-cards-mobile">
      {escaneos.map(e => (
        <div className="escaneo-card-mobile" key={e.id_escaneo}>
          <div className="escaneo-card-mobile-info">
            <div><b>Fecha:</b> {new Date(e.fecha_escaneo).toLocaleString()}</div>
            <div><b>Tipo:</b> {e.tipo_escaneo}</div>
            <div><b>Visitante:</b> {e.nombre_visitante}</div>
            <div><b>Vehículo:</b> {e.tipo_vehiculo} - {e.placa_vehiculo}</div>
            <div><b>Residente:</b> {e.nombre_residente}</div>
            <div><b>Unidad:</b> {e.unidad_residencial}</div>
            <div><b>Estado:</b> {e.estado_visita}</div>
            <div><b>Dispositivo:</b> {e.dispositivo}</div>
            <div><b>Guardia:</b> {e.nombre_guardia}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const IconCheckCircle = ({ onClick, title }) => (
  <span
    onClick={onClick}
    title={title || "Aprobar solicitud"}
    style={{
      color: '#43a047',
      cursor: 'pointer',
      fontSize: 32,
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s',
    }}
    tabIndex={0}
    role="button"
    aria-label={title || "Aprobar solicitud"}
    onKeyPress={e => { if (e.key === 'Enter') onClick(); }}
  >
    ✔️
  </span>
);

const SolicitudesPendientes = ({ token, onSuccess, onCancel }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargarSolicitudes = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/visitas/admin/solicitudes_pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolicitudes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cargar las solicitudes");
    }
    setCargando(false);
  };

  const aprobarSolicitud = async (visitaId) => {
    if (!window.confirm("¿Estás seguro de que deseas aprobar esta solicitud de visita?")) return;
    try {
      await axios.post(`${API_URL}/visitas/admin/aprobar_solicitud/${visitaId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setError("");
      onSuccess && onSuccess();
      cargarSolicitudes(); // Recargar la lista
    } catch (err) {
      setError(err.response?.data?.detail || "Error al aprobar la solicitud");
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const isMobile = window.innerWidth < 800;

  if (cargando) return <div>Cargando solicitudes...</div>;
  if (error) return <div className="qr-error">{error}</div>;

  return (
    <div className="solicitudes-container">
      <h3>Solicitudes de Visita Pendientes</h3>
      {solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No hay solicitudes pendientes
        </div>
      ) : (
        <div className={isMobile ? "visitas-cards-mobile" : "solicitudes-grid"}>
          {solicitudes.map((solicitud, i) => (
            isMobile ? (
              <div className="visita-card-mobile" key={solicitud.id}>
                <div className="visita-card-mobile-info">
                  <div><b>Residente:</b> {solicitud.residente.nombre}</div>
                  <div><b>Unidad:</b> {solicitud.residente.unidad_residencial}</div>
                  <div><b>Teléfono:</b> {solicitud.residente.telefono}</div>
                  <div><b>Visitante:</b> {solicitud.visitante.nombre_conductor}</div>
                  <div><b>Vehículo:</b> {solicitud.visitante.tipo_vehiculo}</div>
                  <div><b>Placa:</b> {solicitud.visitante.placa_vehiculo}</div>
                  <div><b>Fecha Entrada:</b> {new Date(solicitud.fecha_entrada).toLocaleString()}</div>
                  <div><b>Motivo:</b> {solicitud.motivo_visita}</div>
                </div>
                <div className="visita-card-mobile-action">
                  <IconCheckCircle onClick={() => aprobarSolicitud(solicitud.id)} title="Aprobar solicitud" />
                </div>
              </div>
            ) : (
              <div className="visita-card-mobile" key={solicitud.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                <div className="visita-card-mobile-info" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1em', marginBottom: 4 }}>
                    Solicitud #{solicitud.id} - {new Date(solicitud.fecha_solicitud).toLocaleString()}
                  </div>
                  <div><b>Residente:</b> {solicitud.residente.nombre} <span style={{ color: '#888', fontWeight: 400 }}>({solicitud.residente.unidad_residencial})</span></div>
                  <div><b>Visitante:</b> {solicitud.visitante.nombre_conductor}</div>
                  <div><b><span style={{color:'#1976d2'}}>A quién visita:</span></b> {solicitud.residente.nombre}</div>
                  <div><b>Vehículo:</b> {solicitud.visitante.tipo_vehiculo} <span style={{ color: '#888' }}>{solicitud.visitante.placa_vehiculo}</span></div>
                  <div><b>Fecha Entrada:</b> {new Date(solicitud.fecha_entrada).toLocaleString()}</div>
                  <div><b>Motivo:</b> {solicitud.motivo_visita}</div>
                </div>
                <IconCheckCircle onClick={() => aprobarSolicitud(solicitud.id)} title="Aprobar solicitud" />
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para mostrar tickets en tarjetas (móvil)
function TicketsCardsMobile({ tickets, onVerDetalle, onActualizar }) {
  if (!tickets || tickets.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888', fontWeight: 'bold', fontSize: '1.1em' }}>No hay tickets</p>;
  }
  return (
    <div className="tickets-cards-mobile">
      {tickets.map(ticket => (
        <div className="ticket-card-mobile" key={ticket.id}>
          <div className="ticket-card-mobile-info">
            <div className="ticket-header-mobile">
              <b>Titulo: </b><span className="ticket-titulo-mobile">{ticket.titulo}</span>
              <br />
              <b>Estado: </b><span className={`ticket-estado-mobile ${ticket.estado}`}>
                {ticket.estado}
              </span>
            </div>
            <div><b>Residente:</b> {ticket.nombre_residente || 'N/A'}</div>
            <div><b>Descripción:</b> {ticket.descripcion}</div>
            <div><b>Fecha:</b> {new Date(ticket.fecha_creacion).toLocaleString()}</div>
            {ticket.imagen_url && (
              <div><b>Imagen:</b> <span style={{color: '#1976d2'}}>📎 Imagen Adjunta</span></div>
            )}
            {ticket.respuesta_admin && (
              <div><b>Respuesta:</b> {ticket.respuesta_admin}</div>
            )}
          </div>
          <br />
          <div className="ticket-card-mobile-actions">
            <span 
              onClick={() => onVerDetalle(ticket)}
              style={{ color: '#1976d2', cursor: 'pointer', fontSize: 30, marginRight: 30 }}
              title="Ver ticket"
            >
              👁️
            </span>
            <span 
              onClick={() => onActualizar(ticket)}
              style={{ color: '#43a047', cursor: 'pointer', fontSize: 30 }}
              title="Responder"
            >
              ✏️
            </span>
            <br />
            <hr></hr>
            <br />
          </div>
        </div>
      ))}
    </div>
  );
}

// Tabla de tickets para escritorio
function TablaTickets({ tickets, onVerDetalle, onActualizar }) {
  if (!tickets || tickets.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888', fontWeight: 'bold', fontSize: '1.1em' }}>No hay tickets</p>;
  }
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>Tickets de Soporte</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Residente</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Imagenes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>#{ticket.id}</td>
                <td>{ticket.titulo}</td>
                <td>{ticket.nombre_residente || 'N/A'}</td>
                <td>
                  <span className={`ticket-estado-badge ${ticket.estado}`}>
                    {ticket.estado}
                  </span>
                </td>
                <td>{new Date(ticket.fecha_creacion).toLocaleString()}</td>
                <td>{ticket.imagen_url ? '📎' : 
                '-'}</td>
                <td>
                  <span
                    onClick={() => onVerDetalle(ticket)}
                    style={{ color: '#1976d2', cursor: 'pointer', fontSize: 20, marginRight: 8 }}
                    title="Ver ticket"
                  >
                    👁️
                  </span>
                  <span
                    onClick={() => onActualizar(ticket)}
                    style={{ color: '#43a047', cursor: 'pointer', fontSize: 20 }}
                    title="Responder"
                  >
                    ✏️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Formulario para actualizar ticket
function FormActualizarTicket({ ticket, onSuccess, onCancel, token }) {
  const [estado, setEstado] = useState(ticket.estado || 'pendiente');
  const [respuesta, setRespuesta] = useState(ticket.respuesta_admin || '');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const datos = {
        estado: estado,
        respuesta_admin: respuesta
      };
      await axios.put(`${API_URL}/tickets/actualizar_ticket/admin/${ticket.id}`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar el ticket');
    }
    setCargando(false);
  };

  return (
    <form className="form-actualizar-ticket" onSubmit={handleSubmit} autoComplete="off" style={{background:'#fff',boxShadow:'0 8px 32px #1976d220',borderRadius:18,padding:'32px 24px',maxWidth:420,margin:'0 auto',display:'flex',flexDirection:'column',gap:18}}>
      <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: '1.35em', textAlign: 'center', marginBottom: 18, letterSpacing: 0.5 }}>Responder Ticket #{ticket.id}</h3>

      <div className="form-row" style={{marginBottom:14,display:'flex',flexDirection:'column',gap:6}}>
        <label htmlFor="titulo" style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Título</label>
        <input id="titulo" type="text" value={ticket.titulo} disabled style={{padding:'13px 14px',border:'1.8px solid #e3eafc',borderRadius:10,fontSize:'1.04em',background:'#f5f8fe',color:'#222',boxShadow:'0 1.5px 6px #1976d220',outline:'none'}} />
      </div>

      <div className="form-row" style={{marginBottom:14,display:'flex',flexDirection:'column',gap:6}}>
        <label htmlFor="residente" style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Residente</label>
        <input id="residente" type="text" value={ticket.nombre_residente || 'N/A'} disabled style={{padding:'13px 14px',border:'1.8px solid #e3eafc',borderRadius:10,fontSize:'1.04em',background:'#f5f8fe',color:'#222',boxShadow:'0 1.5px 6px #1976d220',outline:'none'}} />
      </div>

      <div className="form-row" style={{marginBottom:14,display:'flex',flexDirection:'column',gap:6}}>
        <label htmlFor="descripcion" style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Descripción</label>
        <div style={{padding:'13px 14px',border:'1.8px solid #e3eafc',borderRadius:10,fontSize:'1.04em',background:'#f5f8fe',color:'#222',boxShadow:'0 1.5px 6px #1976d220',minHeight:'60px',whiteSpace:'pre-line'}} className="ticket-description">
          {ticket.descripcion}
        </div>
      </div>
      <div className="form-row" style={{marginBottom:18,display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
        <label style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Imagen adjunta</label>
        <div className="ticket-imagen-preview" style={{margin:'10px 0',display:'flex',alignItems:'center',justifyContent:'center',minHeight:90}}>
          {ticket.imagen_url ? (
            <img src={`${API_URL}${ticket.imagen_url}`} alt="Imagen del ticket" style={{width:250,height:250,borderRadius:14,border:'2.5px solid #e3eafc',boxShadow:'0 4px 16px #1976d220',background:'#fff',objectFit:'cover',display:'block'}} />
          ) : (
            <div className="img-placeholder" style={{width:80,height:80,borderRadius:14,background:'linear-gradient(135deg,#e3eafc 60%,#f5f8fe 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'#b0b8c9',fontSize:'2.2em',border:'2.5px dashed #e3eafc',boxShadow:'0 2px 8px #1976d220'}}>📎</div>
          )}
        </div>
      </div>
      <div className="form-row" style={{marginBottom:14,display:'flex',flexDirection:'column',gap:6}}>
        <label htmlFor="estado" style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Estado</label>
        <select id="estado" value={estado} onChange={e => setEstado(e.target.value)} disabled={cargando} style={{padding:'13px 14px',border:'1.8px solid #e3eafc',borderRadius:10,fontSize:'1.04em',background:'#f5f8fe',color:'#222',boxShadow:'0 1.5px 6px #1976d220',outline:'none'}}>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="resuelto">Resuelto</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>
      <div className="form-row" style={{marginBottom:14,display:'flex',flexDirection:'column',gap:6}}>
        <label htmlFor="respuesta" style={{fontWeight:600,color:'#1976d2',marginBottom:2}}>Respuesta del administrador</label>
        <textarea
          id="respuesta"
          value={respuesta}
          onChange={e => setRespuesta(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={4}
          disabled={cargando}
          style={{padding:'13px 14px',border:'1.8px solid #e3eafc',borderRadius:10,fontSize:'1.04em',background:'#f5f8fe',color:'#222',boxShadow:'0 1.5px 6px #1976d220',outline:'none',resize:'vertical'}}
        />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions" style={{display:'flex',gap:16,marginTop:18,justifyContent:'center'}}>
        <button type="submit" className="btn-primary" disabled={cargando} style={{width:'60%',minWidth:140}}>
          {cargando ? 'Guardando...' : 'Guardar Respuesta'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={cargando} style={{width:'40%',minWidth:100}}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Vista detallada del ticket
function TicketDetalle({ ticket, onRegresar, onActualizar }) {
  const [modalImagen, setModalImagen] = useState(false);
  return (
    <div className="ticket-detalle">
      <div className="ticket-detalle-header">
        <h3 style={{ color: '#1976d2', margin: 0 }}>Ticket #{ticket.id}</h3>
        <span className={`ticket-estado-badge ${ticket.estado}`}>
          {ticket.estado}
        </span>
      </div>
      <br />
      <div className="ticket-detalle-content">
        <div className="ticket-section">
          <h3>📋 Información del Ticket</h3>
          <div className="ticket-info-grid">
            <div><b>Título:</b> {ticket.titulo}</div>
            <div><b>Fecha de creación:</b> {new Date(ticket.fecha_creacion).toLocaleString()}</div>
            <div><b>Estado:</b> {ticket.estado}</div>
            {ticket.fecha_respuesta && (
              <div><b>Fecha de respuesta:</b> {new Date(ticket.fecha_respuesta).toLocaleString()}</div>
            )}
          </div>
        </div>
        <br />
        <div className="ticket-section">
          <h3>👤 Información del Residente</h3>
          <div className="ticket-info-grid">
            <div><b>Nombre:</b> {ticket.nombre_residente || 'N/A'}</div>
          </div>
        </div>
        
        <div className="ticket-section">
          <h3>📝 Descripción del Ticket</h3>
          <div className="ticket-description">
            {ticket.descripcion}
          </div>
        </div>
        
        {ticket.imagen_url && (
          <div className="ticket-section">
            <h3>📎 Imagen Adjunta</h3>
            <div className="ticket-imagen-container">
              <img 
                src={`${API_URL}${ticket.imagen_url}`} 
                alt="Imagen del ticket" 
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '2px solid #e3eafc',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #1976d220',
                  display: 'block',
                }}
                onClick={() => setModalImagen(true)}
                title="Haz clic para ver en grande"
              />
              {modalImagen && (
                <div 
                  className="modal-imagen-ticket" 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                  }}
                  onClick={() => setModalImagen(false)}
                >
                  <img 
                    src={`${API_URL}${ticket.imagen_url}`} 
                    alt="Imagen del ticket" 
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      borderRadius: 16,
                      boxShadow: '0 4px 32px #0008',
                      background: '#fff',
                      display: 'block',
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button 
                    onClick={() => setModalImagen(false)}
                    style={{
                      position: 'fixed',
                      top: 30,
                      right: 40,
                      fontSize: 32,
                      color: '#fff',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      zIndex: 10000
                    }}
                    title="Cerrar"
                  >×</button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {ticket.respuesta_admin && (
          <div className="ticket-section">
            <h3>💬 Respuesta del Administrador</h3>
            <div className="ticket-respuesta">
              {ticket.respuesta_admin}
            </div>
          </div>
        )}
      </div>
      <br/>
      
      <div className="ticket-detalle-actions">
        <button className="btn-primary" onClick={() => onActualizar(ticket)}>
          ✏️ Responder/Actualizar
        </button>
        <button className="btn-secondary" onClick={onRegresar}>
          ← Regresar
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ token, nombre, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [ordenUsuarios, setOrdenUsuarios] = useState({ campo: "nombre", asc: true });
  const [historial, setHistorial] = useState([]);
  const [filtroHistResidente, setFiltroHistResidente] = useState("");
  const [filtroHistUnidad, setFiltroHistUnidad] = useState("");
  const [filtroHistVisitante, setFiltroHistVisitante] = useState("");
  const [filtroHistEstado, setFiltroHistEstado] = useState("");
  const [ordenHistorial, setOrdenHistorial] = useState({ campo: "fecha_entrada", asc: false });
  const [estadisticas, setEstadisticas] = useState(null);
  const [escaneosDia, setEscaneosDia] = useState(null);
  const [escaneosTotales, setEscaneosTotales] = useState(null);
  const [filtroEscGuardia, setFiltroEscGuardia] = useState("");
  const [filtroEscTipo, setFiltroEscTipo] = useState("");
  const [ordenEscaneos, setOrdenEscaneos] = useState({ campo: "fecha_escaneo", asc: false });
  const [vista, setVista] = useState("menu");
  const [usuario, setUsuario] = useState(null);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [vistaEscaneos, setVistaEscaneos] = useState("diario");
  const [filtroEscEstado, setFiltroEscEstado] = useState("");
  const [visitasAdmin, setVisitasAdmin] = useState([]);
  const [visitaEditar, setVisitaEditar] = useState(null);
  
  // Estados para tickets
  const [tickets, setTickets] = useState([]);
  const [ticketDetalle, setTicketDetalle] = useState(null);
  const [ticketActualizar, setTicketActualizar] = useState(null);
  const [filtroTicketEstado, setFiltroTicketEstado] = useState("");
  const [busquedaTicket, setBusquedaTicket] = useState("");
  const [cargandoTickets, setCargandoTickets] = useState(false);

  // Obtener datos completos del usuario autenticado
  useEffect(() => {
    axios.get(`${API_URL}/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  // Cargar usuarios con filtros y orden
  const cargarUsuarios = async () => {
    try {
      const params = {};
      if (busqueda) params.nombre = busqueda;
      if (filtroRol) params.rol = filtroRol;
      params.orden = ordenUsuarios.campo;
      params.asc = ordenUsuarios.asc;
      const res = await axios.get(`${API_URL}/usuarios/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setUsuarios(res.data);
    } catch {
      setNotification({ message: "Error al cargar usuarios", type: "error" });
    }
  };

  // Cargar estadísticas generales
  const cargarEstadisticas = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEstadisticas(res.data);
      setVista("estadisticas");
    } catch {
      setNotification({ message: "Error al cargar estadísticas", type: "error" });
    }
  };

  // Cargar escaneos del día con filtros y orden
  const cargarEscaneosDia = async () => {
    try {
      const params = {};
      if (filtroEscGuardia) params.nombre_guardia = filtroEscGuardia;
      if (filtroEscTipo) params.tipo_escaneo = filtroEscTipo;
      if (filtroEscEstado) params.estado_visita = filtroEscEstado;
      params.orden = ordenEscaneos.campo;
      params.asc = ordenEscaneos.asc;
      const res = await axios.get(`${API_URL}/visitas/admin/escaneos-dia`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setEscaneosDia(res.data);
      setVista("escaneos");
    } catch {
      setNotification({ message: "Error al cargar escaneos del día", type: "error" });
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
      const res = await axios.get(`${API_URL}/visitas/admin/escaneos-totales`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setEscaneosTotales(res.data);
      setVista("escaneos");
    } catch {
      setNotification({ message: "Error al cargar todos los escaneos ", type: "error" });
    }
  };

  // Cargar historial de visitas con filtros y orden
  const cargarHistorial = async () => {
    try {
      const params = {};
      if (filtroHistResidente) params.nombre_residente = filtroHistResidente;
      if (filtroHistUnidad) params.unidad_residencial = filtroHistUnidad;
      if (filtroHistVisitante) params.nombre_visitante = filtroHistVisitante;
      if (filtroHistEstado) params.estado = filtroHistEstado;
      params.orden = ordenHistorial.campo;
      params.asc = ordenHistorial.asc;
      const res = await axios.get(`${API_URL}/visitas/admin/historial`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setHistorial(res.data.visitas || []);
    } catch {
      setNotification({ message: "Error al cargar historial", type: "error" });
    }
  };

  // Cargar visitas del admin
  const cargarVisitasAdmin = async () => {
    try {
      const res = await axios.get(`${API_URL}/visitas/residente/mis_visitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitasAdmin(res.data || []);
    } catch {
      setNotification({ message: "Error al cargar las visitas", type: "error" });
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await axios.delete(`${API_URL}/delete_usuarios/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: "Usuario eliminado", type: "success" });
      cargarUsuarios();
    } catch {
      setNotification({ message: "Error al eliminar usuario", type: "error" });
    }
  };

  // Eliminar visita del admin
  const eliminarVisitaAdmin = async (visitaId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta visita?")) return;
    
    try {
      await axios.delete(`${API_URL}/visitas/residente/eliminar_visita/${visitaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: "Visita eliminada correctamente", type: "success" });
      cargarVisitasAdmin(); // Recargar la lista
    } catch (err) {
      setNotification({ 
        message: err.response?.data?.detail || "Error al eliminar la visita", 
        type: "error" 
      });
    }
  };

  const editarUsuario = async (usuario) => {
    setUsuarioEditar(usuario);
    setVista("crear");
  };

  // Ordenar columnas
  const handleOrden = (campo, ordenState, setOrdenState, cargarFn) => {
    setOrdenState(prev => {
      const asc = prev.campo === campo ? !prev.asc : true;
      setTimeout(cargarFn, 0);
      return { campo, asc };
    });
  };

  // Efectos para recarga automática
  useEffect(() => {
    if (vista === "usuarios") cargarUsuarios();
    // eslint-disable-next-line
  }, [busqueda, filtroRol, ordenUsuarios, vista]);

  useEffect(() => {
    if (vista === "historial") cargarHistorial();
    // eslint-disable-next-line
  }, [filtroHistResidente, filtroHistUnidad, filtroHistVisitante, filtroHistEstado, ordenHistorial, vista]);

  useEffect(() => {
    if (vista === "escaneos") cargarEscaneosDia();
    // eslint-disable-next-line
  }, [filtroEscGuardia, filtroEscTipo, ordenEscaneos, vista]);

  useEffect(() => {
    if (vista === "escaneos") cargarEscaneosTotales();
    // eslint-disable-next-line
  }, [filtroEscGuardia, filtroEscTipo, ordenEscaneos, vista]);

  useEffect(() => {
    if (vista === "estadisticas") cargarEstadisticas();
    // eslint-disable-next-line
  }, [vista]);

  useEffect(() => {
    if (vista === "mis_visitas") cargarVisitasAdmin();
  }, [vista]);

  // Cargar tickets
  const cargarTickets = async () => {
    setCargandoTickets(true);
    try {
      const params = {};
      if (filtroTicketEstado) params.estado = filtroTicketEstado;
      if (busquedaTicket) params.titulo = busquedaTicket;
      
      const res = await axios.get(`${API_URL}/tickets/listar_tickets/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setTickets(res.data || []);
    } catch (err) {
      setNotification({ message: "Error al cargar tickets", type: "error" });
    }
    setCargandoTickets(false);
  };

  // Ver detalle de ticket
  const verTicketDetalle = async (ticket) => {
    try {
      const res = await axios.get(`${API_URL}/tickets/obtener_ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketDetalle(res.data);
      setVista("ticket_detalle");
    } catch (err) {
      setNotification({ message: "Error al cargar el ticket", type: "error" });
    }
  };

  // Actualizar ticket
  const actualizarTicket = async (ticket) => {
    try {
      const res = await axios.get(`${API_URL}/tickets/obtener_ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketActualizar(res.data);
      setVista("ticket_actualizar");
    } catch (err) {
      setNotification({ message: "Error al cargar el ticket", type: "error" });
    }
  };

  // Manejar éxito en actualización
  const handleTicketActualizado = () => {
    setNotification({ message: "Ticket actualizado correctamente", type: "success" });
    setTicketActualizar(null);
    setVista("tickets");
    cargarTickets(); // Recargar la lista
  };

  useEffect(() => {
    if (vista === "tickets") cargarTickets();
  }, [vista, filtroTicketEstado, busquedaTicket]);

  // Botón regresar al menú principal
  const handleRegresar = () => setVista("menu");

  // Notificación temporal de 3 segundos
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.message]);

  // Renderizado de vistas
  return (
    <div className="admin-dashboard">
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      <UserMenu
        usuario={usuario || { nombre, rol: "admin" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={setVista}
        selected={vista}
      />
      <div style={{ marginTop: 60 }}>
        {vista === 'perfil' && <PerfilUsuario usuario={usuario} onRegresar={() => setVista('menu')} />}
        {vista === 'config' && <ConfiguracionUsuario onRegresar={() => setVista('menu')} usuario={{ id: 1, rol: 'admin' }} />}
        {vista === 'menu' && (
          <MainMenu nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={setVista} />
        )}
        {vista === 'usuarios' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Usuarios</h3>
            <div className="admin-search">
              <input
                type="text"
                placeholder="Buscar por nombre"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="residente">Residente</option>
                <option value="guardia">Guardia</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {window.innerWidth < 800
              ? <UsuariosCardsMobile usuarios={usuarios} onEditar={editarUsuario} onEliminar={eliminarUsuario} />
              : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleOrden("nombre", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Nombre {ordenUsuarios.campo === "nombre"}
                  </th>
                  <th onClick={() => handleOrden("email", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Email {ordenUsuarios.campo === "email"}
                  </th>
                  <th onClick={() => handleOrden("rol", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Rol {ordenUsuarios.campo === "rol"}
                  </th>
                  <th>Teléfono</th>
                  <th onClick={() => handleOrden("unidad_residencial", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Unidad Residencial {ordenUsuarios.campo === "unidad_residencial"}
                  </th>
                  <th onClick={() => handleOrden("fecha_creacion", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Fecha Creación {ordenUsuarios.campo === "fecha_creacion"}
                  </th>
                  <th onClick={() => handleOrden("fecha_actualizacion", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    Fecha Actualización {ordenUsuarios.campo === "fecha_actualizacion"}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol}</td>
                    <td>{u.telefono || "N/A"}</td>
                    <td>{u.unidad_residencial || "-"}</td>
                    <td>{u.residencial_nombre || "-"}</td>
                    <td>{new Date(u.fecha_creacion).toLocaleDateString()}</td>
                    <td>{u.fecha_actualizacion ? new Date(u.fecha_actualizacion).toLocaleDateString() : "-"}</td>
                    <td>
                      <span onClick={() => eliminarUsuario(u.id)}><DeleteIcon /></span>
                      <span onClick={() => editarUsuario(u)}><EditIcon /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              )}
          </section>
        )}
        {vista === 'crear' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <CrearUsuario token={token} onUsuarioCreado={cargarUsuarios} usuarioEditar={usuarioEditar} setUsuarioEditar={setUsuarioEditar} />
          </section>
        )}
        {vista === 'historial' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Historial de Visitas</h3>
            <div className="admin-search">
              <input
                type="text"
                placeholder="Residente"
                value={filtroHistResidente}
                onChange={e => setFiltroHistResidente(e.target.value)}
              />
              <input
                type="text"
                placeholder="Unidad Residencial"
                value={filtroHistUnidad}
                onChange={e => setFiltroHistUnidad(e.target.value)}
              />
              <input
                type="text"
                placeholder="Visitante"
                value={filtroHistVisitante}
                onChange={e => setFiltroHistVisitante(e.target.value)}
              />
              <select value={filtroHistEstado} onChange={e => setFiltroHistEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="rechazado">Rechazado</option>
                <option value="aprobado">Aprobado</option>
                <option value="completado">Completado</option>
                <option value="expirado">Expirado</option>
              </select>
            </div>
            {window.innerWidth < 700
              ? <HistorialCardsMobile historial={historial} />
              : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleOrden("nombre_residente", ordenHistorial, setOrdenHistorial, cargarHistorial)} style={{ cursor: "pointer" }}>
                    Residente {ordenHistorial.campo === "nombre_residente"}
                  </th>
                  <th onClick={() => handleOrden("unidad_residencial", ordenHistorial, setOrdenHistorial, cargarHistorial)} style={{ cursor: "pointer" }}>
                    Unidad Residencial {ordenHistorial.campo === "unidad_residencial"}
                  </th>
                  <th onClick={() => handleOrden("nombre_visitante", ordenHistorial, setOrdenHistorial, cargarHistorial)} style={{ cursor: "pointer" }}>
                    Visitante {ordenHistorial.campo === "nombre_visitante"}
                  </th>
                  <th>Motivo</th>
                  <th onClick={() => handleOrden("fecha_entrada", ordenHistorial, setOrdenHistorial, cargarHistorial)} style={{ cursor: "pointer" }}>
                    Fecha Entrada {ordenHistorial.campo === "fecha_entrada"}
                  </th>
                  <th>Fecha Salida</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td>{h.nombre_residente}</td>
                    <td>{h.unidad_residencial}</td>
                    <td>{h.nombre_visitante}</td>
                    <td>{h.motivo_visita}</td>
                    <td>{h.fecha_entrada ? new Date(h.fecha_entrada).toLocaleString() : "Pendiente"}</td>
                    <td>{h.fecha_salida ? new Date(h.fecha_salida).toLocaleString() : "Pendiente"}</td>
                    <td>{h.estado}</td>
                  </tr>
                ))}
              </tbody>
              <hr />
            </table>
              )}
          </section>
        )}
        {vista === 'estadisticas' && estadisticas && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>📊 Estadísticas Generales</h3>
            <div className="estadisticas-cards">
              <div className="estadistica-card">
                <b>Total Visitas:</b> {estadisticas.estadisticas_generales.total_visitas}
              </div>
              <div className="estadistica-card">
                <b>Pendientes:</b> {estadisticas.estadisticas_generales.visitas_pendientes}
              </div>
              <div className="estadistica-card">
                <b>Aprobadas:</b> {estadisticas.estadisticas_generales.visitas_aprobadas}
              </div>
              <div className="estadistica-card">
                <b>Completadas:</b> {estadisticas.estadisticas_generales.visitas_completadas}
              </div>
              <div className="estadistica-card">
                <b>Rechazadas:</b> {estadisticas.estadisticas_generales.visitas_rechazadas}
              </div>
              <div className="estadistica-card">
                <b>Expiradas:</b> {estadisticas.estadisticas_generales.visitas_expiradas}
              </div>
              <div className="estadistica-card">
                <b>Escaneos hoy:</b> {estadisticas.estadisticas_generales.total_escaneos_hoy}
              </div>
              <div className="estadistica-card">
                <b>Entradas hoy:</b> {estadisticas.estadisticas_generales.escaneos_entrada_hoy}
              </div>
              <div className="estadistica-card">
                <b>Salidas hoy:</b> {estadisticas.estadisticas_generales.escaneos_salida_hoy}
              </div>
            </div>

            {estadisticas.estados_visitas && estadisticas.estados_visitas.length > 0 && (
              <div style={{ maxWidth: 400, margin: "30px auto" }}>
                <h4>Estados de Visitas</h4>
                <Pie
                  data={{
                    labels: estadisticas.estados_visitas.map(e => e.estado),
                    datasets: [{
                      data: estadisticas.estados_visitas.map(e => e.cantidad),
                      backgroundColor: [
                        " #e53935", " #00bcd4", " #fbc02d", " #43a047", " #8e24aa", " #1976d2"
                      ],
                    }]
                  }}
                  options={{
                    plugins: {
                      legend: { position: "bottom" }
                    }
                  }}
                />
              </div>
            )}

            {estadisticas.horarios_actividad && estadisticas.horarios_actividad.length > 0 && (
              <div style={{ maxWidth: 600, margin: "30px auto" }}>
                <h4>Horarios de Actividad</h4>
                <Bar
                  data={{
                    labels: estadisticas.horarios_actividad.map(h => `${h.hora}:00`),
                    datasets: [
                      {
                        label: "Entradas",
                        data: estadisticas.horarios_actividad.map(h => h.cantidad_entradas),
                        backgroundColor: " #1976d2"
                      },
                      {
                        label: "Salidas",
                        data: estadisticas.horarios_actividad.map(h => h.cantidad_salidas),
                        backgroundColor: " #43a047"
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "top" }
                    },
                    scales: {
                      x: { stacked: true },
                      y: { beginAtZero: true, stacked: true }
                    }
                  }}
                />
              </div>
            )}

            <div className="estadisticas-section">
              <h4>Actividad de los Guardias (Hoy)</h4>
              <table className="estadisticas-table">
                <thead>
                  <tr>
                    <th>Guardia</th>
                    <th>Total Escaneos</th>
                    <th>Entradas</th>
                    <th>Salidas</th>
                  </tr>
                </thead>
                <tbody>
                  {(estadisticas.guardias_actividad?.length > 0 ? estadisticas.guardias_actividad : [{nombre_guardia: "Sin datos", total_escaneos: 0, escaneos_entrada: 0, escaneos_salida: 0}]).map((g, i) => (
                    <tr key={i}>
                      <td>{g.nombre_guardia}</td>
                      <td>{g.total_escaneos}</td>
                      <td>{g.escaneos_entrada}</td>
                      <td>{g.escaneos_salida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="estadisticas-section">
              <h4>Residentes más activos</h4>
              <table className="estadisticas-table">
                <thead>
                  <tr>
                    <th>Residente</th>
                    <th>Unidad</th>
                    <th>Total Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {(estadisticas.residentes_activos?.length > 0 ? estadisticas.residentes_activos : [{nombre_residente: "Sin datos", unidad_residencial: "-", total_visitas: 0}]).map((r, i) => (
                    <tr key={i}>
                      <td>{r.nombre_residente}</td>
                      <td>{r.unidad_residencial}</td>
                      <td>{r.total_visitas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <b>Consulta realizada:</b> {estadisticas.fecha_consulta ? new Date(estadisticas.fecha_consulta).toLocaleString() : new Date().toLocaleString()}
            </div>
          </section>
        )}
        {vista === 'escaneos' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <button
                className={`main-menu-card${vistaEscaneos === "diario" ? " selected" : ""}`}
                style={{ padding: "10px 18px", fontSize: "1em" }}
                onClick={() => setVistaEscaneos("diario")}>Escaneos Diario</button>
              <button
                className={`main-menu-card${vistaEscaneos === "historicos" ? " selected" : ""}`}
                style={{ padding: "10px 18px", fontSize: "1em" }}
                onClick={() => setVistaEscaneos("historicos")}>Escaneos Históricos</button>
            </div>
            {window.innerWidth < 700
              ? <EscaneosCardsMobile escaneos={vistaEscaneos === "diario" ? (escaneosDia?.escaneos || []) : (escaneosTotales?.escaneos || [])} />
              : (
                <TablaEscaneos escaneos={vistaEscaneos === "diario" ? (escaneosDia?.escaneos || []) : (escaneosTotales?.escaneos || [])} titulo={vistaEscaneos === "diario" ? "Escaneos Diarios" : "Escaneos Históricos"} />
            )}
          </section>
        )}
        {vista === 'social' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <SocialDashboard token={token} rol={usuario?.rol || "admin"} />
          </section>
        )}
        {vista === 'crear_visita' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h2 className="crear-visita-title">Crear Nueva Visita</h2>
            <FormCrearVisitaAdmin
              token={token}
              onSuccess={() => {
                setNotification({ message: "Visita creada correctamente", type: "success" });
                setVista("mis_visitas");
              }}
              onCancel={() => setVista('menu')}
              setVista={setVista}
              usuario={usuario}
            />
          </section>
        )}
        {vista === 'mis_visitas' && !visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <TablaVisitasAdmin 
              visitas={visitasAdmin} 
              onEditar={setVisitaEditar} 
              onEliminar={eliminarVisitaAdmin}
            />
          </section>
        )}
        {vista === 'mis_visitas' && visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => { setVisitaEditar(null); setVista('mis_visitas'); }} />
            <FormEditarVisitaAdmin
              token={token}
              visita={visitaEditar}
              onSuccess={() => {
                setNotification({ message: "Visita editada correctamente", type: "success" });
                setVisitaEditar(null);
                cargarVisitasAdmin();
              }}
              onCancel={() => setVisitaEditar(null)}
            />
          </section>
        )}
        {vista === 'solicitudes' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <SolicitudesPendientes
              token={token}
              onSuccess={() => {
                setNotification({ message: "Solicitud aprobada correctamente", type: "success" });
              }}
              onCancel={() => setVista('menu')}
            />
          </section>
        )}
        {vista === 'tickets' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>🎫 Gestión de Tickets</h3>
            
            <div className="admin-search">
              <select value={filtroTicketEstado} onChange={e => setFiltroTicketEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="resuelto">Resuelto</option>
                <option value="rechazado">Rechazado</option>
              </select>
              <button 
                className="btn-refresh" 
                onClick={cargarTickets}
                disabled={cargandoTickets}
              >
                {cargandoTickets ? '🔄' : '🔄'}
              </button>
            </div>
            
            {cargandoTickets ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Cargando tickets...</div>
            ) : (
              window.innerWidth < 750 ? (
                <TicketsCardsMobile 
                  tickets={tickets} 
                  onVerDetalle={verTicketDetalle}
                  onActualizar={actualizarTicket}
                />
              ) : (
                <TablaTickets 
                  tickets={tickets} 
                  onVerDetalle={verTicketDetalle}
                  onActualizar={actualizarTicket}
                />
              )
            )}
          </section>
        )}
        
        {vista === 'ticket_detalle' && ticketDetalle && (
          <section className="admin-section">
            <BtnRegresar onClick={() => { setTicketDetalle(null); setVista('tickets'); }} />
            <TicketDetalle 
              ticket={ticketDetalle}
              onRegresar={() => { setTicketDetalle(null); setVista('tickets'); }}
              onActualizar={actualizarTicket}
            />
          </section>
        )}
        
        {vista === 'ticket_actualizar' && ticketActualizar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => { setTicketActualizar(null); setVista('tickets'); }} />
            <FormActualizarTicket 
              ticket={ticketActualizar}
              onSuccess={handleTicketActualizado}
              onCancel={() => { setTicketActualizar(null); setVista('tickets'); }}
              token={token}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;