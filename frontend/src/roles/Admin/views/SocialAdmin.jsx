import React, { useState, useEffect } from "react";
import api from "../../../api";
import styles from "../../../SocialDashboard.module.css";
import BtnRegresar from "../components/BtnRegresar";
import SocialFilters from "./subcomponents/SocialFilters";
import SocialList from "./subcomponents/SocialList";
import SocialDetail from "./subcomponents/SocialDetail";
import SocialForm from "./subcomponents/SocialForm";

function SocialAdmin({ token, onCancel }) {
  const [tab, setTab] = useState("admin"); // 'admin' o 'residente'
  const [publicaciones, setPublicaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo_publicacion: "",
    estado: "",
    fecha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    contenido: "",
    tipo_publicacion: "comunicado",
    requiere_respuesta: false,
    para_todos: true,
    imagenes: [],
    destinatarios: [],
  });
  const [mensaje, setMensaje] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  // Cargar publicaciones
  const cargarPublicaciones = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `/social/obtener_social/admin`;

      const params = {};
      if (filtros.tipo_publicacion)
        params.tipo_publicacion = filtros.tipo_publicacion;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fecha) params.fecha = filtros.fecha;

      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = res.data.data || res.data;
      let finalData = Array.isArray(data) ? data : [];
      
      // Si estamos en la pestaña de residentes, filtrar por las que son para todos
      if (tab === "residente") {
        finalData = finalData.filter(p => p.para_todos);
      }
      
      setPublicaciones(finalData);
    } catch (err) {
      setError("Error al cargar publicaciones");
      setPublicaciones([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPublicaciones();
    // eslint-disable-next-line
  }, [tab, filtros]);

  // Manejar edición
  const handleEditar = (pub) => {
    setEditId(pub.id);
    setFormData({
      titulo: pub.titulo,
      contenido: pub.contenido,
      tipo_publicacion: pub.tipo_publicacion,
      requiere_respuesta: pub.requiere_respuesta,
      para_todos: pub.para_todos,
      imagenes: [],
      destinatarios: pub.destinatarios || [],
    });
    setShowForm(true);
  };

  // Manejar eliminación
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?"))
      return;
    try {
      await api.delete(`/social/eliminar_social/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarPublicaciones();
    } catch {
      alert("Error al eliminar publicación");
    }
  };

  if (showForm) {
    return (
      <section className="admin-section">
        <BtnRegresar
          onClick={() => {
            setShowForm(false);
            setEditId(null);
          }}
        />
        <SocialForm
          token={token}
          editId={editId}
          initialData={formData}
          onSuccess={() => {
            setShowForm(false);
            setEditId(null);
            cargarPublicaciones();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditId(null);
          }}
          existingImages={editId ? publicaciones.find(p => p.id === editId)?.imagenes : []}
        />
      </section>
    );
  }

  if (detalle) {
    return (
      <section className="admin-section">
        <BtnRegresar onClick={() => setDetalle(null)} />
        <SocialDetail
          detalle={detalle}
          token={token}
          rol="admin"
          onClose={() => setDetalle(null)}
        />
      </section>
    );
  }

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <div className={styles["social-dashboard"]}>
        <h2>Sección Social (Admin)</h2>

        {/* Tabs para cambiar entre publicaciones de Admin y Residentes */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            borderBottom: "2px solid #e3eafc",
            paddingBottom: 10,
          }}
        >
          <button
            onClick={() => setTab("admin")}
            className={tab === "admin" ? "btn-primary" : "btn-secondary"}
            style={{ flex: 1 }}
          >
            Mis Publicaciones
          </button>
          <button
            onClick={() => setTab("residente")}
            className={tab === "residente" ? "btn-primary" : "btn-secondary"}
            style={{ flex: 1 }}
          >
            Ver Publicaciones Residentes
          </button>
        </div>

        <SocialFilters
          filtros={filtros}
          setFiltros={setFiltros}
          onNew={() => {
            setEditId(null);
            setFormData({
              titulo: "",
              contenido: "",
              tipo_publicacion: "comunicado",
              requiere_respuesta: false,
              para_todos: true,
              imagenes: [],
              destinatarios: [],
            });
            setShowForm(true);
          }}
          showNewBtn={tab === "admin"}
        />

        {loading ? (
          <p style={{ textAlign: "center" }}>Cargando publicaciones...</p>
        ) : (
          <SocialList
            publicaciones={publicaciones}
            onVerDetalle={setDetalle}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            isAdmin={true}
            isOwnTab={tab === "admin"}
          />
        )}
      </div>
    </section>
  );
}

export default SocialAdmin;
