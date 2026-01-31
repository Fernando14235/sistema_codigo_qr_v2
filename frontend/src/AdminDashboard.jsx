import React, { useState, useEffect, useCallback } from "react";
import api from "./api";
import { getImageUrl } from "./utils/imageUtils";

// Importar componentes comunes del Admin
import Notification from "./roles/Admin/components/Notification";
import QRFullscreen from "./roles/Admin/components/QRFullscreen";

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

function AdminDashboard({ nombre, token, rol, onLogout }) {
  const [vista, setVista] = useState("menu");
  const [vistasDisponibles, setVistasDisponibles] = useState([]);
  const [notificacion, setNotificacion] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);

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
    // Si no hay configuración de vistas o está vacía, mostrar todo por defecto
    if (!vistasDisponibles || vistasDisponibles.length === 0) return true;
    
    // Si es admin_residencial, tiene acceso a todo
    if (rol === 'admin_residencial') return true;
    
    // Mapeo de nombres internos a nombres de la BD
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

  const [usuarioEditar, setUsuarioEditar] = useState(null);

  // Manejar cambio de vista con parámetros
  const handleSelectVista = (nuevaVista, params = null) => {
    if (nuevaVista === "crear_usuario" || nuevaVista === "crear") {
      setUsuarioEditar(params);
      setVista("crear_usuario");
    } else {
      setVista(nuevaVista);
    }
  };

  // Renderizado condicional de la vista actual
  const renderVista = () => {
    switch (vista) {
      case "menu":
        return (
          <MainMenu
            nombre={nombre}
            rol={rol}
            onLogout={onLogout}
            onSelectVista={handleSelectVista}
            vistasDisponibles={vistasDisponibles}
            isVistaDisponible={isVistaDisponible}
          />
        );

      case "crear_usuario":
        return isVistaDisponible("usuarios") ? (
          <CrearUsuario
            token={token}
            usuarioEditar={usuarioEditar}
            setUsuarioEditar={setUsuarioEditar}
            onUsuarioCreado={() => {
              handleNotification({
                message: usuarioEditar ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
                type: "success",
              });
              setVista("usuarios");
              setUsuarioEditar(null);
            }}
            onCancel={() => {
                setVista("usuarios");
                setUsuarioEditar(null);
            }}
            onNotification={handleNotification}
          />
        ) : null;

      case "usuarios":
        return isVistaDisponible("usuarios") ? (
          <GestionUsuarios
            token={token}
            onCancel={() => setVista("menu")}
            onSelectVista={handleSelectVista}
            isVistaDisponible={isVistaDisponible}
            onNotification={handleNotification}
          />
        ) : null;

      case "historial":
        return isVistaDisponible("historial") ? (
          <HistorialVisitas
            token={token}
            onCancel={() => setVista("menu")}
            onNotification={handleNotification}
          />
        ) : null;

      case "estadisticas":
        return isVistaDisponible("estadisticas") ? (
          <Estadisticas
            token={token}
            onCancel={() => setVista("menu")}
            onNotification={handleNotification}
          />
        ) : null;

      case "escaneos":
        return isVistaDisponible("escaneos") ? (
          <Escaneos
            token={token}
            onCancel={() => setVista("menu")}
            onNotification={handleNotification}
          />
        ) : null;

      case "crear_visita":
        return isVistaDisponible("crear_visita") ? (
          <section className="admin-section">
            <h2 className="crear-visita-title">Crear Nueva Visita</h2>
            <FormCrearVisitaAdmin
              token={token}
              onSuccess={() => {
                handleNotification({
                  message: "Visita creada correctamente",
                  type: "success",
                });
                setVista("menu");
              }}
              onCancel={() => setVista("menu")}
              setVista={setVista}
              usuario={nombre}
            />
          </section>
        ) : null;

      case "solicitudes":
        return isVistaDisponible("solicitudes") ? (
          <SolicitudesPendientes
            token={token}
            onSuccess={() => {
              handleNotification({
                message: "Solicitud aprobada correctamente",
                type: "success",
              });
            }}
            onCancel={() => setVista("menu")}
          />
        ) : null;

      case "mis_visitas":
        return isVistaDisponible("mis_visitas") ? (
          <MisVisitas
            token={token}
            usuario={nombre}
            onCancel={() => setVista("menu")}
            onNotification={handleNotification}
          />
        ) : null;

      case "tickets":
        return isVistaDisponible("tickets") ? (
          <Tickets
            token={token}
            onCancel={() => setVista("menu")}
            onNotification={handleNotification}
          />
        ) : null;

      case "social":
        return isVistaDisponible("social") ? (
          <SocialAdmin
            token={token}
            onCancel={() => setVista("menu")}
          />
        ) : null;

      default:
        return (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <h3>Vista no encontrada o en construcción</h3>
            <button onClick={() => setVista("menu")} className="btn-primary">
              Volver al Menú
            </button>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {notificacion && (
        <Notification
          message={notificacion.message}
          type={notificacion.type}
          onClose={() => setNotificacion(null)}
        />
      )}

      <div className="admin-content">
        {renderVista()}
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
