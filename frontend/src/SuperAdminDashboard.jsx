import React, { useState } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from "react-router-dom";
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
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectVista = (nuevaVista, data = null) => {
    if (nuevaVista === "menu") {
      navigate("/");
      return;
    }

    if (nuevaVista === "usuarios-residencial" && data) {
      navigate(`/usuarios-residencial/${data.residencialId}`);
    } else {
      navigate(`/${nuevaVista}`);
    }
  };

  const handleRegresar = () => {
    navigate("/");
  };

  const handleAdminCreado = () => {
    setNotification({ message: "Administrador creado exitosamente", type: "success" });
    setTimeout(() => navigate("/listar-admins"), 1500);
  };

  const handleResidencialCreada = () => {
    setNotification({ message: "Residencial creada exitosamente", type: "success" });
    setTimeout(() => navigate("/"), 2000);
  };

  // Wrapper para pasar parámetros de URL a la vista
  const UsuariosResidencialWrapper = () => {
    const { id } = useParams();
    return (
      <UsuariosResidencial 
        token={token} 
        residencialData={{ residencialId: id }}
        onCancel={() => navigate("/listar-residenciales")} 
        onLogout={onLogout}
      />
    );
  };

  return (
    <div className="super-admin-dashboard">
      <div className="pwa-button-container">
        <PWADownloadButton />
      </div>
      
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
      
      <Routes>
        <Route path="/" element={
          <MainMenu 
            nombre={nombre} 
            onLogout={onLogout} 
            onSelectVista={handleSelectVista} 
          />
        } />

        <Route path="/crear-admin" element={
          <CrearAdmin 
            token={token} 
            onAdminCreado={handleAdminCreado} 
            onCancel={handleRegresar}
            onNotification={setNotification}
          />
        } />

        <Route path="/listar-admins" element={
          <ListarAdmins token={token} onCancel={handleRegresar}  />
        } />

        <Route path="/crear-residencial" element={
          <CrearResidencial 
            token={token} 
            onResidencialCreada={handleResidencialCreada} 
            onCancel={handleRegresar} 
          />
        } />

        <Route path="/listar-residenciales" element={
          <ListarResidenciales 
            token={token} 
            onCancel={handleRegresar} 
            onSelectVista={handleSelectVista}
          />
        } />

        <Route path="/usuarios-residencial/:id" element={<UsuariosResidencialWrapper />} />

        <Route path="/gestionar-vistas" element={
          <GestionarVistas 
            token={token} 
            onCancel={handleRegresar} 
            onLogout={onLogout}
          />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default SuperAdminDashboard;