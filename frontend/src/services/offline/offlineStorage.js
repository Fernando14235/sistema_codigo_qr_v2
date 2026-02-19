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

      if (dataAge > maxAgeMs) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error(`Error obteniendo datos offline: ${key}`, error);
      return null;
    }
  }

  hasOfflineData(key) {
    return this.getData(key) !== null;
  }

  // Helpers específicos
  saveHistorialVisitas(historial) { return this.saveData(this.storageKeys.HISTORIAL_VISITAS, historial); }
  getHistorialVisitas() { return this.getData(this.storageKeys.HISTORIAL_VISITAS, 24); }

  saveEstadisticas(estadisticas) { return this.saveData(this.storageKeys.ESTADISTICAS, estadisticas); }
  getEstadisticas() { return this.getData(this.storageKeys.ESTADISTICAS, 6); }

  saveEscaneosDia(escaneos) { return this.saveData(this.storageKeys.ESCANEOS_DIA, escaneos); }
  getEscaneosDia() { return this.getData(this.storageKeys.ESCANEOS_DIA, 24); }

  savePublicaciones(publicaciones) { return this.saveData(this.storageKeys.PUBLICACIONES, publicaciones); }
  getPublicaciones() { return this.getData(this.storageKeys.PUBLICACIONES, 12); }

  saveComunicados(comunicados) { return this.saveData(this.storageKeys.COMUNICADOS, comunicados); }
  getComunicados() { return this.getData(this.storageKeys.COMUNICADOS, 12); }

  // Acciones pendientes
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
      return null;
    }
  }

  getPendingActions() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.PENDING_ACTIONS) || '[]');
    } catch (error) {
      return [];
    }
  }

  removePendingAction(actionId) {
    try {
      const pending = this.getPendingActions();
      const filtered = pending.filter(action => action.id !== actionId);
      localStorage.setItem(this.storageKeys.PENDING_ACTIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Limpiar todos los datos
  clearAllData() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

const offlineStorage = new OfflineStorage();
export default offlineStorage;
