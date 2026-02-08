import React from "react";

function MainMenu({ nombre, rol, onLogout, onSelectVista }) {
  const menuItems = [
    { id: "entrada", title: "Registrar Entrada", icon: "🚪", description: "Escanear QR para registrar entrada de visitantes" },
    { id: "salida", title: "Registrar Salida", icon: "🚗", description: "Escanear QR para registrar salida de visitantes" },
    { id: "visitas-dia", title: "Visitas del Día", icon: "📋", description: "Ver todas las visitas programadas para hoy" },
    { id: "escaneos", title: "Mis Escaneos del Día", icon: "🕒", description: "Ver historial de escaneos realizados hoy" }
  ];

  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <button className="logout-btn" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>
      <h1 className="main-menu-title">Panel de Guardia</h1>
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

export default MainMenu;
