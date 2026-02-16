import React from "react";

function MainMenu({
  nombre,
  rol,
  onLogout,
  onSelectVista,
  vistasDisponibles,
  isVistaDisponible,
}) {
  const menuItems = [
    {
      id: "usuarios",
      title: "Gestión de Usuarios",
      icon: "👥",
      description: "Crear, editar y eliminar usuarios del sistema",
    },
    {
      id: "crear",
      title: "Crear Usuario",
      icon: "➕",
      description: "Agregar nuevos usuarios al sistema",
    },
    {
      id: "estadisticas",
      title: "Estadísticas",
      icon: "📊",
      description: "Ver estadísticas y reportes del sistema",
    },
    {
      id: "escaneos",
      title: "Historial de Escaneos",
      icon: "📱",
      description: "Revisar todos los escaneos QR realizados",
    },
    {
      id: "historial",
      title: "Historial de Visitas",
      icon: "📋",
      description: "Ver el historial completo de visitas",
    },
    {
      id: "crear_visita",
      title: "Crear Visita",
      icon: "🏠",
      description: "Crear nuevas visitas para entidades",
    },
    {
      id: "mis_visitas",
      title: "Mis Visitas",
      icon: "📋",
      description: "Gestionar visitas propias del administrador",
    },
    {
      id: "social",
      title: "Social",
      icon: "💬",
      description: "Gestionar contenido social y comunicaciones",
    },
    {
      id: "tickets",
      title: "Tickets de Soporte",
      icon: "🎫",
      description: "Gestionar tickets de soporte técnico",
    },
    {
      id: "solicitudes",
      title: "Solicitudes Pendientes",
      icon: "⏳",
      description: "Revisar solicitudes de visita pendientes",
    },
  ];

  // Filtrar solo las vistas disponibles
  const menuItemsDisponibles = menuItems.filter((item) =>
    isVistaDisponible(item.id)
  );

  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <button className="logout-btn" onClick={onLogout}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
              fill="currentColor"
            />
          </svg>
          Cerrar Sesión
        </button>
      </div>
      <h1 className="main-menu-title">Panel de Administración</h1>
      <div className="main-menu-cards">
        {menuItemsDisponibles.length > 0 ? (
          menuItemsDisponibles.map((item) => (
            <div
              key={item.id}
              className="main-menu-card"
              onClick={() => onSelectVista(item.id)}
            >
              <div className="menu-card-icon">{item.icon}</div>
              <h3 className="menu-card-title">{item.title}</h3>
              <p className="menu-card-description">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="no-vistas-disponibles">
            <p>No tienes vistas disponibles configuradas.</p>
            <p>Contacta al super administrador para configurar tus permisos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainMenu;
