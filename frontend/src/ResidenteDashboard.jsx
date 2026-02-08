import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
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

// Componentes Compartidos
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

  const navigate = useNavigate();
  const location = useLocation();

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
      cargarVisitas();
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
      cargarTickets();
    } catch (err) {
      setNotification({ 
        message: err.response?.data?.detail || "Error al eliminar el ticket", 
        type: "error" 
      });
    }
  };

  // Cargar notificaciones
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

  // Cargar tickets
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
    if (location.pathname === "/visitas") cargarVisitas();
    if (location.pathname === "/tickets") cargarTickets();
    if (location.pathname === "/notificaciones") cargarNotificaciones();
  }, [location.pathname, pageVisitas, pageTickets]);

  const handleSelectVista = (nuevaVista) => {
    const routeMap = {
      'menu': '/',
      'visitas': '/visitas',
      'crear': '/crear-visita',
      'notificaciones': '/notificaciones',
      'social': '/social',
      'solicitar': '/solicitar-visita',
      'tickets': '/tickets',
      'perfil': '/perfil',
      'config': '/configuracion'
    };
    navigate(routeMap[nuevaVista] || '/');
  };

  const selectedVista = () => {
    const path = location.pathname;
    if (path === '/') return 'menu';
    if (path === '/visitas') return 'visitas';
    if (path === '/crear-visita') return 'crear';
    if (path === '/notificaciones') return 'notificaciones';
    if (path === '/social') return 'social';
    if (path === '/solicitar-visita') return 'solicitar';
    if (path === '/tickets') return 'tickets';
    if (path === '/perfil') return 'perfil';
    if (path === '/configuracion') return 'config';
    return '';
  };

  return (
    <div className="admin-dashboard">
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      <UserMenu
        usuario={usuario || { nombre, rol: "residente" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={handleSelectVista}
        selected={selectedVista()}
      />
      <div style={{ marginTop: 60 }}>
        <Routes>
          <Route path="/" element={
            <MainMenu nombre={usuario?.nombre || nombre} rol={usuario?.rol} onLogout={onLogout} onSelectVista={handleSelectVista} />
          } />

          <Route path="/perfil" element={
            <PerfilUsuario usuario={usuario} onRegresar={() => navigate('/')} />
          } />

          <Route path="/configuracion" element={
            <ConfiguracionUsuario onRegresar={() => navigate('/')} usuario={usuario || { id: 3, rol: 'residente' }} token={token} />
          } />

          <Route path="/visitas" element={
            !visitaEditar ? (
              <section className="admin-section">
                <BtnRegresar onClick={() => navigate('/')} />
                <h3>Mis Visitas</h3>
                <MisVisitas 
                  visitas={visitas} 
                  onEditar={(v) => { setVisitaEditar(v); navigate('/visitas/editar'); }} 
                  onEliminar={eliminarVisita}
                  cargando={cargando}
                  error={error}
                  page={pageVisitas}
                  totalPages={totalPagesVisitas}
                  setPage={setPageVisitas}
                />
              </section>
            ) : <Navigate to="/visitas/editar" />
          } />

          <Route path="/visitas/editar" element={
            visitaEditar ? (
              <section className="admin-section">
                <BtnRegresar onClick={() => { setVisitaEditar(null); navigate('/visitas'); }} />
                <FormEditarVisita
                  token={token}
                  visita={visitaEditar}
                  onSuccess={() => {
                    setNotification({ message: "Visita editada correctamente", type: "success" });
                    setVisitaEditar(null);
                    navigate('/visitas');
                  }}
                  onCancel={() => { setVisitaEditar(null); navigate('/visitas'); }}
                  setVista={handleSelectVista}
                />
              </section>
            ) : <Navigate to="/visitas" />
          } />

          <Route path="/crear-visita" element={
            <section className="admin-section">
              <CrearVisita
                token={token}
                onSuccess={() => {
                  setNotification({ message: "Visita creada correctamente", type: "success" });
                }}
                onCancel={() => navigate('/')}
                setVista={handleSelectVista}
              />
            </section>
          } />

          <Route path="/notificaciones" element={
            <Notificaciones 
              notificaciones={notificaciones} 
              cargando={cargando} 
              error={error} 
              onBack={() => navigate('/')} 
            />
          } />

          <Route path="/social" element={
            <section className="admin-section">
              <BtnRegresar onClick={() => navigate('/')} />
              <SocialDashboard token={token} rol={usuario?.rol || "residente"} />
            </section>
          } />

          <Route path="/solicitar-visita" element={
            <section className="admin-section">
              <BtnRegresar onClick={() => navigate('/')} />
              <h3>Solicitar Visita</h3>
              <SolicitarVisita
                token={token}
                onSuccess={() => {
                  setNotification({ message: "Solicitud enviada correctamente", type: "success" });
                  navigate("/visitas");
                }}
                onCancel={() => navigate('/')}
                setVista={handleSelectVista}
              />
            </section>
          } />

          <Route path="/tickets" element={
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
                onCancel={() => navigate('/')}
                BtnRegresar={BtnRegresar}
              />
            </section>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default ResidenteDashboard;