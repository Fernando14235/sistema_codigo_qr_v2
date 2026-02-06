import React, { useState, useEffect } from "react";
import api from "./api"; // import { API_URL } from "./api"; // If needed
import "./css/GuardiaDashboard.css";
import './css/App.css';
import './css/ResidenteDashboard.css';
import SocialDashboard from "./SocialDashboard";
import UserMenu from "./components/UI/UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";

// Importar Vistas Refactorizadas
import MainMenu from "./roles/Residente/views/MainMenu";
import CrearVisita from "./roles/Residente/views/CrearVisita";
import SolicitarVisita from "./roles/Residente/views/SolicitarVisita";
import MisVisitas from "./roles/Residente/views/MisVisitas";
import Tickets from "./roles/Residente/views/Tickets";
import Notificaciones from "./roles/Residente/views/Notificaciones";
import FormEditarVisita from "./roles/Residente/components/FormEditarVisita";

// Componentes Compartidos (inline por ahora, idealmente en utils/components)
function Notification({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

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

  // Pagination States
  const [pageVisitas, setPageVisitas] = useState(1);
  const [totalPagesVisitas, setTotalPagesVisitas] = useState(1);
  const [limitVisitas] = useState(10);

  const [pageTickets, setPageTickets] = useState(1);
  const [totalPagesTickets, setTotalPagesTickets] = useState(1);
  const [limitTickets] = useState(10);

  // Obtener datos completos del usuario autenticado
  useEffect(() => {
    api.get(`/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  // Cargar visitas del residente
  const cargarVisitas = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.get(`/visitas/residente/mis_visitas`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageVisitas, limit: limitVisitas }
      });
      // Handle legacy or paginated response
      if (res.data.data) {
        setVisitas(res.data.data);
        setTotalPagesVisitas(res.data.total_pages || 1);
      } else {
        setVisitas(res.data || []);
        setTotalPagesVisitas(1);
      }
    } catch (err) {
      setNotification({ message: "Error al cargar las visitas", type: "error" });
    }
    setCargando(false);
  };

  // Eliminar visita
  const eliminarVisita = async (visitaId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta visita?")) return;
    
    try {
      await api.delete(`/visitas/residente/eliminar_visita/${visitaId}`, {
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
      await api.delete(`/tickets/eliminar_ticket/${ticketId}`, {
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
      const res = await api.get(`/notificaciones/residente/ver_notificaciones`, {
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
      const res = await api.get(`/tickets/listar_tickets/residente`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageTickets, limit: limitTickets }
      });
      if (res.data.data) {
        setTickets(res.data.data);
        setTotalPagesTickets(res.data.total_pages || 1);
      } else {
        setTickets(res.data || []);
        setTotalPagesTickets(1);
      }
    } catch (err) {
      setNotification({ message: "Error al cargar tickets", type: "error" });
    }
    setCargandoTickets(false);
  };

  const verTicketDetalle = async (ticket) => {
    try {
      const res = await api.get(`/tickets/obtener_ticket/${ticket.id}`, {
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
  }, [vista, pageVisitas]);

  useEffect(() => {
    if (vista === "tickets") cargarTickets();
  }, [vista, pageTickets]);

  useEffect(() => {
    if (vista === "notificaciones") cargarNotificaciones();
  }, [vista]);

  // Volver al menú principal
  const handleVolver = () => {
    setVista("menu");
    //setError(""); // Keeping error might be useful? Or clearing it on nav is better. Original code cleared it.
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
          <MainMenu nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={setVista} />
        )}

        {vista === 'visitas' && !visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => setVista('menu')} />
            <h3>Mis Visitas</h3>
            <MisVisitas 
              visitas={visitas} 
              onEditar={setVisitaEditar} 
              onEliminar={eliminarVisita}
              cargando={cargando}
              error={error}
              page={pageVisitas}
              totalPages={totalPagesVisitas}
              setPage={setPageVisitas}
            />
          </section>
        )}

        {vista === 'visitas' && visitaEditar && (
          <section className="admin-section">
            <BtnRegresar onClick={() => { setVisitaEditar(null); setVista('visitas'); }} />
            <FormEditarVisita
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
            <CrearVisita
              token={token}
              onSuccess={() => {
                setNotification({ message: "Visita creada correctamente", type: "success" });
              }}
              onCancel={handleVolver}
              setVista={setVista}
            />
          </section>
        )}

        {vista === 'notificaciones' && (
          <Notificaciones 
            notificaciones={notificaciones} 
            cargando={cargando} 
            error={error} 
            onBack={() => setVista('menu')} 
          />
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
            <SolicitarVisita
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
            <Tickets
              tickets={tickets}
              cargandoTickets={cargandoTickets}
              vistaTicket={vistaTicket}
              setVistaTicket={setVistaTicket}
              ticketDetalle={ticketDetalle}
              verTicketDetalle={verTicketDetalle}
              eliminarTicket={eliminarTicket}
              token={token}
              cargarTickets={cargarTickets}
              setNotification={setNotification}
              page={pageTickets}
              totalPages={totalPagesTickets}
              setPage={setPageTickets}
              onCancel={() => setVista('menu')}
              BtnRegresar={BtnRegresar} // Pass if needed, or component handles it (currently handling simplified internally)
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default ResidenteDashboard;