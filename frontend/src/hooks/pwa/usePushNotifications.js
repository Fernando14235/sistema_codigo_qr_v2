import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';

export const usePushNotifications = (userId, userRole) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar soporte y permisos al inicializar
  useEffect(() => {
    const checkSupport = () => {
      const supported = pushNotificationService.isPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        const currentPermission = pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);
      }
    };

    checkSupport();
  }, []);

  // Suscribirse a notificaciones push
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId || !userRole) {
      console.log('No se puede suscribir: falta soporte, userId o userRole');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await pushNotificationService.subscribeToPush(userId, userRole);
      setIsSubscribed(success);
      
      if (success) {
        setPermission('granted');
        console.log('✅ Suscrito exitosamente a notificaciones push');
      }
      
      return success;
    } catch (error) {
      console.error('Error suscribiéndose a notificaciones:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId, userRole]);

  // Desuscribirse de notificaciones push
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribeFromPush();
      setIsSubscribed(!success);
      
      if (success) {
        console.log('✅ Desuscrito exitosamente de notificaciones push');
      }
      
      return success;
    } catch (error) {
      console.error('Error desuscribiéndose de notificaciones:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Solicitar permisos
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications no están soportadas');
      return false;
    }

    setIsLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted && userId && userRole) {
        // Auto-suscribirse si se conceden permisos
        await subscribe();
      }
      
      return granted;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId, userRole, subscribe]);

  // Mostrar notificación local
  const showNotification = useCallback((type, data = {}) => {
    if (!isSupported || permission !== 'granted') {
      console.log('No se pueden mostrar notificaciones: sin soporte o permisos');
      return false;
    }

    const content = pushNotificationService.getNotificationContent(type, data);
    return pushNotificationService.showLocalNotification(content.title, {
      body: content.body,
      icon: content.icon,
      data: {
        type,
        ...data
      }
    });
  }, [isSupported, permission]);

  // Verificar si el usuario debe recibir este tipo de notificación
  const shouldReceiveNotification = useCallback((type) => {
    if (!userRole) return false;
    
    const allowedTypes = pushNotificationService.getNotificationTypes(userRole);
    return allowedTypes.includes(type);
  }, [userRole]);

  // Obtener tipos de notificación permitidos para el rol
  const getAllowedNotificationTypes = useCallback(() => {
    if (!userRole) return [];
    return pushNotificationService.getNotificationTypes(userRole);
  }, [userRole]);

  // Manejar notificación recibida
  const handleNotificationReceived = useCallback((notification) => {
    const { type, ...data } = notification.data || {};
    
    if (shouldReceiveNotification(type)) {
      showNotification(type, data);
    }
  }, [shouldReceiveNotification, showNotification]);

  // Configurar listener para notificaciones push
  useEffect(() => {
    if (!isSupported || permission !== 'granted') return;

    const handlePushMessage = (event) => {
      if (event.data) {
        try {
          const notification = JSON.parse(event.data.text());
          handleNotificationReceived(notification);
        } catch (error) {
          console.error('Error procesando notificación push:', error);
        }
      }
    };

    // Escuchar mensajes del service worker
    navigator.serviceWorker.addEventListener('message', handlePushMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handlePushMessage);
    };
  }, [isSupported, permission, handleNotificationReceived]);

  return {
    // Estado
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    
    // Acciones
    subscribe,
    unsubscribe,
    requestPermission,
    showNotification,
    
    // Utilidades
    shouldReceiveNotification,
    getAllowedNotificationTypes,
    handleNotificationReceived
  };
}; 