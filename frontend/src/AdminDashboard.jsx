import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import SocialDashboard from "./SocialDashboard";
import UserMenu from "./UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
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
        <button className="main-menu-card" onClick={() => onSelectVista("historial")}>📋<div>Historial de Visitas</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("crear")}>➕<div>Crear Usuario</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("estadisticas")}>📊<div>Estadísticas</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("escaneos")}>🕒<div>Escaneos</div></button>
        <button className="main-menu-card" onClick={() => onSelectVista("social")}>💬<div>Social</div></button>
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
  const [telefono, setTelefono] = useState("");
  const [unidadResidencial, setUnidadResidencial] = useState("");
  const [mensaje, setMensaje] = useState("");

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
      } else {
        await axios.post(`${API_URL}/create_usuarios/admin/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensaje("Usuario creado correctamente");
      }
      setNombre(""); setEmail(""); setRol("residente"); setPassword(""); setTelefono(""); setUnidadResidencial("");
      if (onUsuarioCreado) onUsuarioCreado();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setMensaje("Error: " + err.response.data.detail);
      } else {
        setMensaje("Error al crear/actualizar usuario");
      }
    }
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(value);
  };

  return (
    <form onSubmit={handleCrear} className="crear-usuario-form">
      <h3 style={{ color: "#1976d2", marginBottom: 10 }}>
        {usuarioEditar ? "Editar Usuario" : "Crear Usuario"}
      </h3>
      <div className="form-row">
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <input placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
      </div>
      <div className="form-row">
        <select value={rol} onChange={e => setRol(e.target.value)}>
          <option value="residente">Residente</option>
          <option value="guardia">Guardia</option>
          <option value="admin">Admin</option>
        </select>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: 4, fontWeight: "bold" }}>+504</span>
          <input placeholder="XXXXXXXX" value={telefono} onChange={handleTelefonoChange} required maxLength={8} style={{ width: "120px" }} />
        </div>
        {rol === "residente" && (
          <input
            placeholder="Unidad Residencial"
            value={unidadResidencial}
            onChange={e => setUnidadResidencial(e.target.value)}
            required
          />
        )}
      </div>
      <div className="form-row">
        <input
          placeholder={usuarioEditar ? "Nueva Contraseña" : "Contraseña"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          type="password"
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <button type="submit" className="btn-primary">
          {usuarioEditar ? "Actualizar" : "Crear"}
        </button>
        {usuarioEditar && (
          <button type="button" className="btn-secondary" style={{ marginLeft: 10 }} onClick={() => setUsuarioEditar(null)}>
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

  // Botón regresar al menú principal
  const handleRegresar = () => setVista("menu");

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
        {vista === 'perfil' && <PerfilUsuario usuario={usuario} />}
        {vista === 'config' && <ConfiguracionUsuario />}
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
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleOrden("id", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)} style={{ cursor: "pointer" }}>
                    ID {ordenUsuarios.campo === "id"}
                  </th>
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
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol}</td>
                    <td>{u.telefono || "N/A"}</td>
                    <td>{u.unidad_residencial || "-"}</td>
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
            </table>
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
                <h4>Estados de Visitas (Gráfico de Pastel)</h4>
                <Pie
                  data={{
                    labels: estadisticas.estados_visitas.map(e => e.estado),
                    datasets: [{
                      data: estadisticas.estados_visitas.map(e => e.cantidad),
                      backgroundColor: [
                        "#1976d2", "#43a047", "#e53935", "#fbc02d", "#8e24aa", "#00bcd4"
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
                <h4>Horarios de Actividad (Gráfico de Barras)</h4>
                <Bar
                  data={{
                    labels: estadisticas.horarios_actividad.map(h => `${h.hora}:00`),
                    datasets: [
                      {
                        label: "Entradas",
                        data: estadisticas.horarios_actividad.map(h => h.cantidad_entradas),
                        backgroundColor: "#1976d2"
                      },
                      {
                        label: "Salidas",
                        data: estadisticas.horarios_actividad.map(h => h.cantidad_salidas),
                        backgroundColor: "#43a047"
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
              <h4>Actividad de los Guardias (hoy)</h4>
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
            {vistaEscaneos === "diario" && escaneosDia && (
              <TablaEscaneos escaneos={escaneosDia.escaneos || []} titulo="Escaneos Diarios" />
            )}
            {vistaEscaneos === "historicos" && escaneosTotales && (
              <TablaEscaneos escaneos={escaneosTotales.escaneos || []} titulo="Escaneos Históricos" />
            )}
          </section>
        )}
        {vista === 'social' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <SocialDashboard token={token} rol={usuario?.rol || "admin"} />
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;