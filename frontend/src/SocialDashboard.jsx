import React, { useState, useEffect } from "react";
import api from "./api"; 
import styles from "./SocialDashboard.module.css";
import { getImageUrl } from './utils/imageUtils';
import cardStyles from "./css/Cards.module.css";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

function SocialDashboard({ token, rol }) {
  // Función para colores de encuesta
  const getOpcionColor = (index) => {
    const colors = ['#1976d2', '#43a047', '#e53935', '#fbc02d', '#8e24aa', '#00bcd4', '#ff9800', '#c2185b', '#3f51b5', '#009688'];
    return colors[index % colors.length];
  };

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case "comunicado": return "📢";
      case "encuesta": return "📊";
      case "publicacion": return "📝";
      default: return "📄";
    }
  };

  const [publicaciones, setPublicaciones] = useState([]);
  const [filtros, setFiltros] = useState({ tipo_publicacion: "", fecha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [votoRealizado, setVotoRealizado] = useState(null);
  const [adminNombre, setAdminNombre] = useState("");
  const [modalImagen, setModalImagen] = useState({ isOpen: false, currentIndex: 0, images: [] });

  // Cargar publicaciones para residente
  const cargarPublicaciones = async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (filtros.tipo_publicacion) params.tipo_publicacion = filtros.tipo_publicacion;
      if (filtros.fecha) params.fecha = filtros.fecha;
      
      const res = await api.get(`/social/obtener_social/residente`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      const data = res.data.data || res.data; 
      setPublicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar publicaciones");
      setPublicaciones([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPublicaciones();
    // eslint-disable-next-line
  }, [filtros]);

  // Votar en encuesta
  const votarEnEncuesta = async (socialId, opcionId) => {
    setMensaje("Enviando voto...");
    try {
      await api.post(`/social/votar/residente/${socialId}`, { opcion_id: opcionId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensaje("¡Voto registrado!");
      setVotoRealizado(opcionId);
      cargarPublicaciones();
      
      // Actualizar detalle si está abierto
      const res = await api.get(`/social/obtener_social/residente`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = (res.data.data || res.data).find(p => p.id === socialId);
      if (updated) setDetalle(updated);
    } catch (err) {
      setMensaje(err.response?.data?.detail || "Error al votar");
    }
  };

  // Cargar nombre del admin cuando se abre el detalle
  useEffect(() => {
    if (detalle && detalle.admin_id) {
      api.get(`/usuarios/usuario_nombre/${detalle.admin_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setAdminNombre(res.data.nombre))
      .catch(() => setAdminNombre(""));
    }
  }, [detalle, token]);

  // Manejar el voto previo del usuario
  useEffect(() => {
    if (detalle && detalle.tipo_publicacion === "encuesta" && detalle.votos) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const usuarioId = tokenData.usuario_id;
        
        api.get(`/usuarios/residentes/usuario/${usuarioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          const miVoto = detalle.votos.find(v => v.residente_id === res.data.id);
          if (miVoto) setVotoRealizado(miVoto.opcion_id);
          else setVotoRealizado(null);
        })
        .catch(() => setVotoRealizado(null));
      } catch (err) {
        console.error("Error al procesar voto:", err);
      }
    }
  }, [detalle, token]);

  const IconVer = () => <span title="Ver" style={{cursor:'pointer', fontSize: 20}} role="img" aria-label="ver">🔍</span>;

  const renderFiltros = () => (
    <div className={styles["social-filtros"]} style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
      <select value={filtros.tipo_publicacion} onChange={e => setFiltros(f => ({ ...f, tipo_publicacion: e.target.value }))}>
        <option value="">Todos los tipos</option>
        <option value="comunicado">Comunicado</option>
        <option value="publicacion">Publicación</option>
        <option value="encuesta">Encuesta</option>
      </select>
    </div>
  );

  const renderPublicaciones = () => {
    return (
      <div className={cardStyles["cards-container"]}>
        {renderFiltros()}
        {publicaciones.map(pub => (
          <div className={cardStyles["horizontal-card"]} key={pub.id}>
            <div className={`${cardStyles["status-stripe"]} ${cardStyles["success"]}`}></div>
            
            <div className={cardStyles["card-main-content"]}>
              <div className={cardStyles["card-section"]}>
                <span className={cardStyles["section-label"]}>Tipo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(pub.tipo_publicacion)}</span>
                  <span className={cardStyles["section-value"]} style={{ textTransform: 'capitalize' }}>
                    {pub.tipo_publicacion}
                  </span>
                </div>
              </div>

              <div className={cardStyles["card-section"]}>
                <span className={cardStyles["section-label"]}>Título</span>
                <h4 className={cardStyles["card-title"]}>{pub.titulo}</h4>
              </div>

              <div className={cardStyles["card-section"]}>
                <span className={cardStyles["section-label"]}>Publicado</span>
                <span className={cardStyles["section-value"]}>
                  {new Date(pub.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className={cardStyles["card-actions"]}>
              <button 
                className={`${cardStyles["action-btn"]} ${cardStyles["view"]}`}
                onClick={() => setDetalle(pub)}
                title="Ver detalle"
              >
                🔍
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetalle = () => (
    <div className={styles["social-detail-card"]}>
      <button className="btn-secondary" onClick={() => setDetalle(null)} style={{marginBottom: 15}}>← Volver</button>
      <h3>{detalle.titulo}</h3>
      <div className={styles["social-detail-row"]}><b>Publicado por:</b> {adminNombre || "Administración"}</div>
      <div className={styles["social-detail-row"]}><b>Fecha:</b> {new Date(detalle.fecha_creacion).toLocaleString()}</div>
      
      <div className={styles["social-detail-row"]} style={{marginTop: 15}}>
        <b>Contenido:</b>
        <div style={{marginTop: 8, lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{detalle.contenido}</div>
      </div>

      <div className={styles["social-detail-row"]} style={{marginTop: 15}}>
        <b>Imágenes:</b>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {detalle.imagenes && detalle.imagenes.length > 0 ? (
            detalle.imagenes.map((imagen, index) => (
              <img 
                key={imagen.id || index}
                src={getImageUrl(imagen.imagen_url)} 
                alt="adjunto" 
                style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                onClick={() => setModalImagen({ isOpen: true, currentIndex: index, images: detalle.imagenes })}
              />
            ))
          ) : <span style={{color:'#888'}}>Sin imágenes adjuntas</span>}
        </div>
      </div>

      {detalle.tipo_publicacion === "encuesta" && (
        <div className={styles["social-detail-row"]} style={{marginTop: 20, padding: 15, background: '#f8f9fa', borderRadius: 10}}>
          <h4 style={{marginTop: 0}}>Encuesta</h4>
          {votoRealizado ? (
            <div>
              <p style={{color: '#2e7d32', fontWeight: 'bold'}}>✓ Ya has votado en esta encuesta</p>
              <p>Tu elección: <b>{detalle.opciones.find(o => o.id === votoRealizado)?.texto}</b></p>
            </div>
          ) : (
            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              {detalle.opciones?.map((op, idx) => (
                <button 
                  key={op.id}
                  onClick={() => votarEnEncuesta(detalle.id, op.id)}
                  className="btn-primary"
                  style={{background: getOpcionColor(idx), border: 'none'}}
                >
                  {op.texto}
                </button>
              ))}
            </div>
          )}
          {mensaje && <p style={{marginTop: 10, color: '#1976d2'}}>{mensaje}</p>}
        </div>
      )}

      {/* Modal Imagen */}
      {modalImagen.isOpen && (
        <div 
          style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.9)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setModalImagen({ isOpen: false, currentIndex: 0, images: [] })}
        >
          <img 
            src={getImageUrl(modalImagen.images[modalImagen.currentIndex].imagen_url)} 
            alt="zoom" 
            style={{ maxWidth:'90%', maxHeight:'90%', borderRadius: 10 }} 
          />
          <button style={{ position:'absolute', top:20, right:20, color:'#fff', background:'none', border:'none', fontSize:30, cursor:'pointer' }}>×</button>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles["social-dashboard"]}>
      <h2 className="section-title">Novedades y Comunicados</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : (
        detalle ? renderDetalle() : renderPublicaciones()
      )}
    </div>
  );
}

export default SocialDashboard;