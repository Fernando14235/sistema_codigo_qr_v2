import React, { useState } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

// Componente para crear residenciales
function CrearResidencial({ token, onResidencialCreada, onCancel, onLogout }) {
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    tipo_entidad: "residencial"
  });
  const [cargando, setCargando] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setNotification({ message: "", type: "" });

    try {
      await api.post(`/residenciales/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ message: "Residencial creada exitosamente", type: "success" });
      setFormData({ nombre: "", direccion: "", tipo_entidad: "residencial" });
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
          <div className="form-group">
            <label>Tipo de Entidad:</label>
            <select
              value={formData.tipo_entidad}
              onChange={(e) => setFormData({...formData, tipo_entidad: e.target.value})}
              required
            >
              <option value="residencial">Residencial</option>
              <option value="predio">Predio</option>
              <option value="industrial">Industrial</option>
              <option value="instituto">Instituto</option>
              <option value="empresa">Empresa</option>
            </select>
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

export default CrearResidencial;
