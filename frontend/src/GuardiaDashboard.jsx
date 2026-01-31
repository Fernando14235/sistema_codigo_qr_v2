import React, { useState, useEffect } from "react";
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
  const [vista, setVista] = useState("menu");
  const [usuario, setUsuario] = useState(null);

  // Obtener info del usuario al montar
  useEffect(() => {
    api.get(`/usuario/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsuario(res.data)).catch(() => {});
  }, [token]);

  // Selección de vista
  const handleSelectVista = (newVista) => {
    setVista(newVista);
  };

  return (
    <div className="admin-dashboard">
      <UserMenu
        usuario={usuario || { nombre, rol: "guardia" }}
        ultimaConexion={usuario?.ult_conexion}
        onLogout={onLogout}
        onSelect={setVista}
        selected={vista}/>
      
      <div style={{ marginTop: 60 }}>
        {vista === 'menu' && (
          <MainMenu 
             nombre={usuario?.nombre || nombre} 
             rol={usuario?.rol} 
             onLogout={onLogout} 
             onSelectVista={handleSelectVista}/>
        )}

        {vista === 'entrada' && (
          <RegistrarEntrada token={token} onCancel={() => setVista('menu')}/>
        )}

        {vista === 'salida' && (
           <RegistrarSalida token={token} onCancel={() => setVista('menu')}/>
        )}

        {vista === 'escaneos' && (
           <Escaneos token={token} onCancel={() => setVista('menu')}/>
        )}

        {vista === 'perfil' && (
           <PerfilUsuario usuario={usuario} onRegresar={() => setVista('menu')}/>
        )}

        {vista === 'config' && (
           <ConfiguracionUsuario onRegresar={() => setVista('menu')} usuario={{ id: usuario?.id || 2, rol: 'guardia' }}/>
        )}
      </div>
    </div>
  );
}

export default GuardiaDashboard;