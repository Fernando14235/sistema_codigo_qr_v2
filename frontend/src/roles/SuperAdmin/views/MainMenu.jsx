import React from "react";
import UserMenu from "../../../components/UI/UserMenu";

// Menú principal del super admin
function MainMenu({ nombre, onLogout, onSelectVista }) {
  return (
    <div className="super-admin-container">
      <div className="super-admin-header">
        <div className="header-content">
          <h1>Panel de Super Administrador</h1>
          <p>Bienvenido, {nombre}</p>
        </div>
        <div className="header-actions">
          <UserMenu 
            usuario={{ nombre: nombre, rol: "super_admin" }}
            onLogout={onLogout}
            ultimaConexion={null}
            onSelect={() => {}}
            selected=""
          />
          <button className="btn-logout" onClick={onLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="super-admin-menu">
        <div className="menu-grid">
          <div className="menu-card" onClick={() => onSelectVista("crear-admin")}>
            <div className="menu-icon">👤</div>
            <h3>Crear Administrador</h3>
            <p>Crear nuevos administradores para residenciales</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("listar-admins")}>
            <div className="menu-icon">📋</div>
            <h3>Ver Administradores</h3>
            <p>Listar todos los administradores del sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("crear-residencial")}>
            <div className="menu-icon">🏢</div>
            <h3>Crear Residencial</h3>
            <p>Crear nuevas residenciales en el sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("listar-residenciales")}>
            <div className="menu-icon">📊</div>
            <h3>Ver Residenciales</h3>
            <p>Listar todas las residenciales con estadísticas</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("gestionar-vistas")}>
            <div className="menu-icon">👁️</div>
            <h3>Gestionar Vistas</h3>
            <p>Configurar vistas por residencial y administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
