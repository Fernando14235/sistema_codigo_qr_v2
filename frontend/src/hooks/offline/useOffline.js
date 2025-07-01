import { useState, useEffect, useCallback } from 'react';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Conexión restaurada');
      // Sincronizar acciones pendientes cuando se recupere la conexión
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Conexión perdida - Modo offline activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Agregar acción pendiente para sincronización
  const addPendingAction = useCallback((action) => {
    const newAction = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    setPendingActions(prev => [...prev, newAction]);
    
    // Guardar en localStorage para persistencia
    const stored = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    stored.push(newAction);
    localStorage.setItem('pendingActions', JSON.stringify(stored));
    
    console.log('📝 Acción pendiente agregada:', action.type);
  }, []);

  // Sincronizar acciones pendientes
  const syncPendingActions = useCallback(async () => {
    const stored = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    if (stored.length === 0) return;

    console.log('🔄 Sincronizando acciones pendientes...');
    
    const successfulActions = [];
    const failedActions = [];

    for (const action of stored) {
      try {
        // Aquí se procesarían las acciones según su tipo
        switch (action.type) {
          case 'REGISTER_ENTRY':
            // Lógica para registrar entrada
            console.log('Sincronizando entrada:', action.data);
            break;
          case 'REGISTER_EXIT':
            // Lógica para registrar salida
            console.log('Sincronizando salida:', action.data);
            break;
          case 'CREATE_VISIT':
            // Lógica para crear visita
            console.log('Sincronizando visita:', action.data);
            break;
          default:
            console.log('Acción desconocida:', action.type);
        }
        
        successfulActions.push(action.id);
      } catch (error) {
        console.error('Error sincronizando acción:', error);
        failedActions.push(action.id);
      }
    }

    // Remover acciones exitosas
    const remainingActions = stored.filter(action => 
      !successfulActions.includes(action.id)
    );
    
    localStorage.setItem('pendingActions', JSON.stringify(remainingActions));
    setPendingActions(remainingActions);

    if (successfulActions.length > 0) {
      console.log(`✅ ${successfulActions.length} acciones sincronizadas exitosamente`);
    }
    
    if (failedActions.length > 0) {
      console.log(`❌ ${failedActions.length} acciones fallaron en la sincronización`);
    }
  }, []);

  // Cargar acciones pendientes al inicializar
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    setPendingActions(stored);
  }, []);

  return {
    isOnline,
    pendingActions,
    addPendingAction,
    syncPendingActions
  };
}; 