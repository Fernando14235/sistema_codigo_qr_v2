import React, { useState, useRef, useEffect } from "react";
import api from "../../../api";
import { getImageUrl } from "../../../utils/imageUtils";
import PaginationControls from "../../../components/PaginationControls";

// Componente para listar tickets del residente
function TablaTicketsResidente({ tickets, onVerDetalle, onEliminar }) {
  // Detectar si la pantalla es pequeña
  const isMobile = window.innerWidth < 700;

  if (!tickets || tickets.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888' }}>No tienes tickets registrados.</p>;
  }

  if (isMobile) {
    return (
      <div style={{ width: '100%', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, color: '#1976d2' }}>Mis Tickets</h3>
        <div className="tickets-cards-mobile">
          {tickets.map(ticket => (
            <div className="ticket-card-mobile" key={ticket.id}>
              <div className="ticket-card-mobile-info">
                <div><b>ID:</b> #{ticket.id}</div>
                <div><b>Título:</b> {ticket.titulo}</div>
                <div><b>Estado:</b> <span className={`ticket-estado-badge ${ticket.estado}`}>{ticket.estado}</span></div>
                <div><b>Fecha:</b> {new Date(ticket.fecha_creacion).toLocaleString()}</div>
              </div>
              <div className="ticket-card-mobile-action">
                <span
                  onClick={() => onVerDetalle(ticket)}
                  style={{ color: '#1976d2', cursor: 'pointer', fontSize: 28 }}
                  title="Ver detalle"
                >
                  👁️
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>Mis Tickets</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>#{ticket.id}</td>
                <td>{ticket.titulo}</td>
                <td>{ticket.estado}</td>
                <td>{new Date(ticket.fecha_creacion).toLocaleString()}</td>
                <td>
                  <span
                    onClick={() => onVerDetalle(ticket)}
                    style={{ color: '#1976d2', cursor: 'pointer', fontSize: 20 }}
                    title="Ver detalle"
                  >
                    👁️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError("Por favor selecciona un archivo de imagen válido");
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar los 5MB");
        return;
      }
      
      setImagen(file);
      setError("");
      
      // Crear preview
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
      
      // Solo actualizar estado si el componente sigue montado
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
        setError(err.response?.data?.detail || "Error al crear el ticket");
      }
    } finally {
      if (isMountedRef.current) {
        setCargando(false);
      }
    }
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit} style={{maxWidth:480,margin:'0 auto'}}>
      <h2 className="crear-visita-title">Crear Ticket de Soporte</h2>
      <div className="form-row">
        <label>Título:</label>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required disabled={cargando} />
      </div>
      <div className="form-row">
        <label>Descripción:</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required rows={4} disabled={cargando} style={{resize:'vertical'}} />
      </div>
      <div className="form-row">
        <label>Imagen (opcional - máximo 1):</label>
        {!imagenPreview ? (
          <div style={{position:'relative'}}>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImagenChange} 
              disabled={cargando}
              style={{
                padding: '10px',
                border: '2px dashed #1976d2',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            />
            <p style={{fontSize:'12px',color:'#666',marginTop:'5px'}}>
              Formatos: JPG, PNG. Tamaño máximo: 5MB
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '10px',
            marginBottom: '20px'
          }}>
            <div style={{
              position: 'relative',
              display: 'inline-block'
            }}>
              <img 
                src={imagenPreview} 
                alt="Vista previa" 
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '2px solid #e3eafc',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  display: 'block'
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={cargando}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#d32f2f';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f44336';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Eliminar imagen"
              >
                ×
              </button>
              <p style={{fontSize:'12px',color:'#666',marginTop:'8px',textAlign:'center'}}>
                {imagen?.name}
              </p>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={cargando}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  width: '100%',
                  transition: 'background 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f57c00'}
                onMouseLeave={(e) => e.target.style.background = '#ff9800'}
              >
                🔄 Cambiar imagen
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="create-ticket-actions" style={{ marginTop: imagenPreview ? '10px' : '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" type="submit" disabled={cargando}>
          {cargando ? "Creando..." : "Crear Ticket"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Tarjetas responsivas para tickets del residente
function TicketsCardsMobileResidente({ tickets, onVerDetalle, onEliminar }) {
  return (
    <div className="tickets-cards-mobile">
      {tickets.map(ticket => (
        <div className="ticket-card-mobile" key={ticket.id} style={{marginBottom:18,background:'#fff',borderRadius:12,boxShadow:'0 2px 8px #1976d220',padding:18}}>
          <div className="ticket-card-mobile-info">
            <div className="ticket-header-mobile">
              <b>Título: </b><span className="ticket-titulo-mobile">{ticket.titulo}</span>
              <br />
              <b>Estado: </b><span className={`ticket-estado-mobile ${ticket.estado}`}>{ticket.estado}</span>
            </div>
            <div><b>Fecha:</b> {new Date(ticket.fecha_creacion).toLocaleString()}</div>
            {ticket.imagen_url && (
              <div><b>Imagen:</b> <span style={{color: '#1976d2'}}>📎 Imagen Adjunta</span></div>
            )}
            {ticket.respuesta_admin && (
              <div><b>Respuesta:</b> {ticket.respuesta_admin}</div>
            )}
          </div>
          <br />
          <div className="ticket-card-mobile-actions">
            <span 
              onClick={() => onVerDetalle(ticket)}
              style={{ color: '#1976d2', cursor: 'pointer', fontSize: 30 }}
              title="Ver ticket"
            >
              👁️
            </span>
          </div>
        </div>
      ))}
    </div>
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
            window.innerWidth < 750 ? (
              <TicketsCardsMobileResidente tickets={tickets} onVerDetalle={verTicketDetalle} onEliminar={eliminarTicket} />
            ) : (
              <TablaTicketsResidente tickets={tickets} onVerDetalle={verTicketDetalle} onEliminar={eliminarTicket} />
            )
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
