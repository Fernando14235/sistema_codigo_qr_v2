import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
import { getImageUrl } from "./utils/imageUtils";

// Importar componentes comunes del Admin
import Notification from "./roles/Admin/components/Notification";
import QRFullscreen from "./roles/Admin/components/QRFullscreen";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import UserMenu from "./components/UI/UserMenu";

// Importar Vistas del Admin
import MainMenu from "./roles/Admin/views/MainMenu";
import CrearUsuario from "./roles/Admin/views/CrearUsuario";
import SolicitudesPendientes from "./roles/Admin/views/SolicitudesPendientes";
import GestionUsuarios from "./roles/Admin/views/GestionUsuarios";
import HistorialVisitas from "./roles/Admin/views/HistorialVisitas";
import Estadisticas from "./roles/Admin/views/Estadisticas";
import Escaneos from "./roles/Admin/views/Escaneos";
import MisVisitas from "./roles/Admin/views/MisVisitas";
import Tickets from "./roles/Admin/views/Tickets";
import SocialAdmin from "./roles/Admin/views/SocialAdmin";
import FormCrearVisitaAdmin from "./roles/Admin/views/subcomponents/FormCrearVisitaAdmin";

function AdminDashboard({ nombre, token, rol, onLogout }) {
  const [vistasDisponibles, setVistasDisponibles] = useState([]);
  const [notificacion, setNotificacion] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos completos del usuario autenticado
  useEffect(() => {
    api.get(`/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(err => console.error("Error cargando usuario:", err));
  }, [token]);

  // Cargar vistas disponibles para este admin
  const cargarVistasDisponibles = useCallback(async () => {
    try {
      const res = await api.get("/vistas/mi-configuracion", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVistasDisponibles(res.data || []);
    } catch {
      setVistasDisponibles([]);
    }
  }, [token]);

  useEffect(() => {
    cargarVistasDisponibles();
  }, [cargarVistasDisponibles]);

  // Verificar si una vista está disponible
  const isVistaDisponible = (nombreVista) => {
    if (nombreVista === 'perfil' || nombreVista === 'config' || nombreVista === 'configuracion') return true;
    if (!vistasDisponibles || vistasDisponibles.length === 0) return false;
    if (rol === 'admin_residencial') return true;
    
    const mapping = {
      'usuarios': 'Gestión de Usuarios',
      'crear': 'Crear Usuario',
      'estadisticas': 'Estadísticas',
      'escaneos': 'Historial de Escaneos',
      'historial': 'Historial de Visitas',
      'crear_visita': 'Crear Visita',
      'mis_visitas': 'Mis Visitas',
      'social': 'Social',
      'tickets': 'Tickets de Soporte',
      'solicitudes': 'Solicitudes Pendientes'
    };
    
    const nombreBD = mapping[nombreVista] || nombreVista;
    return vistasDisponibles.some(v => v.nombre === nombreBD && v.activa);
  };

  // Manejar notificaciones
  const handleNotification = (noti) => {
    setNotificacion(noti);
  };

  // Manejar cambio de vista con navegación
  const handleSelectVista = (nuevaVista, params = null) => {
    if (nuevaVista === "menu") {
      navigate("/");
      return;
    }

    if (nuevaVista === "crear_usuario" || nuevaVista === "crear") {
      setUsuarioEditar(params);
      navigate("/crear-usuario");
    } else {
      const routeMap = {
        'usuarios': '/usuarios',
        'historial': '/historial',
        'estadisticas': '/estadisticas',
        'escaneos': '/escaneos',
        'crear_visita': '/crear-visita',
        'solicitudes': '/solicitudes',
        'mis_visitas': '/mis-visitas',
        'tickets': '/tickets',
        'social': '/social',
        'perfil': '/perfil',
        'config': '/configuracion'
      };
      const targetRoute = routeMap[nuevaVista] || `/${nuevaVista}`;
      navigate(targetRoute);
    }
  };

  const getSelectedVista = () => {
    const path = location.pathname;
    if (path === '/') return 'menu';
    if (path === '/usuarios') return 'usuarios';
    if (path === '/crear-usuario') return 'crear';
    if (path === '/estadisticas') return 'estadisticas';
    if (path === '/escaneos') return 'escaneos';
    if (path === '/historial') return 'historial';
    if (path === '/crear-visita') return 'crear_visita';
    if (path === '/mis-visitas') return 'mis_visitas';
    if (path === '/social') return 'social';
    if (path === '/tickets') return 'tickets';
    if (path === '/solicitudes') return 'solicitudes';
    if (path === '/perfil') return 'perfil';
    if (path === '/configuracion') return 'config';
    return '';
  };

  return (
    <div className="admin-dashboard">
      <UserMenu
        usuario={usuario || { nombre, rol }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={handleSelectVista}
        selected={getSelectedVista()}
      />
      {notificacion && (
        <Notification
          message={notificacion.message}
          type={notificacion.type}
          onClose={() => setNotificacion(null)}
        />
      )}

      <div className="admin-content" style={{ marginTop: 60 }}>
        <Routes>
          <Route path="/" element={
            <MainMenu
              nombre={nombre}
              rol={rol}
              onLogout={onLogout}
              onSelectVista={handleSelectVista}
              vistasDisponibles={vistasDisponibles}
              isVistaDisponible={isVistaDisponible}
            />
          } />

          <Route path="/crear-usuario" element={
            isVistaDisponible("usuarios") ? (
              <CrearUsuario
                token={token}
                usuarioEditar={usuarioEditar}
                setUsuarioEditar={setUsuarioEditar}
                onUsuarioCreado={() => {
                  handleNotification({
                    message: usuarioEditar ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
                    type: "success",
                  });
                  navigate("/usuarios");
                  setUsuarioEditar(null);
                }}
                onCancel={() => {
                  navigate("/usuarios");
                  setUsuarioEditar(null);
                }}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/usuarios" element={
            isVistaDisponible("usuarios") ? (
              <GestionUsuarios
                token={token}
                onCancel={() => navigate("/")}
                onSelectVista={handleSelectVista}
                isVistaDisponible={isVistaDisponible}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/historial" element={
            isVistaDisponible("historial") ? (
              <HistorialVisitas
                token={token}
                onCancel={() => navigate("/")}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/estadisticas" element={
            isVistaDisponible("estadisticas") ? (
              <Estadisticas
                token={token}
                onCancel={() => navigate("/")}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/escaneos" element={
            isVistaDisponible("escaneos") ? (
              <Escaneos
                token={token}
                onCancel={() => navigate("/")}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/crear-visita" element={
            isVistaDisponible("crear_visita") ? (
              <section className="admin-section">
                <FormCrearVisitaAdmin
                  token={token}
                  onSuccess={() => {
                    handleNotification({
                      message: "Visita creada correctamente",
                      type: "success",
                    });
                    navigate("/");
                  }}
                  onCancel={() => navigate("/")}
                  setVista={(v) => navigate(`/${v}`)}
                  usuario={nombre}
                />
              </section>
            ) : <Navigate to="/" />
          } />

          <Route path="/solicitudes" element={
            isVistaDisponible("solicitudes") ? (
              <SolicitudesPendientes
                token={token}
                onSuccess={() => {
                  handleNotification({
                    message: "Solicitud aprobada correctamente",
                    type: "success",
                  });
                }}
                onCancel={() => navigate("/")}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/mis-visitas" element={
            isVistaDisponible("mis_visitas") ? (
              <MisVisitas
                token={token}
                usuario={nombre}
                onCancel={() => navigate("/")}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/tickets" element={
            isVistaDisponible("tickets") ? (
              <Tickets
                token={token}
                onCancel={() => navigate("/")}
                onNotification={handleNotification}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/social" element={
            isVistaDisponible("social") ? (
              <SocialAdmin
                token={token}
                onCancel={() => navigate("/")}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/perfil" element={
             <PerfilUsuario usuario={usuario || { nombre, rol }} onRegresar={() => navigate('/')} />
          } />

          <Route path="/configuracion" element={
             <ConfiguracionUsuario onRegresar={() => navigate('/')} usuario={usuario || { rol: 'admin' }} token={token} />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {showQRFullscreen && qrUrl && (
        <QRFullscreen
          qrUrl={qrUrl}
          onClose={() => setShowQRFullscreen(false)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
