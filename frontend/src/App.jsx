import React, { useState, useRef, useEffect } from "react";
import api, { API_URL } from "./api"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './css/App.css';
import 'webrtc-adapter';
import AdminDashboard from './AdminDashboard';
import GuardiaDashboard from './GuardiaDashboard';
import ResidenteDashboard from './ResidenteDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import PWADownloadButton from './components/PWA/PWADownloadButton';

import PushNotificationManager from './components/PWA/PushNotificationManager';

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
      // Nota: No hace falta poner la URL completa ni withCredentials (ya está en api.js)
      const res = await api.post(`/auth/token`, 
        new URLSearchParams({ username: email, password }),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        }
      );
      
      const { access_token, usuario, rol, residencial_id, usuario_id, tipo_entidad } = res.data;

      if (!access_token) {
        throw new Error("No se recibió un token de acceso válido.");
      }
      
      if (isMounted.current) {
        onLogin(access_token, null, usuario, rol, residencial_id, usuario_id, tipo_entidad);
        setNotification({ message: `Bienvenido ${usuario}`, type: "success" });
        console.log("✅ Login exitoso, token guardado");
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
          required/>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required/>
        <button type="submit" disabled={cargando}>{cargando ? "Entrando..." : "Entrar"}</button>
      </form>
      <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
    </div>
  );
}

