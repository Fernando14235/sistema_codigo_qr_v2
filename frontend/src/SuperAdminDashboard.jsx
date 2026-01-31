import React, { useState } from "react";
import PWADownloadButton from "./components/PWA/PWADownloadButton";
import Notification from "./roles/SuperAdmin/components/Notification";
import MainMenu from "./roles/SuperAdmin/views/MainMenu";
import CrearAdmin from "./roles/SuperAdmin/views/CrearAdmin";
import ListarAdmins from "./roles/SuperAdmin/views/ListarAdmins";
import CrearResidencial from "./roles/SuperAdmin/views/CrearResidencial";
import ListarResidenciales from "./roles/SuperAdmin/views/ListarResidenciales";
import UsuariosResidencial from "./roles/SuperAdmin/views/UsuariosResidencial";
import GestionarVistas from "./roles/SuperAdmin/views/GestionarVistas";
import './css/SuperAdminDashboard.css';
import './css/GestionarVistas.css';

// Dashboard principal del super admin - Orquestador
function SuperAdminDashboard({ token, nombre, onLogout }) {
  const [vista, setVista] = useState("menu");
  const [vistaData, setVistaData] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleSelectVista = (nuevaVista, data = null) => {
    setVista(nuevaVista);
    setVistaData(data);
  };

  const handleRegresar = () => {
    setVista("menu");
    setVistaData(null);
  };

  const handleAdminCreado = () => {
    setNotification({ message: "Administrador creado exitosamente", type: "success" });
    // Redirigir automáticamente a la lista de administradores
    setTimeout(() => setVista("listar-admins"), 1500);
  };

  const handleResidencialCreada = () => {
    setNotification({ message: "Residencial creada exitosamente", type: "success" });
    setTimeout(() => setVista("menu"), 2000);
  };

  return (
    <div className="super-admin-dashboard">
      {/* Botón PWA en la esquina superior izquierda */}
      <div className="pwa-button-container">
        <PWADownloadButton />
      </div>
      
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      
      {vista === "menu" && (
        <MainMenu 
          nombre={nombre} 
          onLogout={onLogout} 
          onSelectVista={handleSelectVista} 
        />
      )}

      {vista === "crear-admin" && (
        <CrearAdmin 
          token={token} 
          onAdminCreado={handleAdminCreado} 
          onCancel={handleRegresar}
          onNotification={setNotification}
        />
      )}

      {vista === "listar-admins" && (
        <ListarAdmins token={token} onCancel={handleRegresar}  />
      )}

      {vista === "crear-residencial" && (
        <CrearResidencial 
          token={token} 
          onResidencialCreada={handleResidencialCreada} 
          onCancel={handleRegresar} 
        />
      )}

      {vista === "listar-residenciales" && (
        <ListarResidenciales 
          token={token} 
          onCancel={handleRegresar} 
          onSelectVista={handleSelectVista}
        />
      )}

      {vista === "usuarios-residencial" && vistaData && (
        <UsuariosResidencial 
          token={token} 
          residencialData={vistaData}
          onCancel={handleRegresar} 
        />
      )}

      {vista === "gestionar-vistas" && (
        <GestionarVistas 
          token={token} 
          onCancel={handleRegresar} 
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

export default SuperAdminDashboard;