import React from "react";
import UserMenu from "../../../components/UI/UserMenu";

// Menú principal del super admin
function MainMenu({ nombre, onLogout, onSelectVista }) {
  return (
    <div className="super-admin-container">
      <div className="super-admin-header">
        <div className="header-content">
          <h1>Panel de Super Administrador</h1>
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
          {/* ── Nuevo: Dashboard Global ── */}
          <div className="menu-card menu-card--highlight" onClick={() => onSelectVista("dashboard-global")}>
            <div className="menu-icon">📊</div>
            <h3>Dashboard Global</h3>
            <p>Métricas en tiempo real de todo el sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("crear-admin")}>
            <div className="menu-icon">👤</div>
            <h3>Crear Administrador</h3>
            <p>Crear nuevos administradores para las entidades</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("listar-admins")}>
            <div className="menu-icon">📋</div>
            <h3>Ver Administradores</h3>
            <p>Listar todos los administradores del sistema</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("crear-residencial")}>
            <div className="menu-icon">🏢</div>
            <h3>Crear Entidad</h3>
            <p>Crear nuevas entidades en el sistema</p>
          </div>

          {/* ── Nuevo: Gestionar Entidades (reemplaza Ver Entidades) ── */}
          <div className="menu-card" onClick={() => onSelectVista("gestionar-entidades")}>
            <div className="menu-icon">🏗️</div>
            <h3>Gestionar Entidades</h3>
            <p>Editar, suspender, reactivar o eliminar entidades</p>
          </div>

          {/* ── Nuevo: Gestionar Usuarios Global ── */}
          <div className="menu-card" onClick={() => onSelectVista("gestionar-usuarios-global")}>
            <div className="menu-icon">🔧</div>
            <h3>Gestionar Usuarios</h3>
            <p>Activar, desactivar y resetear contraseñas de usuarios</p>
          </div>

          <div className="menu-card" onClick={() => onSelectVista("gestionar-vistas")}>
            <div className="menu-icon">👁️</div>
            <h3>Gestionar Vistas</h3>
            <p>Configurar vistas por entidad y administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
