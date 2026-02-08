import axios from 'axios';

// 1. Definir la URL base (usando tu variable de entorno o localhost por defecto)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Crear la instancia de Axios con la configuración CRÍTICA
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Interceptor eliminado para evitar conflictos con App.jsx
// La lógica de manejo de errores 401 se centraliza en App.jsx

export { API_URL };
export default api;