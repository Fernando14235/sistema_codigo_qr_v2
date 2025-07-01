// Servicio para manejar el almacenamiento offline de datos
class OfflineStorage {
  constructor() {
    this.storageKeys = {
      HISTORIAL_VISITAS: 'offline_historial_visitas',
      ESTADISTICAS: 'offline_estadisticas',
      ESCANEOS_DIA: 'offline_escaneos_dia',
      PUBLICACIONES: 'offline_publicaciones',
      COMUNICADOS: 'offline_comunicados',
      PENDING_ACTIONS: 'pendingActions'
    };
  }

  // Guardar datos con timestamp
  saveData(key, data) {
    const dataWithTimestamp = {
      data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
      console.log(`💾 Datos guardados offline: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error guardando datos offline: ${key}`, error);
      return false;
    }
  }

  // Obtener datos con validación de timestamp
  getData(key, maxAgeHours = 24) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const dataAge = new Date() - new Date(parsed.timestamp);
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      // Si los datos son muy antiguos, no los devolvemos
      if (dataAge > maxAgeMs) {
        console.log(`⏰ Datos expirados: ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error(`Error obteniendo datos offline: ${key}`, error);
      return null;
    }
  }

  // Verificar si hay datos offline disponibles
  hasOfflineData(key) {
    return this.getData(key) !== null;
  }

  // Limpiar datos expirados
  cleanupExpiredData() {
    Object.values(this.storageKeys).forEach(key => {
      this.getData(key); // Esto automáticamente limpia datos expirados
    });
  }

  // Guardar historial de visitas offline
  saveHistorialVisitas(historial) {
    return this.saveData(this.storageKeys.HISTORIAL_VISITAS, historial);
  }

  // Obtener historial de visitas offline
  getHistorialVisitas() {
    return this.getData(this.storageKeys.HISTORIAL_VISITAS, 24); // 24 horas
  }

  // Guardar estadísticas offline
  saveEstadisticas(estadisticas) {
    return this.saveData(this.storageKeys.ESTADISTICAS, estadisticas);
  }

  // Obtener estadísticas offline
  getEstadisticas() {
    return this.getData(this.storageKeys.ESTADISTICAS, 6); // 6 horas
  }

  // Guardar escaneos del día offline
  saveEscaneosDia(escaneos) {
    return this.saveData(this.storageKeys.ESCANEOS_DIA, escaneos);
  }

  // Obtener escaneos del día offline
  getEscaneosDia() {
    return this.getData(this.storageKeys.ESCANEOS_DIA, 24); // 24 horas
  }

  // Guardar publicaciones offline
  savePublicaciones(publicaciones) {
    return this.saveData(this.storageKeys.PUBLICACIONES, publicaciones);
  }

  // Obtener publicaciones offline
  getPublicaciones() {
    return this.getData(this.storageKeys.PUBLICACIONES, 12); // 12 horas
  }

  // Guardar comunicados offline
  saveComunicados(comunicados) {
    return this.saveData(this.storageKeys.COMUNICADOS, comunicados);
  }

  // Obtener comunicados offline
  getComunicados() {
    return this.getData(this.storageKeys.COMUNICADOS, 12); // 12 horas
  }

  // Agregar acción pendiente
  addPendingAction(action) {
    try {
      const pending = JSON.parse(localStorage.getItem(this.storageKeys.PENDING_ACTIONS) || '[]');
      const newAction = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action
      };
      pending.push(newAction);
      localStorage.setItem(this.storageKeys.PENDING_ACTIONS, JSON.stringify(pending));
      return newAction;
    } catch (error) {
      console.error('Error agregando acción pendiente:', error);
      return null;
    }
  }

  // Obtener acciones pendientes
  getPendingActions() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.PENDING_ACTIONS) || '[]');
    } catch (error) {
      console.error('Error obteniendo acciones pendientes:', error);
      return [];
    }
  }

  // Remover acción pendiente
  removePendingAction(actionId) {
    try {
      const pending = this.getPendingActions();
      const filtered = pending.filter(action => action.id !== actionId);
      localStorage.setItem(this.storageKeys.PENDING_ACTIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removiendo acción pendiente:', error);
      return false;
    }
  }

  // Limpiar todas las acciones pendientes
  clearPendingActions() {
    try {
      localStorage.removeItem(this.storageKeys.PENDING_ACTIONS);
      return true;
    } catch (error) {
      console.error('Error limpiando acciones pendientes:', error);
      return false;
    }
  }

  // Obtener información del almacenamiento
  getStorageInfo() {
    const info = {};
    Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
      const data = this.getData(storageKey);
      info[key] = {
        hasData: data !== null,
        dataType: data ? typeof data : null,
        isArray: Array.isArray(data),
        itemCount: Array.isArray(data) ? data.length : null
      };
    });
    return info;
  }
}

// Instancia singleton
const offlineStorage = new OfflineStorage();

export default offlineStorage; 