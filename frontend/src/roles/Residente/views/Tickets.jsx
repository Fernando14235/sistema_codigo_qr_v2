import React, { useState, useRef, useEffect } from "react";
import api from "../../../api";
import { getImageUrl } from "../../../utils/imageUtils";
import PaginationControls from "../../../components/PaginationControls";
import cardStyles from "../../../css/Cards.module.css";

// Componente para listar tickets del residente (Diseño Moderno de Tarjetas)
function TicketsList({ tickets, onVerDetalle }) {
  if (!tickets || tickets.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: "40px" }}>
        No tienes tickets registrados.
      </p>
    );
  }

  return (
    <div className={cardStyles["cards-container"]}>
      {tickets.map((ticket) => (
        <div className={cardStyles["horizontal-card"]} key={ticket.id}>
          <div className={`${cardStyles["status-stripe"]} ${cardStyles[ticket.estado] || cardStyles["primary"]}`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Ticket ID</span>
              <span className={cardStyles["section-value"]}>#{ticket.id}</span>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Asunto</span>
              <h4 className={cardStyles["card-title"]}>{ticket.titulo}</h4>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado / Fecha</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={`${cardStyles["badge"]} ${cardStyles["badge-" + ticket.estado]}`}>
                  {ticket.estado === 'pendiente' ? '⏳ Pendiente' : 
                   ticket.estado === 'en_proceso' ? '⚙️ En Proceso' : 
                   ticket.estado === 'resuelto' ? '✅ Resuelto' : '❌ Rechazado'}
                </span>
                <span className={cardStyles["section-value"]} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(ticket.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className={cardStyles["card-actions"]}>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["view"]}`}
              onClick={() => onVerDetalle(ticket)}
              title="Ver detalle"
            >
              👁️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


// Vista de detalle de ticket para residente
function TicketDetalleResidente({ ticket, onRegresar }) {
  const [modalImagen, setModalImagen] = useState(false);
  return (
    <div className="ticket-detalle" style={{maxWidth:600,margin:'0 auto',background:'#fff',borderRadius:12,boxShadow:'0 4px 16px #0001',padding:24}}>
      <div className="ticket-detalle-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <h3 style={{ color: '#1976d2', margin: 0 }}>Ticket #{ticket.id}</h3>
        <span className={`ticket-estado-badge ${ticket.estado}`}>{ticket.estado}</span>
      </div>
      <div className="ticket-detalle-content">
        <div className="ticket-section">
          <h4>📋 Información del Ticket</h4>
          <div><b>Título:</b> {ticket.titulo}</div>
          <div><b>Fecha de creación:</b> {new Date(ticket.fecha_creacion).toLocaleString()}</div>
          <div><b>Estado:</b> {ticket.estado}</div>
          {ticket.fecha_respuesta && (
            <div><b>Fecha de respuesta:</b> {new Date(ticket.fecha_respuesta).toLocaleString()}</div>
          )}
        </div>
        <div className="ticket-section">
          <h4>👤 Información del Residente</h4>
          <div>
            <div><b>Nombre:</b> {ticket.nombre_residente || "N/A"}</div>
            <div><b>Unidad:</b> {ticket.unidad_residencial || "N/A"}</div>
            <div><b>Teléfono:</b> {ticket.telefono || "N/A"}</div>
          </div>
        </div>
        <div className="ticket-section">
          <h4>📝 Descripción</h4>
          <div className="ticket-description" style={{background:'#f5f8fe',padding:12,borderRadius:8,border:'1px solid #e0e0e0',marginBottom:10}}>{ticket.descripcion}</div>
        </div>
        {ticket.imagen_url && (
          <div className="ticket-section">
            <h4>📎 Imagen Adjunta</h4>
            <div className="ticket-imagen-container" style={{textAlign:'center'}}>
              <img 
                src={getImageUrl(ticket.imagen_url)} 
                alt="Imagen del ticket" 
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '2px solid #e0e0e0',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #1976d220',
                  display: 'block',
                  margin: '0 auto'
                }}
                onClick={() => setModalImagen(true)}
                title="Haz clic para ver en grande"
              />
              {modalImagen && (
                <div 
                  className="modal-imagen-ticket" 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                  }}
                  onClick={() => setModalImagen(false)}
                >
                  <img 
                    src={getImageUrl(ticket.imagen_url)} 
                    alt="Imagen del ticket" 
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      borderRadius: 16,
                      boxShadow: '0 4px 32px #0008',
                      background: '#fff',
                      display: 'block',
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button 
                    onClick={() => setModalImagen(false)}
                    style={{
                      position: 'fixed',
                      top: 30,
                      right: 40,
                      fontSize: 32,
                      color: '#fff',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      zIndex: 10000
                    }}
                    title="Cerrar"
                  >×</button>
                </div>
              )}
            </div>
          </div>
        )}
        {ticket.respuesta_admin && (
          <div className="ticket-section">
            <h4>💬 Respuesta del Administrador</h4>
            <div className="ticket-respuesta" style={{background:'#e8f5e8',padding:12,borderRadius:8,borderLeft:'4px solid #388e3c'}}>{ticket.respuesta_admin}</div>
            <h4>Estado del Ticket</h4>
            <h3 style={{background:'#e9e6e9',padding:10,borderRadius:50}}><b><center>{ticket.estado}</center></b></h3>
          </div>
        )}
      </div>
      <div className="ticket-detalle-actions" style={{marginTop:18}}>
        <button className="btn-secondary" onClick={onRegresar}>← Ver mis tickets</button>
      </div>
    </div>
  );
}

import styles from "./Tickets.module.css";

// Formulario para crear ticket
function FormCrearTicketResidente({ token, onSuccess, onCancel }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();
  const isMountedRef = useRef(true);

  // Cleanup para evitar memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Por favor selecciona un archivo de imagen válido");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar los 5MB");
        return;
      }
      setImagen(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMountedRef.current) {
          setImagenPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagen(null);
    setImagenPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      if (imagen) formData.append("imagen", imagen);

      await api.post(`/tickets/crear_ticket/residente`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMountedRef.current) {
        setTitulo("");
        setDescripcion("");
        setImagen(null);
        setImagenPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      onSuccess && onSuccess();
    } catch (err) {
      if (isMountedRef.current) {
        const detail = err.response?.data?.detail;
        const msg = Array.isArray(detail) 
          ? detail.map(d => d.msg).join(", ") 
          : (typeof detail === 'string' ? detail : "Error al crear el ticket");
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setCargando(false);
      }
    }
  };

  return (
    <form className={styles["ticket-form-revamped"]} onSubmit={handleSubmit}>
      <div className={styles["form-header"]}>
        <h2>Crear Ticket de Soporte</h2>
      </div>

      <div className={styles["ticket-grid"]}>
        <div className={styles["field-group"]}>
          <label>Título:</label>
          <input 
            type="text" 
            placeholder="Ej: Problemas con el intercomunicador"
            value={titulo} 
            onChange={e => setTitulo(e.target.value)} 
            required 
            disabled={cargando}
            className={styles["form-input"]}
          />
        </div>

        <div className={styles["field-group"]}>
          <label>Descripción:</label>
          <textarea 
            placeholder="Describe detalladamente el problema..."
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)} 
            required 
            rows={5} 
            disabled={cargando} 
            style={{resize:'vertical'}} 
            className={styles["form-textarea"]}
          />
        </div>

        <div className={styles["media-section"]}>
          <label className={styles["media-title"]}>Imagen (opcional - máximo 1):</label>
          {!imagenPreview ? (
            <div className={styles["file-upload-box"]}>
              <input 
                type="file" 
                accept="image/*" 
                id="ticket-image-input"
                ref={fileInputRef} 
                onChange={handleImagenChange} 
                className={styles["hidden-input"]}
                disabled={cargando}
              />
              <label htmlFor="ticket-image-input" className={styles["file-drop-area"]}>
                <span className={styles["upload-icon"]}>📸</span>
                <span className={styles["upload-text"]}>Adjuntar foto</span>
                <span className={styles["upload-hint"]}>JPG, PNG (Máx 5MB)</span>
              </label>
            </div>
          ) : (
            <div className={styles["preview-container"]}>
              <div className={styles["image-preview-wrapper"]}>
                <img src={imagenPreview} alt="Vista previa" className={styles["preview-image"]} />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={cargando}
                  className={styles["btn-remove-preview"]}
                  title="Eliminar imagen"
                >
                  ×
                </button>
              </div>
              <div className={styles["file-name-info"]}>{imagen?.name}</div>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={cargando}
                className={styles["btn-change-media"]}
              >
                🔄 Cambiar imagen
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles["form-actions"]}>
        {error && <div className={styles["error-badge"]}>{error}</div>}
        <div className={styles["btns-group"]}>
          <button className={styles["btn-submit"]} type="submit" disabled={cargando}>
            {cargando ? <span className={styles["spinner"]}></span> : "Crear Ticket"}
          </button>
          <button className={styles["btn-cancel"]} type="button" onClick={onCancel} disabled={cargando}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}



function Tickets({ 
  tickets, 
  cargandoTickets, 
  vistaTicket, 
  setVistaTicket, 
  ticketDetalle, 
  verTicketDetalle, 
  eliminarTicket, 
  token, 
  cargarTickets, 
  setNotification,
  page,
  totalPages,
  setPage,
  onCancel,
  BtnRegresar // Passing BtnRegresar as a prop or import it? Better import it or just pass props.
}) {
  // We need BtnRegresar here or just replicate it. 
  // For now let's use the container logic.
  
  // Actually, extracting BtnRegresar to a common component would be best, but for now
  // I will just use a simple button here or ask parent to handle return.
  
  // Re-implementing simplified BtnRegresar to avoid drilling too much.
  const BtnRegresarSimple = ({ onClick }) => (
    <button className="btn-regresar" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
      </svg>
      Regresar al Menú
    </button>
  );

  return (
    <>
      {!(vistaTicket === 'detalle' && ticketDetalle) && (
        <BtnRegresarSimple onClick={onCancel} />
      )}
      {vistaTicket === 'listado' && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <h3>Mis Tickets</h3>
            <button className="btn-primary" onClick={() => setVistaTicket('crear')}>+ Crear Ticket</button>
          </div>
          {cargandoTickets ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Cargando tickets...</div>
          ) : (
            <TicketsList tickets={tickets} onVerDetalle={verTicketDetalle} />
          )}
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
      {vistaTicket === 'crear' && (
        <FormCrearTicketResidente
          token={token}
          onSuccess={() => { setVistaTicket('listado'); cargarTickets(); setNotification({ message: "Ticket creado correctamente", type: "success" }); }}
          onCancel={() => setVistaTicket('listado')}
        />
      )}
      {vistaTicket === 'detalle' && ticketDetalle && (
        <TicketDetalleResidente ticket={ticketDetalle} onRegresar={() => setVistaTicket('listado')} />
      )}
    </>
  );
}

export default Tickets;
