import React, { useState, useEffect } from "react";
import api from "../../../api";
import CustomPhoneInput from "../../../components/PhoneInput";
import Notification from "../components/Notification";

// Componente para crear administradores
function CrearAdmin({ token, onAdminCreado, onCancel, onNotification }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    unidad_residencial: "",
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
      const response = await api.get(`/super-admin/listar-residenciales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidenciales(response.data);
    } catch (error) {
      setNotification({ message: "Error al cargar residenciales", type: "error" });
    }
  };

  const handleTelefonoChange = (phone) => {
    setFormData({...formData, telefono: phone});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setNotification({ message: "Creando administrador...", type: "info" });

    try {
      const adminData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono.trim() && formData.telefono.length > 5 ? formData.telefono : "no agregado",
        password: formData.password,
        unidad_residencial: formData.unidad_residencial,
        rol: "admin"
      };

      await api.post(`/super-admin/crear-admin-residencial/${parseInt(formData.residencial_id)}`, adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Administrador creado exitosamente", type: "success" });
      setFormData({ nombre: "", email: "", password: "", telefono: "", unidad_residencial: "", residencial_id: "" });
      
      // Mostrar notificación global también
      if (onNotification) onNotification({ message: "Administrador creado exitosamente", type: "success" });
      
      // Redirigir automáticamente a la lista de administradores después de 1.5 segundos
      setTimeout(() => {
        onAdminCreado();
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear administrador";
      setNotification({ message, type: "error" });
      // Mostrar error global también
      if (onNotification) onNotification({ message, type: "error" });
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
            <label>Teléfono:</label>
            <CustomPhoneInput
              value={formData.telefono}
              onChange={handleTelefonoChange}
              placeholder="Número de teléfono"
              required={true}
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
              <option value="">Seleccionar entidad</option>
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
            {cargando ? (
              <>
                <span className="spinner"></span>
                Creando administrador...
              </>
            ) : (
              "Crear Administrador"
            )}
          </button>
        </div>
      </form>

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

export default CrearAdmin;
