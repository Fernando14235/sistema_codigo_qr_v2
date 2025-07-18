import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import styles from "./SocialDashboard.module.css";
import Select from "react-select";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

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
  const [residentes, setResidentes] = useState([]);
  const [opcionesEncuesta, setOpcionesEncuesta] = useState([""]);
  const [votoRealizado, setVotoRealizado] = useState(null);
  const [resultadosEncuesta, setResultadosEncuesta] = useState(null);
  // Estado para detalle de encuesta
  const [detalleEncuestaId, setDetalleEncuestaId] = useState(null);
  const [detalleEncuesta, setDetalleEncuesta] = useState(null);
  const [detalleVotoRealizado, setDetalleVotoRealizado] = useState(null);
  const [detalleResultados, setDetalleResultados] = useState(null);
  const [detalleMensaje, setDetalleMensaje] = useState("");
  const [adminNombre, setAdminNombre] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  // Estado para controlar si se elimina la imagen existente
  const [eliminarImagen, setEliminarImagen] = useState(false);

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

  // Cargar residentes si el admin quiere seleccionar destinatarios o ver detalle
  useEffect(() => {
    if (isAdmin && ((showForm && !formData.para_todos) || detalle)) {
      axios.get(`${API_URL}/usuarios/residentes_full`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setResidentes(res.data))
      .catch(() => setResidentes([]));
    }
  }, [isAdmin, showForm, formData.para_todos, detalle, token]);

  useEffect(() => { cargarPublicaciones(); /* eslint-disable-next-line */ }, [tab, filtros]);

  // Manejo de formulario de creación/edición
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === "tipo_publicacion") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        requiere_respuesta: value === "encuesta"
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };
  const handleFileChange = e => setFileList([...e.target.files]);

  // Manejo de selección múltiple de destinatarios con react-select
  const handleDestinatariosChange = selectedOptions => {
    const selected = (selectedOptions || []).map(opt => ({ residente_id: opt.value }));
    setFormData(prev => ({ ...prev, destinatarios: selected }));
  };

  // Opciones para react-select
  const residentesOptions = residentes.map(r => ({
    value: r.residente_id || r.id,
    label: `${r.nombre} (${r.unidad_residencial || 'Sin unidad'})`
  }));

  // Manejo de opciones de encuesta (solo frontend)
  const handleOpcionesEncuestaChange = (idx, val) => {
    setOpcionesEncuesta(prev => prev.map((op, i) => i === idx ? val : op));
  };
  const handleAgregarOpcion = () => setOpcionesEncuesta(prev => [...prev, ""]);
  const handleEliminarOpcion = idx => setOpcionesEncuesta(prev => prev.filter((_, i) => i !== idx));

  // Al abrir el form, limpiar opciones si no es encuesta
  useEffect(() => {
    if (showForm && formData.tipo_publicacion !== "encuesta") setOpcionesEncuesta([""]);
  }, [showForm, formData.tipo_publicacion]);

  const handleCrear = async e => {
    e.preventDefault();
    // Validar que si no es para todos, debe tener destinatarios
    if (!formData.para_todos && (!formData.destinatarios || formData.destinatarios.length === 0)) {
      setMensaje("Error: Si la publicación no es para todos, debe seleccionar al menos un destinatario");
      return;
    }
    setMensaje(editId ? "Actualizando publicación..." : "Creando publicación...");
    setBloqueado(true);
    try {
      // Forzar el formato correcto de destinatarios
      const destinatariosFormateados = formData.para_todos ? [] : formData.destinatarios.map(d => ({ residente_id: d.residente_id }));
      // Manejar internamente requiere_respuesta
      const requiere_respuesta = formData.tipo_publicacion === "encuesta";
      
      // Preparar opciones de encuesta si es una encuesta
      const opciones = formData.tipo_publicacion === "encuesta" ? 
        opcionesEncuesta.filter(op => op.trim() !== "").map(op => ({ texto: op.trim() })) : [];
      
      const socialData = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        tipo_publicacion: formData.tipo_publicacion,
        requiere_respuesta,
        para_todos: formData.para_todos,
        destinatarios: destinatariosFormateados.length > 0 ? destinatariosFormateados : undefined,
        opciones: opciones.length > 0 ? opciones : undefined
      };
      const data = new FormData();
      data.append("social_data", JSON.stringify(socialData));
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
        setOpcionesEncuesta([""]);
      }
      cargarPublicaciones();
      // Redirigir a la sección principal de Social
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setMensaje("Error: " + err.response.data.detail);
      } else {
        setMensaje("Error al guardar publicación");
      }
    }
    setBloqueado(false);
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
    setEliminarImagen(false);
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
  const renderPublicaciones = () => {
    const isMobile = window.innerWidth < 700;
    if (!publicaciones || publicaciones.length === 0) {
      // Si es admin, solo mostrar el botón de nueva publicación
      if (isAdmin && !showForm) {
        return (
          <div style={{ textAlign: 'left', marginTop: 24 }}>
            <button style={{marginLeft:0}} onClick={e=>{e.preventDefault(); setShowForm(true); setEditId(null);}} className="btn-primary">+ Nueva Publicación</button>
            <p style={{ textAlign: 'center', color: '#888', fontWeight: 'bold', fontSize: '1.1em', marginTop: 32 }}>No hay publicaciones</p>
          </div>
        );
      }
      // Si no es admin, solo mostrar el mensaje
      return <p style={{ textAlign: 'center', color: '#888', fontWeight: 'bold', fontSize: '1.1em' }}>No hay publicaciones</p>;
    }
    return (
      <div>
        {/* Mostrar filtros y botón de nueva publicación siempre para admin */}
        {isAdmin && !showForm && renderFiltros()}
        {isMobile ? (
          <div className="social-cards-mobile">
            {publicaciones.map(pub => (
              <div className="social-card-mobile" key={pub.id} style={pub.estado === "fallido" ? {backgroundColor: "#ffebee"} : {}}>
                <div className="social-card-mobile-info">
                  <div><b>Título:</b> {pub.titulo}</div>
                  <div><b>Tipo:</b> {pub.tipo_publicacion}</div>
                  <div><b>Estado:</b> <span style={{ color: pub.estado === "fallido" ? "#d32f2f" : pub.estado === "publicado" ? "#2e7d32" : "#f57c00", fontWeight: "bold" }}>{pub.estado}</span></div>
                  <div><b>Fecha:</b> {new Date(pub.fecha_creacion).toLocaleString()}</div>
                </div>
                <div className="social-card-mobile-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 8 }}>
                  <span onClick={() => setDetalle(pub)}><IconVer /></span>
                  {isAdmin && (
                    <>
                      <span onClick={() => handleEditar(pub)}><IconEditar /></span>
                      <span onClick={() => handleEliminar(pub.id)}><IconEliminar /></span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                <tr key={pub.id} style={pub.estado === "fallido" ? {backgroundColor: "#ffebee"} : {}}>
                  <td>{pub.titulo}</td>
                  <td>{pub.tipo_publicacion}</td>
                  <td>
                    <span style={{
                      color: pub.estado === "fallido" ? "#d32f2f" : 
                             pub.estado === "publicado" ? "#2e7d32" : "#f57c00",
                      fontWeight: "bold"
                    }}>
                      {pub.estado}
                    </span>
                  </td>
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
  };

  // useEffect para cargar detalle de encuesta, voto y resultados
  useEffect(() => {
    if (detalle && detalle.tipo_publicacion === "encuesta") {
      setDetalleEncuestaId(detalle.id);
      setDetalleEncuesta(detalle);
      setDetalleMensaje("");
      setDetalleVotoRealizado(null);
      setDetalleResultados(null);
      if (rol === "admin") cargarResultadosEncuesta(detalle.id).then();
      if (rol === "residente" && detalle.votos && detalle.votos.length > 0) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const miVoto = detalle.votos.find(v => v.residente_id === tokenData.user_id);
          if (miVoto) setDetalleVotoRealizado(miVoto.opcion_id);
        } catch {}
      }
    } else {
      setDetalleEncuestaId(null);
      setDetalleEncuesta(null);
      setDetalleVotoRealizado(null);
      setDetalleResultados(null);
      setDetalleMensaje("");
    }
    // eslint-disable-next-line
  }, [detalle]);

  // Obtener el nombre del admin cuando se abre el detalle
  useEffect(() => {
    if (detalle && detalle.admin_id) {
      axios.get(`${API_URL}/usuarios/usuario_nombre/${detalle.admin_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setAdminNombre(res.data.nombre))
      .catch(() => setAdminNombre(""));
    } else {
      setAdminNombre("");
    }
  }, [detalle, token]);

  // Votar en encuesta (solo residentes)
  const votarEnEncuesta = async (socialId, opcionId) => {
    setDetalleMensaje("Enviando voto...");
    try {
      await axios.post(`${API_URL}/social/votar/residente/${socialId}`, { opcion_id: opcionId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetalleMensaje("¡Voto registrado!");
      setDetalleVotoRealizado(opcionId);
      cargarPublicaciones();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setDetalleMensaje("Error: " + err.response.data.detail);
      } else {
        setDetalleMensaje("Error al votar");
      }
    }
  };

  // Cargar resultados de encuesta (admin)
  const cargarResultadosEncuesta = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/social/resultados/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResultadosEncuesta(res.data);
    } catch {
      setResultadosEncuesta(null);
    }
  };

  // Renderizado de detalle
  const renderDetalle = () => (
    <div className={styles["social-detail-card"]}>
      <h3>{detalle.titulo}</h3>
      <div className={styles["social-detail-row"]}>
        <b>Creado por:</b>{adminNombre ? ` ${adminNombre}` : ""}
      </div>
      <div className={styles["social-detail-row"]}><b>Tipo:</b> {detalle.tipo_publicacion}</div>
      <div className={styles["social-detail-row"]}>
        <b>Estado:</b> 
        <span style={{
          color: detalle.estado === "fallido" ? "#d32f2f" : 
                 detalle.estado === "publicado" ? "#2e7d32" : "#f57c00",
          fontWeight: "bold",
          marginLeft: "8px"
        }}>
          {detalle.estado}
        </span>
      </div>
      {/* Solo mostrar destinatarios si es admin */}
      {rol === "admin" && (
        <div className={styles["social-detail-row"]}>
          <b>Destinatarios:</b> 
          {detalle.para_todos ? (
            <span style={{color: "#2e7d32", marginLeft: "8px"}}>Todos los residentes</span>
          ) : (
            <div style={{marginTop: "4px"}}>
              {detalle.destinatarios && detalle.destinatarios.length > 0 ? (
                <ul style={{margin: "0", paddingLeft: "20px"}}>
                  {detalle.destinatarios.map(dest => {
                    const residente = residentes.find(r => r.residente_id === dest.residente_id || r.id === dest.residente_id);
                    return (
                      <li key={dest.id}>
                        {residente ? residente.nombre : `ID: ${dest.residente_id}`}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span style={{color: "#d32f2f"}}>No se especificaron destinatarios</span>
              )}
            </div>
          )}
        </div>
      )}
      <div className={styles["social-detail-row"]}>
        <b>Contenido:</b> 
        <div style={{marginTop: "4px"}}>
          {detalle.contenido}
          {detalle.estado === "fallido" && detalle.contenido.includes("[ERROR:") && (
            <div style={{
              backgroundColor: "#ffebee",
              border: "1px solid #d32f2f",
              borderRadius: "4px",
              padding: "8px",
              marginTop: "8px",
              color: "#d32f2f",
              fontWeight: "bold"
            }}>
              ⚠️ Error: {detalle.contenido.split("[ERROR:")[1]?.split("]")[0] || "Error desconocido"}
            </div>
          )}
        </div>
      </div>
      <div className={styles["social-detail-row"]}><b>Fecha:</b> {new Date(detalle.fecha_creacion).toLocaleString()}</div>
      <div className={styles["social-detail-row"]}>
        <b>Imágenes:</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {detalle.imagenes && detalle.imagenes.length > 0 && detalle.imagenes[0].imagen_url ? (
            <img src={API_URL + detalle.imagenes[0].imagen_url} alt="img" style={{width:180,height:180,objectFit:'cover',borderRadius:10,border:'1.5px solid #ccc'}} />
          ) : <span style={{color:'#888',marginLeft:8}}>Sin imágenes</span>}
        </div>
      </div>
      {/* Opciones de encuesta y votación */}
      {detalle.tipo_publicacion === "encuesta" && (
        <div className={styles["social-detail-row"]}>
          <b>Opciones de encuesta:</b>
          <div style={{marginTop:8, marginBottom:8}}>
            {detalle.opciones && detalle.opciones.length > 0 ? (
              <>
                {rol === "residente" && (
                  <>
                    {detalleVotoRealizado ? (
                      <div style={{color:'#1976d2',marginBottom:8}}>
                        Ya votaste por: <b>{detalle.opciones.find(o => o.id === detalleVotoRealizado)?.texto || "-"}</b>
                      </div>
                    ) : (
                      <>
                        {detalle.opciones.map(op => (
                          <button key={op.id} style={{marginRight:8,marginBottom:4}} onClick={()=>votarEnEncuesta(detalle.id, op.id)} disabled={!!detalleVotoRealizado}>{op.texto}</button>
                        ))}
                      </>
                    )}
                  </>
                )}
                {rol === "admin" && (
                  <div style={{marginTop:8}}>
                    <b>Resultados:</b>
                    {resultadosEncuesta && resultadosEncuesta.opciones && resultadosEncuesta.opciones.length > 0 ? (
                      <>
                        <ul style={{marginTop:4}}>
                          {resultadosEncuesta.opciones.map(res => (
                            <li key={res.opcion_id}>{res.texto}: <b>{res.votos}</b> voto(s)</li>
                          ))}
                        </ul>
                        <div>Total de votos: <b>{resultadosEncuesta.total_votos}</b></div>
                        {/* Gráfico de pastel */}
                        <div style={{maxWidth:320,marginTop:16}}>
                          <Pie
                            data={{
                              labels: resultadosEncuesta.opciones.map(o => o.texto),
                              datasets: [{
                                data: resultadosEncuesta.opciones.map(o => o.votos),
                                backgroundColor: [
                                  '#1976d2','#43a047','#e53935','#fbc02d','#8e24aa','#00bcd4','#ff9800','#c2185b'
                                ],
                              }]
                            }}
                            options={{
                              plugins: { legend: { position: 'bottom' } },
                              responsive: true,
                              maintainAspectRatio: false
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={{color:'#888',marginTop:8}}>Aún no hay votos registrados para esta encuesta.</div>
                    )}
                  </div>
                )}
              </>
            ) : <span style={{color:'#888'}}>Sin opciones</span>}
          </div>
          {detalleMensaje && <div style={{color: detalleMensaje.includes("Error") ? "#e53935" : "#1976d2", marginTop: 8}}>{detalleMensaje}</div>}
        </div>
      )}
      <button onClick={() => setDetalle(null)} style={{ marginTop: 12 }}>Cerrar</button>
    </div>
  );

  // Renderizado de formulario de creación/edición
  const renderForm = () => (
    <form onSubmit={handleCrear} className={styles["social-form"]}>
      <h3>{editId ? "Editar Publicación" : "Nueva Publicación"}</h3>
      <label>Título</label>
      <input name="titulo" placeholder="Título" value={formData.titulo} onChange={handleInputChange} required disabled={bloqueado} />
      {formData.tipo_publicacion === "encuesta" ? (
        <>
          <label>Pregunta de la encuesta</label>
          <input name="contenido" placeholder="Pregunta de la encuesta" value={formData.contenido} onChange={handleInputChange} required disabled={bloqueado} />
          <label>Opciones de respuesta</label>
          {opcionesEncuesta.map((op, idx) => (
            <div key={idx} style={{display:'flex',gap:8,marginBottom:4}}>
              <input type="text" value={op} onChange={e => handleOpcionesEncuestaChange(idx, e.target.value)} placeholder={`Opción ${idx+1}`} style={{flex:1}} disabled={bloqueado} />
              {opcionesEncuesta.length > 1 && (
                <button type="button" onClick={() => handleEliminarOpcion(idx)} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:4,padding:'0 8px',cursor:'pointer'}} disabled={bloqueado}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAgregarOpcion} style={{marginBottom:8,background:'#1976d2',color:'#fff',border:'none',borderRadius:4,padding:'4px 12px',cursor:'pointer'}} disabled={bloqueado}>+ Agregar opción</button>
        </>
      ) : (
        <>
          <label>Contenido</label>
          <textarea name="contenido" placeholder="Contenido" value={formData.contenido} onChange={handleInputChange} required disabled={bloqueado} />
        </>
      )}
      <label>Tipo de publicación</label>
      <select name="tipo_publicacion" value={formData.tipo_publicacion} onChange={handleInputChange} required disabled={bloqueado}>
        <option value="comunicado">Comunicado</option>
        <option value="publicacion">Publicación</option>
        <option value="encuesta">Encuesta</option>
      </select>
      {/* Switch moderno para 'Para todos los residentes' */}
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'8px 0'}}>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',margin:0}}>
          <span style={{fontWeight:500,color:'#1976d2'}}>Para todos los residentes</span>
          <span style={{position:'relative',display:'inline-block',width:40,height:22}}>
            <input type="checkbox" name="para_todos" checked={formData.para_todos} onChange={handleInputChange} style={{opacity:0,width:0,height:0}} />
            <span style={{
              position:'absolute',cursor:'pointer',top:0,left:0,right:0,bottom:0,
              background:formData.para_todos?'#1976d2':'#b0bec5',
              borderRadius:22,transition:'background 0.2s'}}></span>
            <span style={{
              position:'absolute',left:formData.para_todos?20:2,top:2,
              width:18,height:18,background:'#fff',borderRadius:'50%',
              boxShadow:'0 1px 4px #0002',transition:'left 0.2s'}}></span>
          </span>
        </label>
      </div>
      {/* Select múltiple de destinatarios si no es para todos */}
      {isAdmin && !formData.para_todos && (
        <div style={{marginBottom:8}}>
          <label style={{color: formData.destinatarios.length === 0 ? "#d32f2f" : "#000"}}>
            Destinatarios (selecciona uno o más residentes) {formData.destinatarios.length === 0 && "*Obligatorio*"}:
          </label>
          <Select
            isMulti
            options={residentesOptions}
            value={residentesOptions.filter(opt => formData.destinatarios.some(d => d.residente_id === opt.value))}
            onChange={handleDestinatariosChange}
            placeholder="Buscar y seleccionar residentes..."
            classNamePrefix="react-select"
            styles={{
              menu: base => ({ ...base, zIndex: 9999 }),
              container: base => ({ ...base, width: '100%' }),
              control: (base, state) => ({
                ...base,
                borderColor: formData.destinatarios.length === 0 ? "#d32f2f" : base.borderColor,
                boxShadow: formData.destinatarios.length === 0 ? "0 0 0 1px #d32f2f" : base.boxShadow
              })
            }}
          />
          {formData.destinatarios.length === 0 && (
            <div style={{color: "#d32f2f", fontSize: "12px", marginTop: "4px"}}>
              Debe seleccionar al menos un residente como destinatario
            </div>
          )}
        </div>
      )}
      {editId && detalle && detalle.imagenes && detalle.imagenes.length > 0 && !eliminarImagen && (
        <div style={{marginBottom:8}}>
          <label>Imagen actual:</label>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src={API_URL + detalle.imagenes[0].imagen_url} alt="img" style={{width:80,height:80,objectFit:'cover',borderRadius:8,border:'1px solid #ccc'}} />
            <button type="button" style={{background:'#e53935',color:'#fff',border:'none',borderRadius:4,padding:'4px 12px',cursor:'pointer'}} onClick={()=>setEliminarImagen(true)}>Eliminar imagen</button>
          </div>
        </div>
      )}
      <label>Nueva imagen (opcional):</label>
      <input type="file" accept="image/*" onChange={e => setFileList(e.target.files.length > 0 ? [e.target.files[0]] : [])} disabled={bloqueado} />
      {renderPreviewImgs()}
      <div className={styles["social-form-btns"]}>
        <button type="submit" disabled={bloqueado}>{editId ? "Actualizar" : "Crear"}</button>
        <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} disabled={bloqueado}>Cancelar</button>
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