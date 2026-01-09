import axios from 'axios';

// 1. Definir la URL base (usando tu variable de entorno o localhost por defecto)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Crear la instancia de Axios con la configuración CRÍTICA
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // <--- ESTO ES LO QUE TE FALTA. Sin esto, no se envían cookies.
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. (Opcional) Interceptor para depurar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log("Sesión expirada o no autorizada");
            // Aquí podrías redirigir al login si quisieras
        }
        return Promise.reject(error);
    }
);

export { API_URL };
export default api;