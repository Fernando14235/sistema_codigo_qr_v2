import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
import "./css/GuardiaDashboard.css";
import UserMenu from "./components/UI/UserMenu";
import PerfilUsuario from "./PerfilUsuario";
import ConfiguracionUsuario from "./ConfiguracionUsuario";

// Importar Vistas
import MainMenu from "./roles/Guardia/views/MainMenu";
import RegistrarEntrada from "./roles/Guardia/views/RegistrarEntrada";
import RegistrarSalida from "./roles/Guardia/views/RegistrarSalida";
import Escaneos from "./roles/Guardia/views/Escaneos";

function GuardiaDashboard({ nombre, token, onLogout }) {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener info del usuario al montar
  useEffect(() => {
    api.get(`/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  const handleSelectVista = (nuevaVista) => {
    const routeMap = {
      'menu': '/',
      'entrada': '/entrada',
      'salida': '/salida',
      'escaneos': '/escaneos',
      'perfil': '/perfil',
      'config': '/configuracion'
    };
    navigate(routeMap[nuevaVista] || '/');
  };

  const getSelectedVista = () => {
    const path = location.pathname;
    if (path === '/') return 'menu';
    if (path === '/entrada') return 'entrada';
    if (path === '/salida') return 'salida';
    if (path === '/escaneos') return 'escaneos';
    if (path === '/perfil') return 'perfil';
    if (path === '/configuracion') return 'config';
    return '';
  };

  return (
    <div className="admin-dashboard">
      <UserMenu
        usuario={usuario || { nombre, rol: "guardia" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={handleSelectVista}
        selected={getSelectedVista()} />
      
      <div style={{ marginTop: 60 }}>
        <Routes>
          <Route path="/" element={
            <MainMenu 
               nombre={usuario?.nombre || nombre} 
               rol={usuario?.rol} 
               onLogout={onLogout} 
               onSelectVista={handleSelectVista}/>
          } />

          <Route path="/entrada" element={
            <RegistrarEntrada token={token} onCancel={() => navigate('/')}/>
          } />

          <Route path="/salida" element={
             <RegistrarSalida token={token} onCancel={() => navigate('/')}/>
          } />

          <Route path="/escaneos" element={
             <Escaneos token={token} onCancel={() => navigate('/')}/>
          } />

          <Route path="/perfil" element={
             <PerfilUsuario usuario={usuario} onRegresar={() => navigate('/')}/>
          } />

          <Route path="/configuracion" element={
             <ConfiguracionUsuario onRegresar={() => navigate('/')} usuario={{ id: usuario?.id || 2, rol: 'guardia' }}/>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default GuardiaDashboard;