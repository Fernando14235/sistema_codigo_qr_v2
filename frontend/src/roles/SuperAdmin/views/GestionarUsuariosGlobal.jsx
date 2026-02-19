import React, { useState, useEffect, useCallback } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

/* ──────────────────────────────────────────────
   Modal: Reset de Contraseña
────────────────────────────────────────────── */
function ResetPasswordModal({ visible, usuario, onConfirm, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) { setPassword(""); setConfirmPass(""); setError(""); }
  }, [visible]);

  if (!visible || !usuario) return null;

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);
    await onConfirm(usuario.id, password);
    setGuardando(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box modal-box--wide">
        <h3 className="modal-title">🔑 Restablecer Contraseña</h3>
        <p style={{ color: "#4a5568", marginBottom: 16 }}>
          Usuario: <strong>{usuario.nombre}</strong> ({usuario.email})
        </p>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label htmlFor="new-pass">Nueva contraseña</label>
          <input
            id="new-pass"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            autoComplete="new-password"
            spellCheck={false}
            placeholder="Mínimo 6 caracteres…"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-pass">Confirmar contraseña</label>
          <input
            id="confirm-pass"
            type="password"
            value={confirmPass}
            onChange={(e) => { setConfirmPass(e.target.value); setError(""); }}
            autoComplete="new-password"
            spellCheck={false}
            placeholder="Repetir contraseña…"
          />
        </div>
        {error && (
          <p style={{ color: "#e53e3e", fontSize: "0.9em", marginTop: 8 }}
             role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? "Guardando…" : "🔑 Restablecer"}
          </button>
          <button className="btn-regresar" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vista principal: Gestionar Usuarios Global
────────────────────────────────────────────── */
const ROL_LABEL = {
  admin: "Admin",
  residente: "Residente",
  guardia: "Guardia",
  super_admin: "Super Admin",
};

function GestionarUsuariosGlobal({ token, onCancel }) {
  const [usuarios, setUsuarios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [resetModal, setResetModal] = useState({ visible: false, usuario: null });
  const [cambiandoEstado, setCambiandoEstado] = useState(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/super-admin/usuarios/listar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(res.data);
    } catch {
      setNotification({ message: "Error al cargar usuarios", type: "error" });
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  useEffect(() => {
    let res = [...usuarios];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      res = res.filter(
        (u) => u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    if (filtroRol !== "todos") res = res.filter((u) => u.rol === filtroRol);
    if (filtroEstado === "activos") res = res.filter((u) => u.activo !== false);
    if (filtroEstado === "inactivos") res = res.filter((u) => u.activo === false);
    setFiltrados(res);
  }, [busqueda, filtroRol, filtroEstado, usuarios]);

  const notify = (message, type = "success") => setNotification({ message, type });

  const handleToggleEstado = async (usuario) => {
    setCambiandoEstado(usuario.id);
    try {
      const nuevoEstado = !usuario.activo;
      await api.patch(
        `/super-admin/usuarios/${usuario.id}/estatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { activo: nuevoEstado },
        }
      );
      notify(nuevoEstado ? "Usuario activado" : "Usuario desactivado");
      cargarUsuarios();
    } catch (err) {
      notify(err.response?.data?.detail || "Error al cambiar estado", "error");
    } finally {
      setCambiandoEstado(null);
    }
  };

  const handleResetPassword = async (id, nuevaPassword) => {
    try {
      await api.post(
        `/super-admin/usuarios/${id}/reset-password`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { password: nuevaPassword },
        }
      );
      notify("Contraseña restablecida correctamente");
      setResetModal({ visible: false, usuario: null });
    } catch (err) {
      notify(err.response?.data?.detail || "Error al restablecer contraseña", "error");
    }
  };

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroRol("todos"); setFiltroEstado("todos");
  };

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>👥 Gestionar Usuarios</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={cargarUsuarios}>🔄 Actualizar</button>
          <button className="btn-regresar" onClick={onCancel}>← Regresar</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-row filtros-row--4col">
          <div className="filtro-group">
            <label htmlFor="search-usuario">Buscar usuario</label>
            <input
              id="search-usuario"
              type="text"
              placeholder="Nombre o email…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filtro-group">
            <label htmlFor="filtro-rol">Rol</label>
            <select id="filtro-rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="todos">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="residente">Residente</option>
              <option value="guardia">Guardia</option>
            </select>
          </div>
          <div className="filtro-group">
            <label htmlFor="filtro-estado-u">Estado</label>
            <select
              id="filtro-estado-u"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
          <div className="filtro-actions">
            <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              🗑️ Limpiar
            </button>
          </div>
        </div>
        <p className="filtros-count">
          Mostrando {filtrados.length} de {usuarios.length} usuarios
        </p>
      </div>

      {cargando ? (
        <div className="loading">Cargando usuarios…</div>
      ) : (
        <>
          <div className="usuarios-global-table-wrapper">
            <table className="usuarios-global-table" aria-label="Listado de usuarios">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Entidad</th>
                  <th>Última Conexión</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.id} className={!u.activo ? "row-inactiva" : ""}>
                    <td className="td-id">{u.id}</td>
                    <td className="td-nombre">{u.nombre}</td>
                    <td className="td-email">{u.email}</td>
                    <td>
                      <span className={`badge-rol badge-rol--${u.rol}`}>
                        {ROL_LABEL[u.rol] ?? u.rol}
                      </span>
                    </td>
                    <td className="td-entidad">{u.residencial?.nombre ?? "—"}</td>
                    <td className="td-conexion">
                      {u.ult_conexion
                        ? new Date(u.ult_conexion).toLocaleString("es-HN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Nunca"}
                    </td>
                    <td>
                      <span
                        className={`badge-estado ${
                          u.activo !== false ? "badge-activo" : "badge-suspendido"
                        }`}
                      >
                        {u.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        className={`btn-action-sm ${
                          u.activo !== false ? "btn-suspend" : "btn-activate"
                        }`}
                        aria-label={u.activo !== false ? "Desactivar usuario" : "Activar usuario"}
                        disabled={cambiandoEstado === u.id}
                        onClick={() => handleToggleEstado(u)}
                      >
                        {cambiandoEstado === u.id ? "…" : u.activo !== false ? "⏸" : "▶"}
                      </button>
                      <button
                        className="btn-action-sm btn-edit"
                        aria-label="Restablecer contraseña"
                        onClick={() => setResetModal({ visible: true, usuario: u })}
                      >
                        🔑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtrados.length === 0 && (
            <div className="empty-state">
              <p>No hay usuarios que coincidan con los filtros aplicados.</p>
            </div>
          )}
        </>
      )}

      <ResetPasswordModal
        visible={resetModal.visible}
        usuario={resetModal.usuario}
        onConfirm={handleResetPassword}
        onCancel={() => setResetModal({ visible: false, usuario: null })}
      />

      <Notification
        {...notification}
        onClose={() => setNotification({ message: "", type: "" })}
      />
    </div>
  );
}

export default GestionarUsuariosGlobal;
