import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./api";
import "./css/GuardiaDashboard.css";
import './css/App.css';
import './css/ResidenteDashboard.css';
import SocialDashboard from "./SocialDashboard";
import UserMenu from "./components/UI/UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import CustomPhoneInput from "./components/PhoneInput";
import { useRef } from "react";
import { getImageUrl } from "./utils/imageUtils";

// Tarjeta de notificación reutilizable
function Notification({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

// Menú principal para residente
function MainMenuResidente({ nombre, rol, onLogout, onSelectVista }) {
  const menuItems = [
    { id: "visitas", title: "Mis Visitas", icon: "📋", description: "Ver y gestionar tus visitas registradas" },
    { id: "crear", title: "Crear Visita", icon: "➕", description: "Crear una nueva visita con QR automático" },
    //{ id: "solicitar", title: "Solicitar Visita", icon: "📝", description: "Solicitar aprobación al administrador" },
    { id: "tickets", title: "Tickets de Soporte", icon: "🎫", description: "Crear y gestionar tickets de soporte" },
    { id: "social", title: "Social", icon: "💬", description: "Comunicaciones y contenido social" },
    //{ id: "notificaciones", title: "Notificaciones", icon: "🔔", description: "Ver tus notificaciones del sistema" }
  ];

  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <div>
          <span className="main-menu-user">{nombre}</span>
          <span className="main-menu-role">{rol}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>
      <h1 className="main-menu-title">Panel de Residente</h1>
      <div className="main-menu-cards">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="main-menu-card"
            onClick={() => onSelectVista(item.id)}
          >
            <div className="menu-card-icon">{item.icon}</div>
            <h3 className="menu-card-title">{item.title}</h3>
            <p className="menu-card-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Botón de regresar
function BtnRegresar({ onClick }) {
  return (
    <button className="btn-regresar" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
      </svg>
      Regresar al Menú
    </button>
  );
}

// Tabla de visitas (responsive)
function TablaVisitasResidente({ visitas, onEditar, onEliminar }) {
  // Detectar si la pantalla es pequeña
  const isMobile = window.innerWidth < 700;
  if (isMobile) {
    return (
      <div className="visitas-cards-mobile">
        {visitas.map((v, i) => (
          <div className="visita-card-mobile" key={i}>
            <div className="visita-card-mobile-info">
              <div><b>Visitante:</b> {v.visitante?.nombre_conductor || '-'}</div>
              <div><b>Teléfono:</b> {v.visitante?.telefono || '-'}</div>
              <div><b>Vehículo:</b> {v.visitante?.tipo_vehiculo || '-'}</div>
              <div><b>Motivo:</b> {v.visitante?.motivo_visita || '-'}</div>
              <div><b>Estado:</b> {v.estado === 'solicitada' ? 'Solicitada' : v.estado}</div>
              <div><b>Expiración:</b> {v.expiracion == 'S' ? 'Sí' : 'No'}</div>
              <div><b>Fecha Entrada:</b> {v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleString() : "-"}</div>
            </div>
            <div className="visita-card-mobile-action">
              <span
                onClick={() => onEliminar(v.id)}
                style={{ color: '#e53935', cursor: 'pointer', fontSize: 28, marginRight: 8 }}
                title="Eliminar visita"
              >
                🗑️
              </span>
              <span
                onClick={() => (v.estado === 'pendiente' && v.expiracion === 'N') ? onEditar(v) : null}
                style={{ color: (v.estado === 'pendiente' && v.expiracion === 'N') ? '#1976d2' : '#bdbdbd', cursor: (v.estado === 'pendiente' && v.expiracion === 'N') ? 'pointer' : 'not-allowed', fontSize: 28 }}
                title={(v.estado === 'pendiente' && v.expiracion === 'N') ? 'Editar visita' : 'Solo puedes editar visitas pendientes y no expiradas'}
              >
                ✏️
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // Tabla para escritorio
  return (
    <div className="tabla-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Visitante</th>
            <th>Teléfono</th>
            <th>Vehículo</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Expiración</th>
            <th>Fecha Entrada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visitas.map((v, i) => (
            <tr key={i}>
              <td>{v.visitante?.nombre_conductor || '-'}</td>
              <td>{v.visitante?.telefono || '-'}</td>
              <td>{v.visitante?.tipo_vehiculo || '-'}</td>
              <td>{v.visitante?.motivo_visita || '-'}</td>
              <td>{v.estado === 'solicitada' ? 'Solicitada' : v.estado}</td>
              <td>{v.expiracion == 'S' ? 'Sí' : 'No'}</td>
              <td>{v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleString() : "-"}</td>
              <td>
                <span
                  onClick={() => onEliminar(v.id)}
                  style={{ color: '#e53935', cursor: 'pointer', fontSize: 20, marginRight: 8 }}
                  title="Eliminar visita"
                >
                  🗑️
                </span>
                <span
                  onClick={() => (v.estado === 'pendiente' && v.expiracion === 'N') ? onEditar(v) : null}
                  style={{ color: (v.estado === 'pendiente' && v.expiracion === 'N') ? '#1976d2' : '#bdbdbd', cursor: (v.estado === 'pendiente' && v.expiracion === 'N') ? 'pointer' : 'not-allowed', fontSize: 20 }}
                  title={(v.estado === 'pendiente' && v.expiracion === 'N') ? 'Editar visita' : 'Solo puedes editar visitas pendientes y no expiradas'}
                >
                  ✏️
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormCrearVisita({ token, onSuccess, onCancel, setVista }) {
  const [nombre_conductor, setNombreConductor] = useState("");
  const [dni_conductor, setDNIConductor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [marca_vehiculo, setMarcaVehiculo] = useState("");
  const [placa_vehiculo, setPlacaVehiculo] = useState("");
  const [tipo_vehiculo, setTipoVehiculo] = useState("");
  const [color_vehiculo, setColorVehiculo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fecha_entrada, setFechaEntrada] = useState("");
  const [cantidadAcompanantes, setCantidadAcompanantes] = useState(0);
  const [acompanantes, setAcompanantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const tiposVehiculo = ["Moto", "Camioneta", "Turismo", "Bus", "Otro"];
  const motivosVisita = ["Visita Familiar", "Visita de Amistad", "Delivery", "Reunión de Trabajo", "Mantenimiento", "Otros"];
  const marcasPorTipo = {
    Moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Otra"],
    Camioneta: ["Toyota", "Ford", "Chevrolet", "Nissan", "Hyundai", "Otra"],
    Turismo: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Kia", "Hyundai", "Volkswagen", "Otra"],
    Bus: ["No aplica"],
    Otro: ["Otra"]
  };
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];

  // Estado para mostrar el QR generado
  const [qrUrl, setQrUrl] = useState(null);
  const [bloquearSalir, setBloquearSalir] = useState(false);

  useEffect(() => {
    if (qrUrl) {
      setBloquearSalir(true);
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de salir? Si no descargas el código QR, podrías perder el acceso para tu visita.';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      setBloquearSalir(false);
    }
  }, [qrUrl]);

  // Handler para navegación interna
  useEffect(() => {
    if (!bloquearSalir) return;
    const handleNav = (e) => {
      if (!window.confirm('¿Estás seguro de salir? Si no descargas el código QR, podrías perder el acceso para tu visita.')) {
        e.preventDefault();
      }
    };
    window.addEventListener('popstate', handleNav);
    return () => window.removeEventListener('popstate', handleNav);
  }, [bloquearSalir]);

  useEffect(() => {
    setAcompanantes((prev) => {
      const nuevaCantidad = parseInt(cantidadAcompanantes) || 0;
      if (nuevaCantidad <= 0) return [];
      if (prev.length > nuevaCantidad) return prev.slice(0, nuevaCantidad);
      return [...prev, ...Array(nuevaCantidad - prev.length).fill("")];
    });
  }, [cantidadAcompanantes]);

  // Actualizar marca si cambia tipo de vehículo
  useEffect(() => {
    if (tipo_vehiculo === "Bus")  {
      setMarcaVehiculo("No aplica");
    } else if (marcasPorTipo[tipo_vehiculo] && !marcasPorTipo[tipo_vehiculo].includes(marca_vehiculo)) {
      setMarcaVehiculo("");
    }
  }, [tipo_vehiculo]);

  const handleAcompananteChange = (idx, value) => {
    setAcompanantes((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueado(true);
    setError("");
    setQrUrl(null);
    try {
      const data = {
        visitantes: [{
          nombre_conductor,
          dni_conductor,
          telefono: telefono.trim() && telefono.length > 5 ? telefono : "no agregado",
          tipo_vehiculo,
          marca_vehiculo: tipo_vehiculo === "Bus" ? "No aplica" : marca_vehiculo,
          color_vehiculo,
          placa_vehiculo,
          motivo_visita: motivo,
        }],
        motivo,
        fecha_entrada: fecha_entrada || null,
        acompanantes: acompanantes.filter(a => a && a.trim().length > 0)
      };
      const res = await axios.post(`${API_URL}/visitas/residente/crear_visita`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Si la respuesta contiene el QR, mostrarlo
      if (res.data && res.data.length > 0 && res.data[0].qr_url) {
        setQrUrl(getImageUrl(res.data[0].qr_url));
      }
      //onSuccess && onSuccess();
      // if (typeof setVista === 'function') setVista('visitas');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al crear la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueado(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefono(phone);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      // Generar nombre descriptivo con nombre del visitante y fecha
      const now = new Date();
      const fechaFormato = now.toLocaleDateString('es-HN').replace(/\//g, '-');
      const horaFormato = now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
      
      // Limpiar nombre del visitante para usar en el archivo
      const nombreLimpio = nombre_conductor.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const fileName = `QR_${nombreLimpio}_${fechaFormato}_${horaFormato}.png`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName; // usar .download en lugar de setAttribute
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Pequeño delay antes de limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error al descargar el QR:', error);
      alert('Error al descargar el código QR. Por favor, intenta nuevamente.');
    }
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombre_conductor} onChange={e => setNombreConductor(e.target.value)} required disabled={bloqueado || !!qrUrl} />
      </div>

      <div className="form-row">
        <label>DNI del visitante: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={dni_conductor} onChange={e => setDNIConductor(e.target.value)} disabled={bloqueado || !!qrUrl} />
      </div>

      <div className="form-row">
        <label>Teléfono: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <CustomPhoneInput
          value={telefono}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={bloqueado || !!qrUrl}
          required={false}
        />
      </div>

      <div className="form-row">
        <label>Tipo de vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <select value={tipo_vehiculo} onChange={e => setTipoVehiculo(e.target.value)} disabled={bloqueado || !!qrUrl}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Marca del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <select value={marca_vehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={bloqueado || !!qrUrl}>
          <option value="">Selecciona una marca</option>
          {(marcasPorTipo[tipo_vehiculo] || []).map(marca => (
            <option key={marca} value={marca}>{marca}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Color del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <select value={color_vehiculo} onChange={e => setColorVehiculo(e.target.value)} disabled={bloqueado || !!qrUrl}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Placa del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={placa_vehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={bloqueado || !!qrUrl} />
      </div>

      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={bloqueado || !!qrUrl}>
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fecha_entrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={bloqueado || !!qrUrl} />
      </div>

      <div className="form-row">
        <label>Cantidad de acompañantes: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="number" min="0" max="10" value={cantidadAcompanantes} onChange={e => setCantidadAcompanantes(e.target.value)} disabled={bloqueado || !!qrUrl} />
      </div>

      {acompanantes.map((a, idx) => (
        <div className="form-row" key={idx}>
          <label>Nombre del acompañante #{idx + 1}:</label>
          <input type="text" value={a} onChange={e => handleAcompananteChange(idx, e.target.value)} required disabled={bloqueado || !!qrUrl} />
        </div>
      ))}
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando || bloqueado || !!qrUrl}>
          {cargando ? "Creando..." : "Crear Visita"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={bloqueado || !!qrUrl} >
          Cancelar
        </button>
      </div>
      {qrUrl && (
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <h4>QR de tu visita</h4>
          <img
            src={qrUrl}
            alt="QR de la visita"
            style={{width: 220, height: 220, objectFit: 'contain', border: '2px solid #1976d2', borderRadius: 12, background: '#fff', marginBottom: 10
            }}
          />
          <br/>
          <div style={{ textAlign: 'center', marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            <button type ="button" onClick={handleDownloadQR} className="btn-primary">Descargar QR</button>
          </div>
          <div style={{ color: '#1976d2', marginTop: 6, fontSize: '0.98em' }}>
            Guarda este QR en tu galería para mostrarlo en la entrada
          </div>
        </div>
      )}
    </form>
  );
}

function FormEditarVisitaResidente({ token, visita, onSuccess, onCancel, setVista }) {
  const [nombre_conductor, setNombreConductor] = useState(visita.visitante?.nombre_conductor || visita.nombre_conductor || "");
  const [dni_conductor, setDNIConductor] = useState(visita.visitante?.dni_conductor || visita.dni_conductor || "");
  const [telefono, setTelefono] = useState(visita.visitante?.telefono || visita.telefono || '');
  const [marca_vehiculo, setMarcaVehiculo] = useState(visita.visitante?.marca_vehiculo || visita.marca_vehiculo || "");
  const [placa_vehiculo, setPlacaVehiculo] = useState(visita.visitante?.placa_vehiculo || visita.placa_vehiculo || "");
  const [tipo_vehiculo, setTipoVehiculo] = useState(visita.visitante?.tipo_vehiculo || visita.tipo_vehiculo || "");
  const [color_vehiculo, setColorVehiculo] = useState(visita.visitante?.color_vehiculo || visita.color_vehiculo || "");
  const [motivo, setMotivo] = useState(visita.motivo_visita || visita.notas || "");
  const [fecha_entrada, setFechaEntrada] = useState(visita.fecha_entrada ? new Date(visita.fecha_entrada).toISOString().slice(0,16) : "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [bloqueadoEditar, setBloqueadoEditar] = useState(false);
  const tiposVehiculo = ["Moto", "Camioneta", "Turismo", "Bus", "Otro"];
  const motivosVisita = ["Visita Familiar", "Visita de Amistad", "Delivery", "Reunión de Trabajo", "Mantenimiento", "Otros"];
  const marcasPorTipo = {
    Moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Otra"],
    Camioneta: ["Toyota", "Ford", "Chevrolet", "Nissan", "Hyundai", "Otra"],
    Turismo: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Kia", "Hyundai", "Volkswagen", "Otra"],
    Bus: ["No aplica"],
    Otro: ["Otra"]
  };
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];

  // Actualizar marca si cambia tipo de vehículo
  useEffect(() => {
    if (tipo_vehiculo === "Bus") {
      setMarcaVehiculo("No aplica");
    } else if (marcasPorTipo[tipo_vehiculo] && !marcasPorTipo[tipo_vehiculo].includes(marca_vehiculo)) {
      setMarcaVehiculo("");
    }
  }, [tipo_vehiculo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueadoEditar(true);
    setError("");
    try {
      const data = {
        fecha_entrada: fecha_entrada || null,
        notas: motivo,
        visitante: {
          nombre_conductor,
          dni_conductor,
          telefono: telefono.trim() && telefono.length > 5 ? telefono : "no agregado",
          tipo_vehiculo,
          marca_vehiculo: tipo_vehiculo === "Bus" ? "No aplica" : marca_vehiculo,
          color_vehiculo,
          placa_vehiculo,
          motivo_visita: motivo,
        }
      };
      await axios.patch(`${API_URL}/visitas/residente/editar_visita/${visita.id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
      if (typeof setVista === 'function') setVista('visitas');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al editar la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueadoEditar(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefono(phone);
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <h2 className="crear-visita-title">Editar Visita</h2>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombre_conductor} onChange={e => setNombreConductor(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>DNI del visitante: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={dni_conductor} onChange={e => setDNIConductor(e.target.value)} disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <CustomPhoneInput
          value={telefono}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={cargando || bloqueadoEditar}
          required={false}
        />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipo_vehiculo} onChange={e => setTipoVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <select value={marca_vehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona una marca</option>
          {(marcasPorTipo[tipo_vehiculo] || []).map(marca => (
            <option key={marca} value={marca}>{marca}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={color_vehiculo} onChange={e => setColorVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Placa del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={placa_vehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={cargando || bloqueadoEditar} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={cargando || bloqueadoEditar}>
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fecha_entrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={cargando || bloqueadoEditar} />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando || bloqueadoEditar}>
          {cargando ? "Guardando..." : "Guardar Cambios"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={cargando || bloqueadoEditar} >
          Cancelar
        </button>
      </div>
      <br/>
      <div style={{ color: '#1976d2', marginTop: 6, fontSize: '0.98em' }}>
          <b>Se usa el mismo QR generado originalmente para la visita.</b>
          <br/>
          <b>Si no lo pudo descargar, el codigo QR se encuentra en su correo de Gmail.</b>
      </div>
    </form>
  );
}

// Formulario para solicitar visita al administrador
const FormSolicitarVisita = ({ token, onSuccess, onCancel, setVista }) => {
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [dniVisitante, setDniVisitante] = useState("");
  const [telefonoVisitante, setTelefonoVisitante] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [placaVehiculo, setPlacaVehiculo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const tiposVehiculo = ["Moto", "Camioneta", "Turismo", "Bus", "Otro"];
  const motivosVisita = ["Visita Familiar", "Visita de Amistad", "Delivery", "Reunión de Trabajo", "Mantenimiento", "Otros"];
  const marcasPorTipo = {
    Moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Otra"],
    Camioneta: ["Toyota", "Ford", "Chevrolet", "Nissan", "Hyundai", "Otra"],
    Turismo: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Kia", "Hyundai", "Volkswagen", "Otra"],
    Bus: ["No aplica"],
    Otro: ["Otra"]
  };
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];

  // Actualizar marca si cambia tipo de vehículo
  useEffect(() => {
    if (tipoVehiculo === "Bus") {
      setMarcaVehiculo("No aplica");
    } else if (marcasPorTipo[tipoVehiculo] && !marcasPorTipo[tipoVehiculo].includes(marcaVehiculo)) {
      setMarcaVehiculo("");
    }
  }, [tipoVehiculo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const data = {
        nombre_visitante: nombreVisitante,
        dni_visitante: dniVisitante || undefined,
        telefono_visitante: telefonoVisitante.trim() && telefonoVisitante.length > 5 ? telefonoVisitante : "no agregado",
        fecha_entrada: fechaEntrada || null,
        motivo_visita: motivo,
        tipo_vehiculo: tipoVehiculo,
        marca_vehiculo: tipoVehiculo === "Bus" ? "No aplica" : marcaVehiculo,
        color_vehiculo: colorVehiculo || undefined,
        placa_vehiculo: placaVehiculo || "sin placa"
      };
      await axios.post(`${API_URL}/visitas/residente/solicitar_visita`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
      if (typeof setVista === 'function') setVista('visitas');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al enviar la solicitud. Verifica los datos."
      );
    }
    setCargando(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefonoVisitante(phone);
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <h2 className="crear-visita-title">Solicitar Visita al Administrador</h2>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombreVisitante} onChange={e => setNombreVisitante(e.target.value)} required disabled={cargando} />
      </div>
      <div className="form-row">
        <label>DNI del visitante: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={dniVisitante} onChange={e => setDniVisitante(e.target.value)} disabled={cargando} />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <CustomPhoneInput
          value={telefonoVisitante}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={cargando}
          required={false}
        />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipoVehiculo} onChange={e => setTipoVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <select value={marcaVehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona una marca</option>
          {(marcasPorTipo[tipoVehiculo] || []).map(marca => (
            <option key={marca} value={marca}>{marca}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={colorVehiculo} onChange={e => setColorVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Placa del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={placaVehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={cargando} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={cargando}>
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={cargando} />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando}>
          {cargando ? "Enviando..." : "Enviar Solicitud"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={cargando} >
          Cancelar
        </button>
      </div>
    </form>
  );
};

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
      await axios.post(`${API_URL}/tickets/crear_ticket/residente`, formData, {
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

function ResidenteDashboard({ token, nombre, onLogout }) {
  const [vista, setVista] = useState("menu");
  const [visitas, setVisitas] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [notificaciones, setNotificaciones] = useState([]);
  const [visitaEditar, setVisitaEditar] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(false);
  const [vistaTicket, setVistaTicket] = useState("listado");
  const [ticketDetalle, setTicketDetalle] = useState(null);

  // Obtener datos completos del usuario autenticado
  useEffect(() => {
    axios.get(`${API_URL}/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  // Cargar visitas del residente
  const cargarVisitas = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/visitas/residente/mis_visitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitas(res.data || []);
    } catch (err) {
      setNotification({ message: "Error al cargar las visitas", type: "error" });
    }
    setCargando(false);
  };

  // Eliminar visita
  const eliminarVisita = async (visitaId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta visita?")) return;
    
    try {
      await axios.delete(`${API_URL}/visitas/residente/eliminar_visita/${visitaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: "Visita eliminada correctamente", type: "success" });
      cargarVisitas(); // Recargar la lista
    } catch (err) {
      setNotification({ 
        message: err.response?.data?.detail || "Error al eliminar la visita", 
        type: "error" 
      });
    }
  };

  // Eliminar ticket
  const eliminarTicket = async (ticketId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este ticket?")) return;
    
    try {
      await axios.delete(`${API_URL}/tickets/eliminar_ticket/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: "Ticket eliminado correctamente", type: "success" });
      cargarTickets(); // Recargar la lista
    } catch (err) {
      setNotification({ 
        message: err.response?.data?.detail || "Error al eliminar el ticket", 
        type: "error" 
      });
    }
  };

  // Cargar notificaciones del residente
  const cargarNotificaciones = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/notificaciones/residente/ver_notificaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificaciones(res.data || []);
    } catch (err) {
      setNotification({ message: "Error al cargar las notificaciones", type: "error" });
    }
    setCargando(false);
  };

  // Cargar tickets del residente
  const cargarTickets = async () => {
    setCargandoTickets(true);
    try {
      const res = await axios.get(`${API_URL}/tickets/listar_tickets/residente`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data || []);
    } catch (err) {
      setNotification({ message: "Error al cargar tickets", type: "error" });
    }
    setCargandoTickets(false);
  };

  const verTicketDetalle = async (ticket) => {
    try {
      const res = await axios.get(`${API_URL}/tickets/obtener_ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketDetalle(res.data);
      setVistaTicket('detalle');
    } catch (err) {
      setNotification({ message: "Error al cargar el ticket", type: "error" });
    }
  };

  useEffect(() => {
    if (vista === "visitas") cargarVisitas();
    if (vista === "notificaciones") cargarNotificaciones();
    if (vista === "tickets") cargarTickets();
  }, [vista]);

  // Volver al menú principal
  const handleVolver = () => {
    setVista("menu");
    setError("");
  };

  // Mostrar notificación temporal (3 segundos)
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.message]);

  return (
    <div className="admin-dashboard">
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      <UserMenu
        usuario={usuario || { nombre, rol: "residente" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={setVista}
        selected={vista}
      />
      <div style={{ marginTop: 60 }}>
        {vista === 'perfil' && <PerfilUsuario usuario={usuario} onRegresar={() => setVista('menu')} />}
        {vista === 'config' && <ConfiguracionUsuario onRegresar={() => setVista('menu')} usuario={{ id: 3, rol: 'residente' }} />}
        {vista === 'menu' && (
          <MainMenuResidente nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={setVista} />
        )}
        {vista === 'visitas' && !visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Mis Visitas</h3>
            {cargando && <div>Cargando...</div>}
            {error && <div className="qr-error">{error}</div>}
            {!cargando && visitas.length === 0 && <div>No tienes visitas registradas.</div>}
            {!cargando && visitas.length > 0 && (
              <TablaVisitasResidente 
                visitas={visitas} 
                onEditar={setVisitaEditar} 
                onEliminar={eliminarVisita}
              />
            )}
          </section>
        )}
        {vista === 'visitas' && visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => { setVisitaEditar(null); setVista('visitas'); }} />
            <FormEditarVisitaResidente
              token={token}
              visita={visitaEditar}
              onSuccess={() => {
                setNotification({ message: "Visita editada correctamente", type: "success" });
                setVisitaEditar(null);
                cargarVisitas();
              }}
              onCancel={() => setVisitaEditar(null)}
              setVista={setVista}
            />
          </section>
        )}
        {vista === 'crear' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Crear Nueva Visita</h3>
            <FormCrearVisita
              token={token}
              onSuccess={() => {
                setNotification({ message: "Visita creada correctamente", type: "success" });
                // Eliminada la redirección automática a 'visitas' para que no cambie la vista
              }}
              onCancel={handleVolver}
              setVista={setVista}
            />
          </section>
        )}
        {vista === 'notificaciones' && (
          <section className="admin-section notificaciones-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Notificaciones</h3>
            {cargando && <div>Cargando...</div>}
            {error && <div className="qr-error">{error}</div>}
            {!cargando && notificaciones.length === 0 && <div className="notificacion-vacia">No tienes notificaciones.</div>}
            {!cargando && notificaciones.length > 0 && (
              <ul className="notificaciones-lista">
                {notificaciones.map((n, idx) => (
                  <li key={idx} className="notificacion-card">
                    <div className="notificacion-titulo">{n.titulo || "Notificación"}</div>
                    <div className="notificacion-mensaje">{n.mensaje}</div>
                    <div className="notificacion-fecha">
                      {n.fecha_envio ? new Date(n.fecha_envio).toLocaleString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {vista === 'social' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <SocialDashboard token={token} rol={usuario?.rol || "residente"} />
          </section>
        )}
        {vista === 'solicitar' && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Solicitar Visita</h3>
            <FormSolicitarVisita
              token={token}
              onSuccess={() => {
                setNotification({ message: "Solicitud enviada correctamente", type: "success" });
                setVista("visitas");
              }}
              onCancel={handleVolver}
              setVista={setVista}
            />
          </section>
        )}
        {vista === 'tickets' && (
          <section className="admin-section">
            {!(vistaTicket === 'detalle' && ticketDetalle) && (
              <BtnRegresar onClick={() => setVista('menu')} />
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
          </section>
        )}
      </div>
    </div>
  );
}

export default ResidenteDashboard;