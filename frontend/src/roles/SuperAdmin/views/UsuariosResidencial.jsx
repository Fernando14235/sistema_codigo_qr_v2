import React, { useState, useEffect } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

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
      const response = await api.get(
        `/super-admin/usuarios-residencial/${residencialData.residencialId}`,
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

export default UsuariosResidencial;