// Configurar interceptor de Axios
// Recibe refs en lugar de valores directos para evitar stale closures
function setupAxiosInterceptors(handleLogoutRef, tokenRef, setToken, setNombre, setRol, setUsuarioId, setNotification, setTipoEntidad) {
  // Variables de control LOCALES: se resetean correctamente al re-registrar
  let isRefreshing = false;
  let failedQueue = [];
  let isLoggingOut = false;

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    failedQueue = [];
  };

  // Interceptor REQUEST: lee tokenRef para tener siempre el token más reciente
  const reqInterceptor = api.interceptors.request.use(
    (config) => {
      const token = tokenRef.current || localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor RESPONSE
  const resInterceptor = api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Guard 1: si ya estamos en proceso de logout, cortar el ciclo
      if (isLoggingOut) return Promise.reject(error);

      // Guard 2: sin token no tiene sentido intentar refresh
      const currentToken = tokenRef.current || localStorage.getItem("token");
      if (!currentToken) return Promise.reject(error);

      // Guard 3: error de red sin respuesta HTTP → rechazar sin logout
      if (!error.response) return Promise.reject(error);

      const status = error.response.status;

      // Guard 4: nunca reentrar en endpoints de autenticación
      const isAuthEndpoint = originalRequest.url &&
        (originalRequest.url.includes("/auth/token") ||
         originalRequest.url.includes("/auth/refresh") ||
         originalRequest.url.includes("/auth/logout"));
      if (isAuthEndpoint) return Promise.reject(error);

      // 403 = Sin cookie de refresh token → logout forzado directo
      // No llamar /auth/refresh: tampoco tendrá cookie
      if (status === 403) {
        isLoggingOut = true;
        processQueue(error, null);
        // isForced=true: el backend ya lo sabe, no llamar /auth/logout
        handleLogoutRef.current("Sesión no encontrada. Inicia sesión nuevamente.", true);
        return Promise.reject(error);
      }

      // Solo intentar refresh para 401 (access token expirado/inválido)
      if (status !== 401) return Promise.reject(error);

      // Evitar double-refresh en la misma petición
      if (originalRequest._retry) return Promise.reject(error);
      originalRequest._retry = true;

      // Si ya hay un refresh en progreso, encolar esta petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        console.log("🔄 Intentando renovar token...");
        const refreshRes = await api.post(`/auth/refresh`, {});
        const { access_token, usuario, rol, usuario_id, tipo_entidad } = refreshRes.data;
        console.log("✅ Token renovado exitosamente");

        localStorage.setItem("token", access_token);
        if (usuario) localStorage.setItem("nombre", usuario);
        if (rol) localStorage.setItem("rol", rol);
        if (usuario_id) localStorage.setItem("usuario_id", usuario_id.toString());
        if (tipo_entidad) localStorage.setItem("tipo_entidad", tipo_entidad);

        setToken(access_token);
        if (usuario) setNombre(usuario);
        if (rol) setRol(rol);
        if (usuario_id) setUsuarioId(usuario_id);
        if (tipo_entidad && setTipoEntidad) setTipoEntidad(tipo_entidad);

        processQueue(null, access_token);
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error("❌ Falló renovación de token:", refreshError);
        processQueue(refreshError, null);
        if (!isLoggingOut) {
          isLoggingOut = true;
          // isForced=true: refresh falló, backend ya lo sabe, no llamar /auth/logout
          handleLogoutRef.current("Tu sesión ha expirado. Por favor inicia sesión nuevamente.", true);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  // Cleanup completo: resetear todo el estado local
  return () => {
    isLoggingOut = false;
    isRefreshing = false;
    failedQueue = [];
    api.interceptors.request.eject(reqInterceptor);
    api.interceptors.response.eject(resInterceptor);
  };
}

function usePushNotificationToasts(setNotification) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handler = (event) => {
        // Manejar notificaciones push (mostrar toast)
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          setNotification({
            message: event.data.data.body || 'Nueva notificación',
            type: 'info'
          });
        }
        
        // Manejar clicks en notificaciones (navegar a la URL)
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const url = event.data.url || '/';
          console.log('📍 Navegando a:', url);
          
          if (url.startsWith('http')) {
            window.location.href = url;
          } else {
            // Para rutas relativas, usar pathname
            window.location.pathname = url;
          }
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, [setNotification]);
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [nombre, setNombre] = useState(localStorage.getItem("nombre") || "");
  const [rol, setRol] = useState(localStorage.getItem("rol") || "");
  const [usuarioId, setUsuarioId] = useState(localStorage.getItem("usuario_id") || null);
  const [tipoEntidad, setTipoEntidad] = useState(localStorage.getItem("tipo_entidad") || "residencial");
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Refs para evitar stale closures en el interceptor (registrado una sola vez)
  const handleLogoutRef = useRef(null);
  const tokenRef = useRef(token);

  // Mantener tokenRef sincronizado con el estado
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const handleLogin = (accessToken, refreshToken, usuario, rol, residencialId, usuarioId, tipoEntidadVal) => {
    setToken(accessToken);
    setNombre(usuario);
    setRol(rol);
    setUsuarioId(usuarioId);
    setTipoEntidad(tipoEntidadVal || "residencial");
    
    localStorage.setItem("token", accessToken);
    localStorage.setItem("nombre", usuario);
    localStorage.setItem("rol", rol);
    localStorage.setItem("tipo_entidad", tipoEntidadVal || "residencial");
    if (residencialId) {
      localStorage.setItem("residencial_id", residencialId.toString());
    }
    if (usuarioId) {
      localStorage.setItem("usuario_id", usuarioId.toString());
    }
  };

  // isForced=true cuando lo llama el interceptor: solo limpieza local, no llama backend
  // (el backend ya invalidó la sesión; llamar /auth/logout generaría un 401 innecesario)
  const handleLogout = async (reason = null, isForced = false) => {
    try {
      if (!isForced && tokenRef.current) {
        await api.post(`/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        }).catch(() => {/* Ignorar error de red en logout voluntario */});
      }
    } finally {
      setToken(null);
      setNombre("");
      setRol("");
      setUsuarioId(null);
      localStorage.removeItem("token");
      localStorage.removeItem("nombre");
      localStorage.removeItem("rol");
      localStorage.removeItem("residencial_id");
      localStorage.removeItem("usuario_id");
      localStorage.removeItem("tipo_entidad");
      console.log("🚪 Logout local completado");

      const finalMessage = typeof reason === "string" ? reason : "Sesión cerrada correctamente";
      const finalType = (reason && typeof reason === "string") ? "error" : "info";
      setNotification({ message: finalMessage, type: finalType });
    }
  };

  // Asignar en cada render: el interceptor siempre llama la versión más reciente
  handleLogoutRef.current = handleLogout;

  // Registrar interceptores UNA VEZ usando refs (no re-registra en cada render)
  useEffect(() => {
    const cleanup = setupAxiosInterceptors(
      handleLogoutRef, tokenRef,
      setToken, setNombre, setRol, setUsuarioId, setNotification, setTipoEntidad
    );
    return cleanup;
  }, []); // [] es correcto porque usamos refs, no valores del estado

  usePushNotificationToasts(setNotification);

  return (
    <Router>
      <div>
        <PWADownloadButton />

        {/* Renderizar PushNotificationManager solo si hay usuario logueado */}
        {token && <PushNotificationManager token={token} usuario={{ id: usuarioId, nombre, rol }} />}
        
        <Notification {...notification} onClose={() => setNotification({ message: "", type: "" })} />
        <Routes>
          {!token && [
            <Route key="login-root" path="/" element={<Login onLogin={handleLogin} notification={notification} setNotification={setNotification} />} />, 
            <Route key="login-any" path="*" element={<Login onLogin={handleLogin} notification={notification} setNotification={setNotification} />} />
          ]}
          {token && (rol === "admin" || rol === "admin_residencial") && (
            <Route path="/*" element={<AdminDashboard token={token} nombre={nombre} rol={rol} onLogout={handleLogout} />} />
          )}
          {token && rol === "guardia" && (
            <Route path="/*" element={<GuardiaDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          )}
          {token && rol === "residente" && (
            <Route path="/*" element={<ResidenteDashboard token={token} nombre={nombre}  onLogout={handleLogout} />} />
          )}
          {token && rol === "super_admin" && (
            <Route path="/*" element={<SuperAdminDashboard token={token} nombre={nombre} onLogout={handleLogout} />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}
export default App;