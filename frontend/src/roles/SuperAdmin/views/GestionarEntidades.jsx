import React, { useState, useEffect } from "react";
import api from "../../../api";
import Notification from "../components/Notification";

/* ──────────────────────────────────────────────
   Modal de confirmación genérico
────────────────────────────────────────────── */
function ConfirmModal({ visible, mensaje, onConfirm, onCancel, tipo = "danger" }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <p className="modal-mensaje">{mensaje}</p>
        <div className="modal-actions">
          <button
            className={tipo === "danger" ? "btn-danger" : "btn-warning"}
            onClick={onConfirm}
          >
            Confirmar
          </button>
          <button className="btn-regresar" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Modal de edición
────────────────────────────────────────────── */
function EditarModal({ visible, entidad, onSave, onCancel }) {
  const [form, setForm] = useState({ nombre: "", direccion: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (entidad) setForm({ nombre: entidad.nombre, direccion: entidad.direccion });
  }, [entidad]);

  if (!visible || !entidad) return null;

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await onSave(entidad.id, form);
    setGuardando(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box modal-box--wide">
        <h3 className="modal-title">✏️ Editar Entidad</h3>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label htmlFor="edit-nombre">Nombre</label>
          <input
            id="edit-nombre"
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-direccion">Dirección</label>
          <input
            id="edit-direccion"
            type="text"
            value={form.direccion}
            onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-primary" onClick={handleSave} disabled={guardando}>
            {guardando ? "Guardando…" : "💾 Guardar"}
          </button>
          <button className="btn-regresar" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vista principal: Gestionar Entidades
────────────────────────────────────────────── */
function GestionarEntidades({ token, onCancel, onSelectVista }) {
  const [entidades, setEntidades] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // Modales
  const [editando, setEditando] = useState(null);
  const [confirm, setConfirm] = useState({ visible: false, tipo: "", entidad: null });

  useEffect(() => {
    cargarEntidades();
  }, []);

  useEffect(() => {
    let resultado = [...entidades];
    if (busqueda.trim()) {
      resultado = resultado.filter(
        (e) =>
          e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          e.direccion.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    if (filtroEstado === "activas") resultado = resultado.filter((e) => e.activa);
    if (filtroEstado === "suspendidas") resultado = resultado.filter((e) => !e.activa);
    setFiltradas(resultado);
  }, [busqueda, filtroEstado, entidades]);

  const cargarEntidades = async () => {
    setCargando(true);
    try {
      const res = await api.get("/super-admin/listar-residenciales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntidades(res.data);
    } catch {
      setNotification({ message: "Error al cargar entidades", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  const notify = (message, type = "success") => setNotification({ message, type });

  /* ── Acciones ── */
  const handleEditar = async (id, datos) => {
    try {
      await api.put(`/super-admin/entidades/${id}`, datos, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify("Entidad actualizada correctamente");
      setEditando(null);
      cargarEntidades();
    } catch (err) {
      notify(err.response?.data?.detail || "Error al actualizar", "error");
    }
  };

  const handleToggleEstatus = async (entidad) => {
    try {
      const nuevoEstado = !entidad.activa;
      await api.patch(
        `/super-admin/entidades/${entidad.id}/estatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { activa: nuevoEstado },
        }
      );
      notify(
        nuevoEstado ? "Entidad reactivada correctamente" : "Entidad suspendida correctamente"
      );
      setConfirm({ visible: false, tipo: "", entidad: null });
      cargarEntidades();
    } catch (err) {
      notify(err.response?.data?.detail || "Error al cambiar estatus", "error");
    }
  };

  const handleEliminar = async (entidad) => {
    try {
      await api.delete(`/super-admin/entidades/${entidad.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify("Entidad eliminada correctamente");
      setConfirm({ visible: false, tipo: "", entidad: null });
      cargarEntidades();
    } catch (err) {
      notify(err.response?.data?.detail || "No se puede eliminar esta entidad", "error");
    }
  };

  const abrirConfirm = (tipo, entidad) => setConfirm({ visible: true, tipo, entidad });

  const handleConfirm = () => {
    if (confirm.tipo === "toggle") handleToggleEstatus(confirm.entidad);
    if (confirm.tipo === "eliminar") handleEliminar(confirm.entidad);
  };

  return (
    <div className="super-admin-section">
      <div className="section-header">
        <h2>🏢 Gestionar Entidades</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={cargarEntidades}>
            🔄 Actualizar
          </button>
          <button className="btn-regresar" onClick={onCancel}>
            ← Regresar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-row">
          <div className="filtro-group">
            <label htmlFor="search-entidad">Buscar entidad</label>
            <input
              id="search-entidad"
              type="text"
              placeholder="Nombre o dirección…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filtro-group">
            <label htmlFor="filtro-estado">Estado</label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="suspendidas">Suspendidas</option>
            </select>
          </div>
          <div className="filtro-actions">
            <button
              className="btn-limpiar-filtros"
              onClick={() => { setBusqueda(""); setFiltroEstado("todas"); }}
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="loading">Cargando entidades…</div>
      ) : (
        <>
          <div className="residenciales-grid">
            {filtradas.map((entidad) => (
              <div
                key={entidad.id}
                className={`residencial-card ${!entidad.activa ? "card-suspendida" : ""}`}
              >
                <div className="residencial-header">
                  <h3>{entidad.nombre}</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      className={`badge-estado ${entidad.activa ? "badge-activo" : "badge-suspendido"}`}
                    >
                      {entidad.activa ? "Activa" : "Suspendida"}
                    </span>
                    <span className="residencial-id">ID: {entidad.id}</span>
                  </div>
                </div>

                <div className="residencial-info">
                  <p><strong>Dirección:</strong> {entidad.direccion}</p>
                  <p><strong>Tipo:</strong> {entidad.tipo_entidad ?? "—"}</p>
                  <p>
                    <strong>Creada:</strong>{" "}
                    {new Date(entidad.fecha_creacion).toLocaleDateString("es-HN")}
                  </p>
                </div>

                {entidad.estadisticas && (
                  <div className="residencial-stats">
                    <div className="stat-item">
                      <span className="stat-number">{entidad.estadisticas.administradores}</span>
                      <span className="stat-label">Admins</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{entidad.estadisticas.residentes}</span>
                      <span className="stat-label">Residentes</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{entidad.estadisticas.guardias}</span>
                      <span className="stat-label">Guardias</span>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="entidad-actions">
                  <button
                    className="btn-action btn-edit"
                    aria-label={`Editar ${entidad.nombre}`}
                    onClick={() => setEditando(entidad)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={`btn-action ${entidad.activa ? "btn-suspend" : "btn-activate"}`}
                    aria-label={entidad.activa ? "Suspender" : "Reactivar"}
                    onClick={() => abrirConfirm("toggle", entidad)}
                  >
                    {entidad.activa ? "⏸ Suspender" : "▶ Reactivar"}
                  </button>
                  <button
                    className="btn-action btn-ver-usuarios"
                    style={{ marginTop: 0 }}
                    aria-label="Ver usuarios"
                    onClick={() =>
                      onSelectVista("usuarios-residencial", { residencialId: entidad.id })
                    }
                  >
                    👥 Usuarios
                  </button>
                  <button
                    className="btn-action btn-danger"
                    aria-label={`Eliminar ${entidad.nombre}`}
                    onClick={() => abrirConfirm("eliminar", entidad)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtradas.length === 0 && (
            <div className="empty-state">
              <p>No hay entidades que coincidan con los filtros aplicados.</p>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      <EditarModal
        visible={!!editando}
        entidad={editando}
        onSave={handleEditar}
        onCancel={() => setEditando(null)}
      />

      <ConfirmModal
        visible={confirm.visible}
        tipo={confirm.tipo === "eliminar" ? "danger" : "warning"}
        mensaje={
          confirm.tipo === "eliminar"
            ? `¿Seguro que deseas eliminar "${confirm.entidad?.nombre}"? Esta acción no se puede deshacer.`
            : confirm.entidad?.activa
            ? `¿Suspender "${confirm.entidad?.nombre}"? Sus usuarios no podrán iniciar sesión.`
            : `¿Reactivar "${confirm.entidad?.nombre}"?`
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ visible: false, tipo: "", entidad: null })}
      />

      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

export default GestionarEntidades;
