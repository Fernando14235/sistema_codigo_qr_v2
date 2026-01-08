import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true  // Importante para recibir cookies
        }
      );
      
      // Extraer datos de la respuesta (ya no incluye refresh_token porque va en cookie)
      const { access_token, usuario, rol, residencial_id } = res.data;
      
      if (isMounted.current) {
        // Solo pasar access_token, el refresh_token está en cookie HttpOnly
        onLogin(access_token, null, usuario, rol, residencial_id);
        setNotification({ message: `Bienvenido ${usuario}`, type: "success" });
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMsg = err.response?.data?.detail || "Error de login. Verifica tus datos.";
        setNotification({ message: errorMsg, type: "error" });
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

// Configurar interceptor de Axios para manejo automático de refresh tokens
function setupAxiosInterceptors(setToken, setNotification, handleLogout) {
  // Limpiar interceptores existentes para evitar duplicados
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();

  // Configurar axios para enviar cookies automáticamente
  axios.defaults.withCredentials = true;

  // Interceptor para requests - agregar token automáticamente
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`📤 Request a ${config.url} con token`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor para responses - manejar 401 y refresh automático
  axios.interceptors.response.use(
    (response) => {
      console.log(`✅ Response exitoso de ${response.config.url}`);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      console.log(`❌ Error ${error.response?.status} en ${originalRequest?.url}`);
      
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          console.log("🔄 Token expirado, renovando automáticamente...");
          
          // ✅ Validar que existe refresh token en cookies antes de intentar renovar
          const hasRefreshToken = document.cookie.split(';').some(
            cookie => cookie.trim().startsWith('refresh_token=')
          );
          
          if (!hasRefreshToken) {
            console.log("⚠️ No hay refresh token en cookies - redirigiendo a login");
            setNotification({
              message: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
              type: "warning"
            });
            // Limpiar localStorage y forzar logout para evitar bucle infinito
            localStorage.removeItem("token");
            localStorage.removeItem("nombre");
            localStorage.removeItem("rol");
            localStorage.removeItem("residencial_id");
            setToken(null);
            handleLogout();
            return Promise.reject(error);
          }
          
          // Crear una nueva instancia de axios para evitar interceptores recursivos
          // El refresh token se envía automáticamente en las cookies
          const refreshResponse = await axios.create({
            withCredentials: true
          }).post(`${API_URL}/auth/refresh`);
          
          const newAccessToken = refreshResponse.data.access_token;
          
          // Actualizar token en localStorage y estado
          localStorage.setItem("token", newAccessToken);
          setToken(newAccessToken);
          
          // Actualizar header de la petición original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          console.log("✅ Token renovado exitosamente, reintentando petición original");
          
          // Reintentar la petición original
          return axios(originalRequest);
          
        } catch (refreshError) {
          console.error("❌ Error al renovar token:", refreshError);
          
          // Analizar el tipo de error antes de cerrar sesión
          const isNetworkError = !refreshError.response;
          const isCorsError = refreshError.response?.status === 0;
          const status = refreshError.response?.status;
          
          if (isNetworkError || isCorsError) {
            // Error de red o CORS - NO cerrar sesión, solo mostrar error
            console.log("🌐 Error de conectividad, manteniendo sesión");
            setNotification({
              message: "Error de conexión. Verifica tu red e intenta nuevamente.",
              type: "error"
            });
            return Promise.reject(refreshError);
          }
          
          if (status === 403) {
            // Refresh token faltante (403 Forbidden)
            console.log("🔒 Refresh token no encontrado en cookies - forzando logout");
            setNotification({
              message: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
              type: "warning"
            });
            // Forzar logout completo para evitar bucle infinito
            handleLogout();
          } else if (status === 401) {
            // Refresh token inválido/expirado (401 Unauthorized)
            console.log("🔒 Refresh token expirado o inválido, cerrando sesión");
            setNotification({
              message: "Sesión expirada. Por favor, inicia sesión nuevamente.",
              type: "warning"
            });
            handleLogout();
          } else {
            // Otro error del servidor - mantener sesión pero mostrar error
            console.log("⚠️ Error del servidor, manteniendo sesión");
            setNotification({
              message: "Error del servidor. Intenta nuevamente.",
              type: "error"
            });
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
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

  const handleLogin = (accessToken, refreshToken, usuario, rol, residencialId) => {
    setToken(accessToken);
    setNombre(usuario);
    setRol(rol);
    
    // Solo guardar access token y datos de usuario en localStorage
    // El refresh token está en cookie HttpOnly (más seguro)
    localStorage.setItem("token", accessToken);
    localStorage.setItem("nombre", usuario);
    localStorage.setItem("rol", rol);
    if (residencialId) {
      localStorage.setItem("residencial_id", residencialId.toString());
    }
    
    console.log("✅ Login exitoso - Access token guardado, refresh token en cookie HttpOnly");
    setNotification({ message: `Bienvenido ${usuario} (${rol})`, type: "success" });
  };

  const handleLogout = async () => {
    try {
      // Intentar notificar al backend del logout (esto también limpiará la cookie)
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true  // Importante para enviar cookies
        });
      }
      setNotification({ message: "Sesión cerrada correctamente.", type: "info" });
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error);
      setNotification({
        message: "Cerrando sesión. No se pudo notificar al servidor.",
        type: "warning",
      });
    } finally {
      // Limpiar todos los datos de autenticación
      setToken(null);
      setNombre("");
      setRol("");
      
      // Limpiar localStorage (ya no incluye refresh_token porque está en cookie)
      localStorage.removeItem("token");
      localStorage.removeItem("nombre");
      localStorage.removeItem("rol");
      localStorage.removeItem("residencial_id");
      
      console.log("🚪 Logout completado - Access token limpiado, refresh token revocado en servidor");
    }
  };

  // Configurar interceptores de Axios al montar el componente
  useEffect(() => {
    setupAxiosInterceptors(setToken, setNotification, handleLogout);
  }, []);

  // Hook para notificaciones push
  usePushNotificationToasts(setNotification);

  return (
    <Router>
      <div>
        <PWADownloadButton />
        <OfflineIndicator />
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