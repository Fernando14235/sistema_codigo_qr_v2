import React, { useState, useEffect } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

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
      const response = await api.get(`/super-admin/listar-residenciales`, {
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
        <h2>Entidades del Sistema</h2>
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
              placeholder="Nombre de la entidad..."
            />
          </div>
          <div className="filtro-group">
            <label>Buscar por dirección:</label>
            <input
              type="text"
              value={filtros.direccion}
              onChange={(e) => handleFiltroChange('direccion', e.target.value)}
              placeholder="Dirección de la entidad..."
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
          <p>No hay entidades que coincidan con los filtros</p>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

export default ListarResidenciales;
