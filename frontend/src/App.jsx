import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import './css/App.css';
import { API_URL } from "./api";
import 'webrtc-adapter';

// Importar los dashboards separados
import AdminDashboard from './AdminDashboard';
import GuardiaDashboard from './GuardiaDashboard';
import ResidenteDashboard from './ResidenteDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import PWADownloadButton from './components/PWA/PWADownloadButton';
import OfflineIndicator from './components/Offline/OfflineIndicator';
import UpdateNotification from './components/PWA/UpdateNotification';

// Notificación tipo tarjeta
function Notification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

function Login({ onLogin, notification, setNotification }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setNotification({ message: "", type: "" });
    try {
      const res = await axios.post(`${API_URL}/auth/token`, 
        new URLSearchParams({ username: email, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const token = res.data.access_token;
      const userRes = await axios.get(`${API_URL}/auth/secure`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isMounted.current) {
        onLogin(token, userRes.data.usuario, userRes.data.rol);
        setNotification({ message: `Bienvenido ${userRes.data.usuario}`, type: "success" });
      }
    } catch (err) {
      if (isMounted.current) {
        setNotification({ message: "Error de login. Verifica tus datos.", type: "error" });
      }
    }
    if (isMounted.current) setCargando(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Acceso al Sistema</h2>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={cargando}>{cargando ? "Entrando..." : "Entrar"}</button>
      </form>
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

function usePushNotificationToasts(setNotification) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          setNotification({
            message: event.data.data.body || 'Nueva notificación',
            type: 'info'
          });
        }
      });
    }
  }, [setNotification]);
}

// App principal que maneja el estado de autenticacion y renderiza los dashboards
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [nombre, setNombre] = useState(localStorage.getItem("nombre") || "");
  const [rol, setRol] = useState(localStorage.getItem("rol") || "");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleLogin = (token, nombre, rol) => {
    setToken(token);
    setNombre(nombre);
    setRol(rol);
    localStorage.setItem("token", token);
    localStorage.setItem("nombre", nombre);
    localStorage.setItem("rol", rol);
    setNotification({ message: `Bienvenido ${nombre} (${rol})`, type: "success" });
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ message: "Sesión cerrada correctamente.", type: "info" });
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error);
      setNotification({
        message: "Cerrando sesión. No se pudo notificar al servidor.",
        type: "warning",
      });
    } finally {
      setToken(null);
      setNombre("");
      setRol("");
      localStorage.removeItem("token");
      localStorage.removeItem("nombre");
      localStorage.removeItem("rol");
    }
  };

  return (
    <Router>
      <div>
        <PWADownloadButton />
        <OfflineIndicator />
        <UpdateNotification />
        <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
        <Routes>
          {!token && [
            <Route key="login-root" path="/" element={<Login onLogin={handleLogin} notification={notification} setNotification={setNotification} />} />, 
            <Route key="login-any" path="*" element={<Login onLogin={handleLogin} notification={notification} setNotification={setNotification} />} />
          ]}
          {token && rol === "admin" && [
            <Route key="admin-root" path="/" element={<AdminDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />, 
            <Route key="admin-any" path="*" element={<AdminDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          ]}
          {token && rol === "guardia" && [
            <Route key="guardia-root" path="/" element={<GuardiaDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />, 
            <Route key="guardia-any" path="*" element={<GuardiaDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          ]}
          {token && rol === "residente" && [
            <Route key="residente-root" path="/" element={<ResidenteDashboard token={token} nombre={nombre}  onLogout={handleLogout} />} />,
            <Route key="residente-any" path="*" element={<ResidenteDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          ]}
          {token && rol === "super_admin" && [
            <Route key="super-admin-root" path="/" element={<SuperAdminDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />,
            <Route key="super-admin-any" path="*" element={<SuperAdminDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          ]}
        </Routes>
      </div>
    </Router>
  );
}

export default App;