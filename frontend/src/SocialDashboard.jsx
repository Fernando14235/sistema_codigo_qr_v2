import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import styles from "./SocialDashboard.module.css";

function SocialDashboard({ token, rol }) {
  const [tab, setTab] = useState(rol === "admin" ? "admin" : "residente");
  const [publicaciones, setPublicaciones] = useState([]);
  const [filtros, setFiltros] = useState({ tipo_publicacion: "", estado: "", fecha: "" });
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
    destinatarios: []
  });
  const [fileList, setFileList] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const isAdmin = rol === "admin";

  // Cargar publicaciones según rol y filtros
  const cargarPublicaciones = async () => {
    setLoading(true); setError("");
    try {
      let url = "";
      if (rol === "admin" && tab === "admin") url = `${API_URL}/social/obtener_social/admin`;
      else url = `${API_URL}/social/obtener_social/residente`;
      const params = {};
      if (filtros.tipo_publicacion) params.tipo_publicacion = filtros.tipo_publicacion;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fecha) params.fecha = filtros.fecha;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setPublicaciones(res.data);
    } catch (err) {
      setError("Error al cargar publicaciones");
    }
    setLoading(false);
  };

  useEffect(() => { cargarPublicaciones(); /* eslint-disable-next-line */ }, [tab, filtros]);

  // Manejo de formulario de creación/edición
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleFileChange = e => setFileList([...e.target.files]);

  const handleCrear = async e => {
    e.preventDefault();
    setMensaje(editId ? "Actualizando publicación..." : "Creando publicación...");
    try {
      const data = new FormData();
      data.append("social_data", JSON.stringify({
        ...formData,
        imagenes: [],
        destinatarios: formData.para_todos ? [] : formData.destinatarios
      }));
      fileList.forEach(f => data.append("imagenes", f));
      if (editId) {
        await axios.put(`${API_URL}/social/actualizar_social/admin/${editId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensaje("¡Publicación actualizada!");
      } else {
        await axios.post(`${API_URL}/social/create_social/admin`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensaje("¡Publicación creada!");
      }
      setShowForm(false);
      setEditId(null);
      setFormData({
        titulo: "",
        contenido: "",
        tipo_publicacion: "comunicado",
        requiere_respuesta: false,
        para_todos: true,
        imagenes: [],
        destinatarios: []
      });
      setFileList([]);
      cargarPublicaciones();
    } catch (err) {
      setMensaje("Error al guardar publicación");
    }
  };

  // Editar publicación
  const handleEditar = pub => {
    setEditId(pub.id);
    setFormData({
      titulo: pub.titulo,
      contenido: pub.contenido,
      tipo_publicacion: pub.tipo_publicacion,
      requiere_respuesta: pub.requiere_respuesta,
      para_todos: pub.para_todos,
      imagenes: [],
      destinatarios: pub.destinatarios || []
    });
    setFileList([]);
    setShowForm(true);
  };

  // Eliminar publicación
  const handleEliminar = async id => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await axios.delete(`${API_URL}/social/eliminar_social/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarPublicaciones();
    } catch {
      alert("Error al eliminar publicación");
    }
  };

  // Iconos para acciones
  const IconVer = () => <span title="Ver" style={{cursor:'pointer'}} role="img" aria-label="ver">🔍</span>;
  const IconEditar = () => <span title="Editar" style={{cursor:'pointer'}} role="img" aria-label="editar">✏️</span>;
  const IconEliminar = () => <span title="Eliminar" style={{cursor:'pointer', color:'#e53935'}} aria-label="eliminar">🗑️</span>;

  // Renderizado de filtros
  const renderFiltros = () => (
    <div className={styles["social-filtros"]} style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
      <select name="tipo_publicacion" value={filtros.tipo_publicacion} onChange={e => setFiltros(f => ({ ...f, tipo_publicacion: e.target.value }))}>
        <option value="">Tipo</option>
        <option value="comunicado">Comunicado</option>
        <option value="publicacion">Publicación</option>
        <option value="encuesta">Encuesta</option>
      </select>
      <select name="estado" value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
        <option value="">Estado</option>
        <option value="publicado">Publicado</option>
        <option value="fallido">Fallido</option>
        <option value="archivado">Archivado</option>
      </select>
      <input type="date" value={filtros.fecha} onChange={e => setFiltros(f => ({ ...f, fecha: e.target.value }))} placeholder="Fecha de publicación" style={{minWidth:120}} />
      {isAdmin && (
        <button style={{marginLeft:8}} onClick={e=>{e.preventDefault(); setShowForm(true); setEditId(null);}}>+ Nueva Publicación</button>
      )}
    </div>
  );

  // Previsualización de imágenes seleccionadas
  const renderPreviewImgs = () => fileList.length > 0 && (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
      {Array.from(fileList).map((file,idx) => (
        <img key={idx} src={URL.createObjectURL(file)} alt="preview" style={{width:60,height:60,objectFit:'cover',borderRadius:6,border:'1px solid #ccc'}} />
      ))}
    </div>
  );

  // Renderizado de publicaciones
  const renderPublicaciones = () => (
    <div>
      {renderFiltros()}
      {loading ? <div>Cargando...</div> : error ? <div style={{ color: "red" }}>{error}</div> : (
        <table className={styles["social-table"]}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {publicaciones.map(pub => (
              <tr key={pub.id}>
                <td>{pub.titulo}</td>
                <td>{pub.tipo_publicacion}</td>
                <td>{pub.estado}</td>
                <td>{new Date(pub.fecha_creacion).toLocaleString()}</td>
                <td className={styles["social-table-actions"]} style={{display:'flex',gap:4}}>
                  <span onClick={() => setDetalle(pub)}><IconVer /></span>
                  {isAdmin && (
                    <>
                      <span onClick={() => handleEditar(pub)}><IconEditar /></span>
                      <span onClick={() => handleEliminar(pub.id)}><IconEliminar /></span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Renderizado de detalle
  const renderDetalle = () => (
    <div className={styles["social-detail-card"]}>
      <h3>{detalle.titulo}</h3>
      <div className={styles["social-detail-row"]}><b>Tipo:</b> {detalle.tipo_publicacion}</div>
      <div className={styles["social-detail-row"]}><b>Estado:</b> {detalle.estado}</div>
      <div className={styles["social-detail-row"]}><b>Contenido:</b> {detalle.contenido}</div>
      <div className={styles["social-detail-row"]}><b>Fecha:</b> {new Date(detalle.fecha_creacion).toLocaleString()}</div>
      <div className={styles["social-detail-row"]}>
        <b>Imágenes:</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {detalle.imagenes?.length > 0 ? detalle.imagenes.map(img => (
            <img key={img.id} src={API_URL + img.imagen_url} alt="img" className={styles["social-detail-img"]} />
          )) : <span style={{color:'#888',marginLeft:8}}>Sin imágenes</span>}
        </div>
      </div>
      <button onClick={() => setDetalle(null)} style={{ marginTop: 12 }}>Cerrar</button>
    </div>
  );

  // Renderizado de formulario de creación/edición
  const renderForm = () => (
    <form onSubmit={handleCrear} className={styles["social-form"]}>
      <h3>{editId ? "Editar Publicación" : "Nueva Publicación"}</h3>
      <label>Título</label>
      <input name="titulo" placeholder="Título" value={formData.titulo} onChange={handleInputChange} required />
      <label>Contenido</label>
      <textarea name="contenido" placeholder="Contenido" value={formData.contenido} onChange={handleInputChange} required />
      <label>Tipo de publicación</label>
      <select name="tipo_publicacion" value={formData.tipo_publicacion} onChange={handleInputChange} required>
        <option value="comunicado">Comunicado</option>
        <option value="publicacion">Publicación</option>
        <option value="encuesta">Encuesta</option>
      </select>
      <label>
        <input type="checkbox" name="requiere_respuesta" checked={formData.requiere_respuesta} onChange={handleInputChange} /> Requiere respuesta (solo para encuesta)
      </label>
      <label>
        <input type="checkbox" name="para_todos" checked={formData.para_todos} onChange={handleInputChange} /> Para todos los residentes
      </label>
      <label>Imágenes</label>
      <input type="file" multiple onChange={handleFileChange} />
      {renderPreviewImgs()}
      <div className={styles["social-form-btns"]}>
        <button type="submit">{editId ? "Actualizar" : "Crear"}</button>
        <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
      </div>
      <div className={styles["mensaje"]}>{mensaje}</div>
    </form>
  );

  return (
    <div className={styles["social-dashboard"]}>
      <h2>Sección Social</h2>
      {showForm && renderForm()}
      {detalle ? renderDetalle() : renderPublicaciones()}
    </div>
  );
}

export default SocialDashboard; 