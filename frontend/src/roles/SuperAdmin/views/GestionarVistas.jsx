import React, { useState, useEffect } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

// Componente para gestionar vistas
function GestionarVistas({ token, onCancel, onLogout }) {
  const [residenciales, setResidenciales] = useState([]);
  const [residencialSeleccionada, setResidencialSeleccionada] = useState(null);
  const [adminSeleccionado, setAdminSeleccionado] = useState(null);
  const [vistasResidencial, setVistasResidencial] = useState([]);
  const [vistasAdmin, setVistasAdmin] = useState([]);
  const [adminsResidencial, setAdminsResidencial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    cargarResidenciales();
  }, []);

  const cargarResidenciales = async () => {
    try {
      console.log("Cargando residenciales...");
      const res = await api.get(`/super-admin/listar-residenciales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Residenciales cargadas:", res.data);
      setResidenciales(res.data);
    } catch (err) {
      console.error("Error al cargar residenciales:", err);
      setNotification({ message: "Error al cargar residenciales", type: "error" });
    }
  };

  const crearVistasDefault = async () => {
    try {
      const res = await api.post(`/super-admin/crear-vistas-default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: res.data.message, type: "success" });
    } catch (err) {
      setNotification({ 
        message: err.response?.data?.detail || "Error al crear vistas por defecto", 
        type: "error" 
      });
    }
  };

  const cargarVistasResidencial = async (residencialId) => {
    setCargando(true);
    try {
      const res = await api.get(`/super-admin/residencial/${residencialId}/vistas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVistasResidencial(res.data.vistas || []);
    } catch (err) {
      setNotification({ message: "Error al cargar vistas de la residencial", type: "error" });
    }
    setCargando(false);
  };

  const cargarAdminsResidencial = async (residencialId) => {
    try {
      const res = await api.get(`/super-admin/residencial/${residencialId}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminsResidencial(res.data.administradores || []);
    } catch (err) {
      setNotification({ message: "Error al cargar administradores", type: "error" });
    }
  };

  const cargarVistasAdmin = async (adminId) => {
    setCargando(true);
    try {
      const res = await api.get(`/super-admin/admin/${adminId}/vistas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVistasAdmin(res.data.vistas || []);
    } catch (err) {
      setNotification({ message: "Error al cargar vistas del administrador", type: "error" });
    }
    setCargando(false);
  };

  const toggleVistaResidencial = async (vistaId, activa) => {
    try {
      await api.post(`/super-admin/residencial/${residencialSeleccionada.id}/vistas/${vistaId}/toggle?activa=${activa}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let mensaje = `Vista ${activa ? 'activada' : 'desactivada'} para la entidad`;
      if (!activa) {
        mensaje += ". Todos los administradores de esta entidad perderán acceso a esta vista.";
      }
      
      setNotification({ 
        message: mensaje, 
        type: "success" 
      });
      
      cargarVistasResidencial(residencialSeleccionada.id);
      
      if (adminSeleccionado) {
        cargarVistasAdmin(adminSeleccionado.id);
      }
    } catch (err) {
      setNotification({ message: "Error al actualizar vista", type: "error" });
    }
  };

  const toggleVistaAdmin = async (vistaId, activa) => {
    const vista = vistasAdmin.find(v => v.id === vistaId);
    if (vista && vista.bloqueada_por_residencial) {
      setNotification({ 
        message: "No se puede activar una vista que está desactivada a nivel entidad", 
        type: "error" 
      });
      return;
    }

    try {
      await api.post(`/super-admin/admin/${adminSeleccionado.id}/vistas/${vistaId}/toggle?activa=${activa}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ 
        message: `Vista ${activa ? 'activada' : 'desactivada'} para el administrador`, 
        type: "success" 
      });
      cargarVistasAdmin(adminSeleccionado.id);
    } catch (err) {
      setNotification({ message: "Error al actualizar vista", type: "error" });
    }
  };

  const seleccionarResidencial = (residencial) => {
    setResidencialSeleccionada(residencial);
    setAdminSeleccionado(null);
    setVistasAdmin([]);
    cargarVistasResidencial(residencial.id);
    cargarAdminsResidencial(residencial.id);
  };

  const seleccionarAdmin = (admin) => {
    setAdminSeleccionado(admin);
    cargarVistasAdmin(admin.id);
  };

  return (
    <div className="gestionar-vistas-container">
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      <div className="gestionar-vistas-header">
        <button className="btn-regresar" onClick={onCancel}>← Regresar</button>
        <h2>👁️ Gestionar Vistas del Sistema</h2>
        <button className="btn-crear-vistas" onClick={crearVistasDefault}>
          ➕ Crear Vistas por Defecto
        </button>
      </div>

      <div className="gestionar-vistas-content">
        <div className="residenciales-section">
          <h3>Seleccionar Entidad</h3>
          <div className="residenciales-grid">
            {residenciales.length === 0 ? (
              <div className="no-residenciales">
                <p>No hay entidades disponibles.</p>
                <p>Crea una entidad primero desde el menú principal.</p>
              </div>
            ) : (
              residenciales.map(residencial => (
                <div 
                  key={residencial.id} 
                  className={`residencial-card ${residencialSeleccionada?.id === residencial.id ? 'selected' : ''}`}
                  onClick={() => seleccionarResidencial(residencial)}>
                  <h4>{residencial.nombre}</h4>
                  <p>{residencial.direccion}</p>
                  <div className="residencial-stats">
                    <span>👤 {residencial.estadisticas.administradores} admins</span>
                    <span>🏠 {residencial.estadisticas.residentes} residentes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {residencialSeleccionada && (
          <div className="vistas-residencial-section">
            <h3>Vistas para: {residencialSeleccionada.nombre}</h3>
            {cargando ? (
              <div className="loading">Cargando vistas...</div>
            ) : (
              <div className="vistas-grid">
                {vistasResidencial.map(vista => (
                  <div key={vista.id} className="vista-card">
                    <div className="vista-info">
                      <h4>{vista.nombre}</h4>
                      <p>{vista.descripcion}</p>
                      <span className={`vista-status ${vista.configurada ? 'configurada' : 'default'}`}>
                        {vista.configurada ? 'Configurada' : 'Por defecto'}
                      </span>
                    </div>
                    <div className="vista-toggle">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={vista.activa}
                          onChange={(e) => toggleVistaResidencial(vista.id, e.target.checked)}/>
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {residencialSeleccionada && adminsResidencial.length > 0 && (
          <div className="admins-section">
            <h3>Administradores de {residencialSeleccionada.nombre}</h3>
            <div className="admins-grid">
              {adminsResidencial.map(admin => (
                <div 
                  key={admin.id} 
                  className={`admin-card ${adminSeleccionado?.id === admin.id ? 'selected' : ''}`}
                  onClick={() => seleccionarAdmin(admin)}>
                  <h4>{admin.nombre}</h4>
                  <p>{admin.email}</p>
                  <span>{admin.telefono}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminSeleccionado && (
          <div className="vistas-admin-section">
            <h3>Vistas para: {adminSeleccionado.nombre}</h3>
            <div className="jerarquia-info">
              <p><strong>Nota:</strong> Las vistas desactivadas a nivel entidad no pueden ser activadas por administradores individuales.</p>
            </div>
            {cargando ? (
              <div className="loading">Cargando vistas...</div>
            ) : (
              <div className="vistas-grid">
                {vistasAdmin.map(vista => (
                  <div key={vista.id} className={`vista-card ${vista.bloqueada_por_residencial ? 'bloqueada' : ''}`}>
                    <div className="vista-info">
                      <h4>{vista.nombre}</h4>
                      <p>{vista.descripcion}</p>
                      <div className="vista-status-container">
                        {vista.bloqueada_por_residencial ? (
                          <span className="vista-status bloqueada">
                            🔒 Bloqueada por Entidad
                          </span>
                        ) : vista.configurada_admin ? (
                          <span className="vista-status configurada">
                            Configurada
                          </span>
                        ) : (
                          <span className="vista-status default">
                            Por defecto
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="vista-toggle">
                      <label className={`switch ${vista.bloqueada_por_residencial ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={vista.activa}
                          disabled={vista.bloqueada_por_residencial}
                          onChange={(e) => toggleVistaAdmin(vista.id, e.target.checked)}/>
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionarVistas;
