import React, { useState, useEffect } from "react";
import api from "../../../api";
import { DeleteIcon, EditIcon } from "../components/Icons";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import { handleOrden } from "../utils/helpers";

// Subcomponente: Cards móviles para usuarios
function UsuariosCardsMobile({ usuarios, onEditar, onEliminar }) {
  return (
    <div className="usuarios-cards-mobile">
      {usuarios.map((u) => (
        <div key={u.id} className="usuario-card-mobile">
          <div className="usuario-card-mobile-info">
            <div>
              <b>Nombre:</b> {u.nombre}
            </div>
            <div>
              <b>Email:</b> {u.email}
            </div>
            <div>
              <b>Rol:</b> {u.rol}
            </div>
            <div>
              <b>Teléfono:</b> {u.telefono || "N/A"}
            </div>
            {u.unidad_residencial && (
              <div>
                <b>Unidad:</b> {u.unidad_residencial}
              </div>
            )}
            <div>
              <b>Creado:</b> {new Date(u.fecha_creacion).toLocaleDateString()}
            </div>
          </div>
          <div className="usuario-card-mobile-actions">
            <span onClick={() => onEliminar(u.id)}>
              <DeleteIcon />
            </span>
            <span onClick={() => onEditar(u)}>
              <EditIcon />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

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

  // Cargar usuarios con filtros y orden
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

  // Editar usuario
  const editarUsuario = (u) => {
    onSelectVista("crear", u);
  };

  // Eliminar usuario
  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await api.delete(`/delete_usuarios/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onNotification({
        message: "Usuario eliminado correctamente",
        type: "success",
      });
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      onNotification({
        message: error.response?.data?.detail || "Error al eliminar usuario",
        type: "error",
      });
    }
  };

  // Effects to reset pagination when filters change
  useEffect(() => {
    setPageUsuarios(1);
  }, [busqueda, filtroRol]);

  // Effects to fetch data when page changes
  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, [busqueda, filtroRol, ordenUsuarios, pageUsuarios]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3>Usuarios</h3>
        {isVistaDisponible("crear") && (
          <button
            className="btn-primary"
            onClick={() => onSelectVista("crear")}
            style={{ padding: "10px 20px", fontSize: "14px" }}
          >
            ➕ Crear Usuario
          </button>
        )}
      </div>
      <div className="admin-search">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
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
        <table className="admin-table">
          <thead>
            <tr>
              <th
                onClick={() =>
                  handleOrden(
                    "nombre",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Nombre {ordenUsuarios.campo === "nombre" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "email",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Email {ordenUsuarios.campo === "email" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "rol",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Rol {ordenUsuarios.campo === "rol" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th>Teléfono</th>
              <th
                onClick={() =>
                  handleOrden(
                    "unidad_residencial",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Unidad Residencial{" "}
                {ordenUsuarios.campo === "unidad_residencial" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "fecha_creacion",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Fecha Creación {ordenUsuarios.campo === "fecha_creacion" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th
                onClick={() =>
                  handleOrden(
                    "fecha_actualizacion",
                    ordenUsuarios,
                    setOrdenUsuarios,
                    cargarUsuarios
                  )
                }
                style={{ cursor: "pointer" }}
              >
                Fecha Actualización{" "}
                {ordenUsuarios.campo === "fecha_actualizacion" && (ordenUsuarios.asc ? "↑" : "↓")}
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td>{u.telefono || "N/A"}</td>
                <td>{u.unidad_residencial || "-"}</td>
                <td>{new Date(u.fecha_creacion).toLocaleDateString()}</td>
                <td>
                  {u.fecha_actualizacion
                    ? new Date(u.fecha_actualizacion).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <span onClick={() => eliminarUsuario(u.id)}>
                    <DeleteIcon />
                  </span>
                  <span onClick={() => editarUsuario(u)}>
                    <EditIcon />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PaginationControls
        currentPage={pageUsuarios}
        totalPages={totalPagesUsuarios}
        onPageChange={setPageUsuarios}
      />
    </section>
  );
}

export default GestionUsuarios;
