import React, { useState, useRef, useEffect } from "react";
import '../../css/UserMenu.css';

function UserMenu({ usuario, ultimaConexion, onLogout, onSelect, selected }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="user-menu-topbar" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setOpen(!open)}>
        <span role="img" aria-label="user">👤</span> {usuario.nombre} <span className="user-menu-rol">({usuario.rol})</span>
        <span className="user-menu-arrow">▼</span>
      </button>
      {open && (
        <div className="user-menu-dropdown user-menu-dropdown-top">
          <div className={`user-menu-item${selected === 'perfil' ? ' selected' : ''}`} onClick={() => { onSelect('perfil'); setOpen(false); }}>Perfil</div>
          <div className={`user-menu-item${selected === 'config' ? ' selected' : ''}`} onClick={() => { onSelect('config'); setOpen(false); }}>Configuración</div>
          <div className="user-menu-item user-menu-ultima">Última conexión:<br />{ultimaConexion ? new Date(ultimaConexion).toLocaleString() : '-'}</div>
          <div className="user-menu-item user-menu-logout" onClick={() => { onLogout(); setOpen(false); }}>Cerrar sesión</div>
        </div>
      )}
    </div>
  );
}

export default UserMenu; 