import React, { useState, useEffect } from "react";
import api from "../../../api";
import CustomPhoneInput from "../../../components/PhoneInput";
import Notification from "../components/Notification";

// Componente para listar administradores
function ListarAdmins({ token, onCancel, onLogout }) {
  const [admins, setAdmins] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [adminEditando, setAdminEditando] = useState(null);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(null);

  useEffect(() => {
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    try {
      const response = await api.get(`/super-admin/listar-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      setNotification({ message: "Error al cargar administradores", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  const handleEditarAdmin = (admin) => {
    setAdminEditando({
      ...admin,
      telefono: admin.telefono || ''
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      const adminData = {
        nombre: adminEditando.nombre,
        email: adminEditando.email,
        telefono: adminEditando.telefono.trim() && adminEditando.telefono.length > 5 ? adminEditando.telefono : "no agregado",
        unidad_residencial: adminEditando.unidad_residencial
      };

      await api.put(`/update_usuarios/admin/${adminEditando.id}`, adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Administrador actualizado exitosamente", type: "success" });
      setAdminEditando(null);
      cargarAdmins();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al actualizar administrador";
      setNotification({ message, type: "error" });
    }
  };

  const handleEliminarAdmin = async (adminId) => {
    try {
      await api.delete(`/delete_usuarios/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Administrador eliminado exitosamente", type: "success" });
      setMostrarModalEliminar(null);
      cargarAdmins();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al eliminar administrador";
      setNotification({ message, type: "error" });
    }
  };

  const handleTelefonoChange = (phone) => {
    setAdminEditando({...adminEditando, telefono: phone});
  };

  if (cargando) {
    return <div className="loading">Cargando administradores...</div>;
  }

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>Administradores del Sistema</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={cargarAdmins}>
            🔄 Actualizar
          </button>
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
              <p><strong>Entidad:</strong> {admin.residencial_nombre}</p>
              <p><strong>Teléfono:</strong> {admin.telefono}</p>
              <p><strong>Unidad:</strong> {admin.unidad_residencial}</p>
              <p><strong>Fecha de creación:</strong> {new Date(admin.fecha_creacion).toLocaleDateString()}</p>
            </div>
            <div className="admin-actions">
              <button 
                className="btn-editar" 
                onClick={() => handleEditarAdmin(admin)}
              >
                ✏️ Editar
              </button>
              <button 
                className="btn-eliminar" 
                onClick={() => setMostrarModalEliminar(admin)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="empty-state">
          <p>No hay administradores registrados</p>
        </div>
      )}

      {/* Modal de edición */}
      {adminEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Administrador</h3>
              <button className="modal-close" onClick={() => setAdminEditando(null)}>×</button>
            </div>
            <form onSubmit={handleGuardarEdicion}>
              <div className="form-group">
                <label>Nombre completo:</label>
                <input
                  type="text"
                  value={adminEditando.nombre}
                  onChange={(e) => setAdminEditando({...adminEditando, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={adminEditando.email}
                  onChange={(e) => setAdminEditando({...adminEditando, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono:</label>
                <CustomPhoneInput
                  value={adminEditando.telefono}
                  onChange={handleTelefonoChange}
                  placeholder="Número de teléfono"
                  required={true}
                />
              </div>
              <div className="form-group">
                <label>Unidad residencial:</label>
                <input
                  type="text"
                  value={adminEditando.unidad_residencial}
                  onChange={(e) => setAdminEditando({...adminEditando, unidad_residencial: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setAdminEditando(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {mostrarModalEliminar && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="modal-close" onClick={() => setMostrarModalEliminar(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar al administrador <strong>{mostrarModalEliminar.nombre}</strong>?</p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setMostrarModalEliminar(null)}>
                Cancelar
              </button>
              <button 
                className="btn-eliminar-confirm" 
                onClick={() => handleEliminarAdmin(mostrarModalEliminar.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

export default ListarAdmins;
