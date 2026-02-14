import React, { useState, useEffect } from "react";
import api from "../../../api";
import { DeleteIcon, EditIcon } from "../components/Icons";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import { handleOrden } from "../utils/helpers";

// --- SUB-COMPONENTES UI MODERNOS ---

// Extrae las iniciales para el Avatar
const getInitials = (nombre) => {
  if (!nombre) return "?";
  const parts = nombre.trim().split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

// Componente para el Avatar
const UserAvatar = ({ nombre }) => (
  <div style={{
    width: "40px", height: "40px", borderRadius: "50%",
    backgroundColor: "#e0e7ff", color: "#4f46e5",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: "14px", flexShrink: 0
  }}>
    {getInitials(nombre)}
  </div>
);

// Componente para las Píldoras de Rol (Badges)
const RoleBadge = ({ rol }) => {
  const baseStyle = {
    padding: "4px 12px", borderRadius: "9999px", fontSize: "12px",
    fontWeight: "600", display: "inline-block", textTransform: "capitalize"
  };
  
  // Colores según el rol
  let colors = { bg: "#f3f4f6", text: "#374151" }; // Default / Otro
  if (rol === "admin") colors = { bg: "#ede9fe", text: "#5b21b6" }; // Morado
  if (rol === "residente") colors = { bg: "#dcfce7", text: "#166534" }; // Verde
  if (rol === "guardia") colors = { bg: "#dbeafe", text: "#1e40af" }; // Azul

  return (
    <span style={{ ...baseStyle, backgroundColor: colors.bg, color: colors.text }}>
      {rol}
    </span>
  );
};

// Subcomponente: Cards móviles (Se mantiene igual, funcional para pantallas pequeñas)
function UsuariosCardsMobile({ usuarios, onEditar, onEliminar }) {
  return (
    <div className="usuarios-cards-mobile">
      {usuarios.map((u) => (
        <div key={u.id} className="usuario-card-mobile">
          <div className="usuario-card-mobile-info">
            <div><b>Nombre:</b> {u.nombre}</div>
            <div><b>Email:</b> {u.email}</div>
            <div><b>Rol:</b> <RoleBadge rol={u.rol} /></div>
            <div><b>Teléfono:</b> {u.telefono || "N/A"}</div>
            {u.unidad_residencial && <div><b>Unidad:</b> {u.unidad_residencial}</div>}
            <div><b>Creado:</b> {new Date(u.fecha_creacion).toLocaleDateString()}</div>
          </div>
          <div className="usuario-card-mobile-actions">
            <span onClick={() => onEliminar(u.id)}><DeleteIcon /></span>
            <span onClick={() => onEditar(u)}><EditIcon /></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

function GestionUsuarios({ token, onCancel, onSelectVista, isVistaDisponible, onNotification }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [ordenUsuarios, setOrdenUsuarios] = useState({
    campo: "nombre",
    asc: true,
  });
  const [pageUsuarios, setPageUsuarios] = useState(1);
  const [totalPagesUsuarios, setTotalPagesUsuarios] = useState(1);
  const limitUsuarios = 15;

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const params = {};
      if (busqueda) params.nombre = busqueda;
      if (filtroRol) params.rol = filtroRol;
      params.orden = ordenUsuarios.campo;
      params.asc = ordenUsuarios.asc;
      params.page = pageUsuarios;
      params.limit = limitUsuarios;

      const res = await api.get(`/usuarios/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.data) {
        setUsuarios(res.data.data);
        setTotalPagesUsuarios(res.data.total_pages);
      } else {
        setUsuarios(res.data);
      }
    } catch {
      onNotification({ message: "Error al cargar usuarios", type: "error" });
    }
  };

  const editarUsuario = (u) => {
    onSelectVista("crear", u);
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await api.delete(`/delete_usuarios/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onNotification({ message: "Usuario eliminado correctamente", type: "success" });
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      onNotification({
        message: error.response?.data?.detail || "Error al eliminar usuario",
        type: "error",
      });
    }
  };

  useEffect(() => {
    setPageUsuarios(1);
  }, [busqueda, filtroRol]);

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, [busqueda, filtroRol, ordenUsuarios, pageUsuarios]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>Usuarios</h3>
        {isVistaDisponible("crear") && (
          <button
            className="btn-primary"
            onClick={() => onSelectVista("crear")}
            style={{ padding: "10px 20px", fontSize: "14px", borderRadius: "8px" }}
          >
            ➕ Crear Usuario
          </button>
        )}
      </div>

      <div className="admin-search" style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", flex: 1 }}
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
        >
          <option value="">Todos los roles</option>
          <option value="residente">Residente</option>
          <option value="guardia">Guardia</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {window.innerWidth < 800 ? (
        <UsuariosCardsMobile
          usuarios={usuarios}
          onEditar={editarUsuario}
          onEliminar={eliminarUsuario}
        />
      ) : (
        /* TABLA MODERNA REFACTORIZADA */
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <tr>
                <th
                  onClick={() => handleOrden("nombre", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)}
                  style={{ padding: "16px", cursor: "pointer", fontSize: "12px", textTransform: "uppercase", color: "#6b7280", fontWeight: "600" }}
                >
                  Usuario {ordenUsuarios.campo === "nombre" && (ordenUsuarios.asc ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleOrden("rol", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)}
                  style={{ padding: "16px", cursor: "pointer", fontSize: "12px", textTransform: "uppercase", color: "#6b7280", fontWeight: "600" }}
                >
                  Rol {ordenUsuarios.campo === "rol" && (ordenUsuarios.asc ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleOrden("unidad_residencial", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)}
                  style={{ padding: "16px", cursor: "pointer", fontSize: "12px", textTransform: "uppercase", color: "#6b7280", fontWeight: "600" }}
                >
                  Ubicación / Contacto {ordenUsuarios.campo === "unidad_residencial" && (ordenUsuarios.asc ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleOrden("fecha_creacion", ordenUsuarios, setOrdenUsuarios, cargarUsuarios)}
                  style={{ padding: "16px", cursor: "pointer", fontSize: "12px", textTransform: "uppercase", color: "#6b7280", fontWeight: "600" }}
                >
                  Registro {ordenUsuarios.campo === "fecha_creacion" && (ordenUsuarios.asc ? "↑" : "↓")}
                </th>
                <th style={{ padding: "16px", fontSize: "12px", textTransform: "uppercase", color: "#6b7280", fontWeight: "600" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {/* Fusión: Nombre + Email */}
                  <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <UserAvatar nombre={u.nombre} />
                    <div>
                      <div style={{ fontWeight: "600", color: "#111827", fontSize: "14px" }}>{u.nombre}</div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>{u.email}</div>
                    </div>
                  </td>
                  
                  {/* Rol en Badge */}
                  <td style={{ padding: "16px" }}>
                    <RoleBadge rol={u.rol} />
                  </td>

                  {/* Fusión: Unidad + Teléfono */}
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: "500", color: "#374151", fontSize: "14px" }}>
                      {u.unidad_residencial || "Sin unidad"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      {u.telefono || "Sin teléfono"}
                    </div>
                  </td>

                  {/* Solo Fecha Creación (simplificada) */}
                  <td style={{ padding: "16px", color: "#4b5563", fontSize: "14px" }}>
                    {new Date(u.fecha_creacion).toLocaleDateString()}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", cursor: "pointer", color: "#6b7280" }}>
                      <span onClick={() => editarUsuario(u)} style={{ color: "#3b82f6" }} title="Editar">
                        <EditIcon />
                      </span>
                      <span onClick={() => eliminarUsuario(u.id)} style={{ color: "#ef4444" }} title="Eliminar">
                        <DeleteIcon />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <PaginationControls
          currentPage={pageUsuarios}
          totalPages={totalPagesUsuarios}
          onPageChange={setPageUsuarios}
        />
      </div>
    </section>
  );
}

export default GestionUsuarios;