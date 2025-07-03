import { useCallback } from 'react';
import { useOffline } from './useOffline';
import offlineStorage from '../../services/offline/offlineStorage'; 
import axios from 'axios';
import { API_URL } from '../../api';

export const useOfflineOperations = (token, rol) => {
  const { isOnline, addPendingAction } = useOffline();

  // Función para cargar datos con fallback offline
  const loadDataWithOfflineFallback = useCallback(async (endpoint, storageKey, options = {}) => {
    const { maxAgeHours = 24, transformData = null } = options;

    try {
      if (isOnline) {
        // Intentar cargar desde la API
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = transformData ? transformData(response.data) : response.data;
        
        // Guardar en cache offline
        offlineStorage.saveData(storageKey, data);
        
        return { data, source: 'online' };
      } else {
        // Cargar desde cache offline
        const offlineData = offlineStorage.getData(storageKey, maxAgeHours);
        
        if (offlineData) {
          return { data: offlineData, source: 'offline' };
        } else {
          throw new Error('No hay datos offline disponibles');
        }
      }
    } catch (error) {
      // Si falla online, intentar offline
      if (isOnline) {
        const offlineData = offlineStorage.getData(storageKey, maxAgeHours);
        if (offlineData) {
          return { data: offlineData, source: 'offline-fallback' };
        }
      }
      throw error;
    }
  }, [isOnline, token]);

  // Función para registrar entrada (Guardia)
  const registerEntry = useCallback(async (qrData) => {
    const actionData = {
      type: 'REGISTER_ENTRY',
      data: {
        qr_data: qrData,
        timestamp: new Date().toISOString(),
        guard_id: null // Se obtendrá del token cuando se sincronice
      }
    };

    if (isOnline) {
      try {
        const response = await axios.post(`${API_URL}/visitas/guardia/registrar-entrada`, {
          qr_data: qrData
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true, data: response.data };
      } catch (error) {
        // Si falla, guardar como pendiente
        addPendingAction(actionData);
        return { success: false, error: 'Error al registrar entrada. Se guardará para sincronización.' };
      }
    } else {
      // Modo offline - guardar como pendiente
      addPendingAction(actionData);
      return { success: true, message: 'Entrada registrada offline. Se sincronizará cuando se recupere la conexión.' };
    }
  }, [isOnline, token, addPendingAction]);

  // Función para registrar salida (Guardia)
  const registerExit = useCallback(async (qrData) => {
    const actionData = {
      type: 'REGISTER_EXIT',
      data: {
        qr_data: qrData,
        timestamp: new Date().toISOString(),
        guard_id: null
      }
    };

    if (isOnline) {
      try {
        const response = await axios.post(`${API_URL}/visitas/guardia/registrar-salida`, {
          qr_data: qrData
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true, data: response.data };
      } catch (error) {
        addPendingAction(actionData);
        return { success: false, error: 'Error al registrar salida. Se guardará para sincronización.' };
      }
    } else {
      addPendingAction(actionData);
      return { success: true, message: 'Salida registrada offline. Se sincronizará cuando se recupere la conexión.' };
    }
  }, [isOnline, token, addPendingAction]);

  // Función para crear visita (Residente - solo online)
  const createVisit = useCallback(async (visitData) => {
    if (!isOnline) {
      return { success: false, error: 'No se pueden crear visitas sin conexión a internet.' };
    }

    try {
      const response = await axios.post(`${API_URL}/visitas/residente/crear`, visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Error al crear visita.' };
    }
  }, [isOnline, token]);

  // Funciones específicas por rol
  const adminOperations = {
    // Cargar historial de visitas
    loadHistorialVisitas: (filters = {}) => 
      loadDataWithOfflineFallback('/visitas/admin/historial', 'offline_historial_visitas', {
        maxAgeHours: 24,
        transformData: (data) => data
      }),

    // Cargar estadísticas
    loadEstadisticas: () => 
      loadDataWithOfflineFallback('/admin/estadisticas', 'offline_estadisticas', {
        maxAgeHours: 6
      }),

    // Cargar escaneos del día
    loadEscaneosDia: (filters = {}) => 
      loadDataWithOfflineFallback('/visitas/admin/escaneos-dia', 'offline_escaneos_dia', {
        maxAgeHours: 24
      }),

    // Cargar publicaciones
    loadPublicaciones: () => 
      loadDataWithOfflineFallback('/social/publicaciones', 'offline_publicaciones', {
        maxAgeHours: 12
      })
  };

  const guardiaOperations = {
    registerEntry,
    registerExit,
    // Cargar escaneos del guardia
    loadEscaneosGuardia: () => 
      loadDataWithOfflineFallback('/visitas/guardia/escaneos-dia', 'offline_escaneos_guardia', {
        maxAgeHours: 24
      })
  };

  const residenteOperations = {
    createVisit,
    // Cargar comunicados
    loadComunicados: () => 
      loadDataWithOfflineFallback('/comunicados', 'offline_comunicados', {
        maxAgeHours: 12
      }),

    // Cargar visitas del residente
    loadVisitasResidente: () => 
      loadDataWithOfflineFallback('/visitas/residente/mis-visitas', 'offline_visitas_residente', {
        maxAgeHours: 24
      })
  };

  // Retornar operaciones según el rol
  switch (rol) {
    case 'admin':
      return { ...adminOperations, isOnline };
    case 'guardia':
      return { ...guardiaOperations, isOnline };
    case 'residente':
      return { ...residenteOperations, isOnline };
    default:
      return { isOnline };
  }
}; 