import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import UserMenu from "./components/UI/UserMenu";
import PWADownloadButton from "./components/PWA/PWADownloadButton";
import './css/SuperAdminDashboard.css';

// Notificación tipo tarjeta
function Notification({ message, type, onClose }) {
  if (!message) return null;
  
  // Auto-cerrar después de 4 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);
  
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

// Componente para crear administradores
function CrearAdmin({ token, onAdminCreado, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    residencial_id: ""
  });
  const [residenciales, setResidenciales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    cargarResidenciales();
  }, []);

  const cargarResidenciales = async () => {
    try {
      const response = await axios.get(`${API_URL}/super-admin/listar-residenciales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidenciales(response.data);
    } catch (error) {
      setNotification({ message: "Error al cargar residenciales", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setNotification({ message: "", type: "" });

    try {
      const adminData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono.trim() ? "+504" + telefono : "",
        password: formData.password,
        unidad_residencial: formData.unidad_residencial,
        rol: "admin"
      };

      await axios.post(`${API_URL}/super-admin/crear-admin-residencial?residencial_id=${parseInt(formData.residencial_id)}`, adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Administrador creado exitosamente", type: "success" });
      setFormData({ nombre: "", email: "", password: "", residencial_id: "" });
      onAdminCreado();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear administrador";
      setNotification({ message, type: "error" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Crear Administrador</h2>
        <div className="header-actions">
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nombre completo:</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Telefono:</label>
            <input
              type="number"
              placeholder="xxxx-xxxx"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Unidad residencial:</label>
            <input
              type="text"
              value={formData.unidad_residencial}
              onChange={(e) => setFormData({...formData, unidad_residencial: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Residencial:</label>
            <select
              value={formData.residencial_id}
              onChange={(e) => setFormData({...formData, residencial_id: e.target.value})}
              required
            >
              <option value="">Seleccionar residencial</option>
              {residenciales.map(residencial => (
                <option key={residencial.id} value={residencial.id}>
                  {residencial.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? "Creando..." : "Crear Administrador"}
          </button>
        </div>
      </form>

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Componente para listar administradores
function ListarAdmins({ token, onCancel, onLogout }) {
  const [admins, setAdmins] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/super-admin/listar-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      setNotification({ message: "Error al cargar administradores", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="loading">Cargando administradores...</div>;
  }

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Administradores del Sistema</h2>
        <div className="header-actions">
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      <div className="admins-grid">
        {admins.map(admin => (
          <div key={admin.id} className="admin-card">
            <div className="admin-header">
              <h3>{admin.nombre}</h3>
              <span className="admin-role">Administrador</span>
            </div>
            <div className="admin-info">
              <p><strong>Email:</strong> {admin.email}</p>
              <p><strong>Residencial:</strong> {admin.residencial_nombre}</p>
              <p><strong>Telefono:</strong> {admin.telefono}</p>
              <p><strong>Fecha de creación:</strong> {new Date(admin.fecha_creacion).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="empty-state">
          <p>No hay administradores registrados</p>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Componente para crear residenciales
function CrearResidencial({ token, onResidencialCreada, onCancel, onLogout }) {
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: ""
  });
  const [cargando, setCargando] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setNotification({ message: "", type: "" });

    try {
      await axios.post(`${API_URL}/residenciales/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Residencial creada exitosamente", type: "success" });
      setFormData({ nombre: "", direccion: "" });
      onResidencialCreada();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear residencial";
      setNotification({ message, type: "error" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Crear Residencial</h2>
        <div className="header-actions">
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nombre de la residencial:</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Dirección:</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? "Creando..." : "Crear Residencial"}
          </button>
        </div>
      </form>

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Componente para listar residenciales
function ListarResidenciales({ token, onCancel, onLogout, onSelectVista }) {
  const [residenciales, setResidenciales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [filtros, setFiltros] = useState({
    nombre: "",
    direccion: ""
  });
  const [residencialesFiltrados, setResidencialesFiltrados] = useState([]);

  useEffect(() => {
    cargarResidenciales();
  }, []);

  useEffect(() => {
    // Aplicar filtros en tiempo real
    if (residenciales.length > 0) {
      const filtrados = residenciales.filter(residencial => {
        const nombreMatch = residencial.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
        const direccionMatch = residencial.direccion.toLowerCase().includes(filtros.direccion.toLowerCase());
        return nombreMatch && direccionMatch;
      });
      setResidencialesFiltrados(filtrados);
    }
  }, [filtros, residenciales]);

  const cargarResidenciales = async () => {
    try {
      const response = await axios.get(`${API_URL}/super-admin/listar-residenciales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidenciales(response.data);
      setResidencialesFiltrados(response.data);
    } catch (error) {
      setNotification({ message: "Error al cargar residenciales", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleVerUsuarios = (residencialId, residencialNombre) => {
    onSelectVista("usuarios-residencial", { residencialId, residencialNombre });
  };

  if (cargando) {
    return <div className="loading">Cargando residenciales...</div>;
  }

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Residenciales del Sistema</h2>
        <div className="header-actions">
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      {/* Filtros en tiempo real */}
      <div className="filtros-container">
        <div className="filtros-row">
          <div className="filtro-group">
            <label>Buscar por nombre:</label>
            <input
              type="text"
              value={filtros.nombre}
              onChange={(e) => handleFiltroChange('nombre', e.target.value)}
              placeholder="Nombre de la residencial..."
            />
          </div>
          <div className="filtro-group">
            <label>Buscar por dirección:</label>
            <input
              type="text"
              value={filtros.direccion}
              onChange={(e) => handleFiltroChange('direccion', e.target.value)}
              placeholder="Dirección de la residencial..."
            />
          </div>
          <div className="filtro-actions">
            <button className="btn-limpiar-filtros" onClick={() => setFiltros({ nombre: "", direccion: "" })}>
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="residenciales-grid">
        {residencialesFiltrados.map(residencial => (
          <div key={residencial.id} className="residencial-card">
            <div className="residencial-header">
              <h3>{residencial.nombre}</h3>
              <span className="residencial-id">ID: {residencial.id}</span>
            </div>
            <div className="residencial-info">
              <p><strong>Dirección:</strong> {residencial.direccion}</p>
              <p><strong>Fecha de creación:</strong> {new Date(residencial.fecha_creacion).toLocaleDateString()}</p>
            </div>
            <div className="residencial-stats">
              <div className="stat-item">
                <span className="stat-number">{residencial.estadisticas.administradores}</span>
                <span className="stat-label">Administradores</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{residencial.estadisticas.residentes}</span>
                <span className="stat-label">Residentes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{residencial.estadisticas.guardias}</span>
                <span className="stat-label">Guardias</span>
              </div>
            </div>
            <div className="residencial-actions">
              <button 
                className="btn-ver-usuarios" 
                onClick={() => handleVerUsuarios(residencial.id, residencial.nombre)}
              >
                👥 Ver Usuarios
              </button>
            </div>
          </div>
        ))}
      </div>

      {residencialesFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No hay residenciales que coincidan con los filtros</p>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Componente para ver usuarios de una residencial específica
function UsuariosResidencial({ token, residencialData, onCancel, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [residencial, setResidencial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [filtros, setFiltros] = useState({
    nombre: "",
    rol: ""
  });
  const [usuariosSinFiltrar, setUsuariosSinFiltrar] = useState([]);

  useEffect(() => {
    cargarUsuarios();
  }, [residencialData.residencialId]);

  // Efecto para aplicar filtros en tiempo real
  useEffect(() => {
    if (usuariosSinFiltrar.length > 0) {
      const filtrados = usuariosSinFiltrar.filter(usuario => {
        const nombreMatch = usuario.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
        const rolMatch = filtros.rol === "" || usuario.rol === filtros.rol;
        return nombreMatch && rolMatch;
      });
      setUsuarios(filtrados);
    }
  }, [filtros, usuariosSinFiltrar]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await axios.get(
        `${API_URL}/super-admin/usuarios-residencial/${residencialData.residencialId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsuariosSinFiltrar(response.data.usuarios);
      setUsuarios(response.data.usuarios);
      setResidencial(response.data.residencial);
    } catch (error) {
      setNotification({ message: "Error al cargar usuarios", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({ nombre: "", rol: "" });
  };

  if (cargando) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Usuarios de {residencial?.nombre || residencialData.residencialNombre}</h2>
        <div className="header-actions">
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-row">
          <div className="filtro-group">
            <label>Buscar por nombre:</label>
            <input
              type="text"
              value={filtros.nombre}
              onChange={(e) => handleFiltroChange('nombre', e.target.value)}
              placeholder="Nombre del usuario..."
            />
          </div>
          <div className="filtro-group">
            <label>Filtrar por rol:</label>
            <select
              value={filtros.rol}
              onChange={(e) => handleFiltroChange('rol', e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="residente">Residentes</option>
              <option value="guardia">Guardias</option>
            </select>
          </div>
          <div className="filtro-actions">
            <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Información de la residencial */}
      {residencial && (
        <div className="residencial-info-card">
          <h3>Información de la Residencial</h3>
          <p><strong>Nombre:</strong> {residencial.nombre}</p>
          <p><strong>Dirección:</strong> {residencial.direccion}</p>
          <p><strong>Total de usuarios:</strong> {usuarios.length}</p>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="usuarios-grid">
        {usuarios.map(usuario => (
          <div key={`${usuario.rol}-${usuario.id}`} className="usuario-card">
            <div className="usuario-header">
              <h3>{usuario.nombre}</h3>
              <span className={`usuario-rol ${usuario.rol}`}>
                {usuario.rol === 'admin' ? '👤 Administrador' : 
                usuario.rol === 'residente' ? '🏠 Residente' : '🛡️ Guardia'}
              </span>
            </div>
            <div className="usuario-info">
              <p><strong>Email:</strong> {usuario.email}</p>
              <p><strong>Teléfono:</strong> {usuario.telefono}</p>

              {/* Mostrar unidad residencial para admin o residente */}
              {(usuario.rol === 'admin' || usuario.rol === 'residente') && (
                <p>
                  <strong>Unidad Residencial:</strong> {usuario.unidad_residencial || 'N/A'}
                </p>
              )}
              <p><strong>Fecha de creación:</strong> {new Date(usuario.fecha_creacion).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {usuarios.length === 0 && (
        <div className="empty-state">
          <p>No hay usuarios registrados en esta residencial</p>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Menú principal del super admin
function MainMenu({ nombre, onLogout, onSelectVista }) {
  return (
    <div className="super-admin-container">
      <div className="super-admin-header">
        <div className="header-content">
          <h1>Panel de Super Administrador</h1>
          <p>Bienvenido, {nombre}</p>
        </div>
        <div className="header-actions">
          <UserMenu 
            usuario={{ nombre: nombre, rol: "super_admin" }}
            onLogout={onLogout}
            ultimaConexion={null}
            onSelect={() => {}}
            selected=""
          />
          <button className="btn-logout" onClick={onLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="super-admin-menu">
        <div className="menu-grid">
          <div className="menu-card" onClick={() => onSelectVista("crear-admin")}>
            <div className="menu-icon">👤</div>
            <h3>Crear Administrador</h3>
            <p>Crear nuevos administradores para residenciales</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("listar-admins")}>
            <div className="menu-icon">📋</div>
            <h3>Ver Administradores</h3>
            <p>Listar todos los administradores del sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("crear-residencial")}>
            <div className="menu-icon">🏢</div>
            <h3>Crear Residencial</h3>
            <p>Crear nuevas residenciales en el sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("listar-residenciales")}>
            <div className="menu-icon">📊</div>
            <h3>Ver Residenciales</h3>
            <p>Listar todas las residenciales con estadísticas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard principal del super admin
function SuperAdminDashboard({ token, nombre, onLogout }) {
  const [vista, setVista] = useState("menu");
  const [vistaData, setVistaData] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleSelectVista = (nuevaVista, data = null) => {
    setVista(nuevaVista);
    setVistaData(data);
  };

  const handleRegresar = () => {
    setVista("menu");
    setVistaData(null);
  };

  const handleAdminCreado = () => {
    setNotification({ message: "Administrador creado exitosamente", type: "success" });
    setTimeout(() => setVista("menu"), 2000);
  };

  const handleResidencialCreada = () => {
    setNotification({ message: "Residencial creada exitosamente", type: "success" });
    setTimeout(() => setVista("menu"), 2000);
  };

  return (
    <div className="super-admin-dashboard">
      {/* Botón PWA en la esquina superior izquierda */}
      <div className="pwa-button-container">
        <PWADownloadButton />
      </div>
      
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      
      {vista === "menu" && (
        <MainMenu 
          nombre={nombre} 
          onLogout={onLogout} 
          onSelectVista={handleSelectVista} 
        />
      )}

      {vista === "crear-admin" && (
        <CrearAdmin 
          token={token} 
          onAdminCreado={handleAdminCreado} 
          onCancel={handleRegresar} 
        />
      )}

      {vista === "listar-admins" && (
        <ListarAdmins token={token} onCancel={handleRegresar}  />
      )}

      {vista === "crear-residencial" && (
        <CrearResidencial 
          token={token} 
          onResidencialCreada={handleResidencialCreada} 
          onCancel={handleRegresar} 
        />
      )}

      {vista === "listar-residenciales" && (
        <ListarResidenciales 
          token={token} 
          onCancel={handleRegresar} 
          onSelectVista={handleSelectVista}
        />
      )}

      {vista === "usuarios-residencial" && vistaData && (
        <UsuariosResidencial 
          token={token} 
          residencialData={vistaData}
          onCancel={handleRegresar} 
        />
      )}
    </div>
  );
}

export default SuperAdminDashboard;