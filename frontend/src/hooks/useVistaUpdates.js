/**
 * Hook simple para actualizar vistas en tiempo real
 */
import { useEffect } from 'react';
import websocketService from '../services/websocketService';

export const useVistaUpdates = (token, onVistaUpdate) => {
  useEffect(() => {
    if (!token || !onVistaUpdate) return;

    // Conectar WebSocket con callback
    websocketService.connect(token, onVistaUpdate);

    return () => {
      websocketService.disconnect();
    };
  }, [token, onVistaUpdate]);
};

export default useVistaUpdates;