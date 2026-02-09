import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';

/**
 * Hook para manejar notificaciones push
 * ✅ Implementa todas las mejores prácticas:
 * - Anti-race conditions con isSubscribing lock
 * - Session validation antes de llamadas backend
 * - Retry mechanism con exponential backoff
 * - Auto-recovery de suscripciones expiradas
 * - Separación de lógica de negocio y UI
 */
export const usePushNotifications = (token, userId, userRole) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false); // 🔒 ANTI-RACE LOCK

  // ✅ REFINEMENT 3: Session Validation
  const validateSession = useCallback((authToken) => {
    if (!authToken || authToken.trim() === '') {
      console.log('⚠️ No auth token, skipping backend sync');
      return false;
    }
    return true;
  }, []);

  // ✅ REFINEMENT 5: Retry Mechanism with Exponential Backoff
  const subscribeWithRetry = useCallback(async (maxRetries = 3) => {
    if (!validateSession(token)) {
      return false;
    }

    if (!userId || !userRole) {
      return false;
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await pushNotificationService.subscribeToPush(token);
        if (success) {
          console.log(`✅ Subscription successful on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Subscription attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('❌ Failed after max retries');
          return false;
        }
        
        // Exponential backoff: 1s, 2s, 4s (max 5s)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return false;
  }, [token]);

  // ✅ REFINEMENT 1: Subscribe with Anti-Race Condition
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId || !userRole) {
      // Info level - this is normal during initial render before usuario loads
      console.log('ℹ️ Cannot subscribe yet - waiting for:', {
        isSupported,
        hasUserId: !!userId,
        hasUserRole: !!userRole,
        hasToken: !!token
      });
      return false;
    }

    // 🔒 ANTI-RACE: Check if already subscribing
    if (isSubscribing) {
      console.log('⚠️ Subscription already in progress, aborting');
      return false;
    }

    // ✅ REFINEMENT 3: Validate session before attempt
    if (!validateSession(token)) {
      return false;
    }

    setIsSubscribing(true);
    setIsLoading(true);
    
    try {
      const success = await subscribeWithRetry();
      setIsSubscribed(success);
      
      if (success) {
        setPermission('granted'); // ✅ FIX: Must be string 'granted', not boolean
        console.log('✅ Subscribed successfully to push notifications');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      return false;
    } finally {
      setIsSubscribing(false);
      setIsLoading(false);
    }
  }, [isSupported, userId, userRole, token, isSubscribing, validateSession, subscribeWithRetry]);

  // Unsubscribe from push
  const unsubscribe = useCallback(async () => {
    if (!validateSession(token)) {
      return false;
    }

    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribeFromPush(token);
      setIsSubscribed(!success);
      
      if (success) {
        console.log('✅ Unsubscribed successfully from push notifications');
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, validateSession]);

  // ✅ REFINEMENT 2: Auto-check and Silent Re-subscription (Business Logic in Hook)
  useEffect(() => {
    if (!token || !userId || !userRole ||!isSupported) return;

    const checkAndRecover = async () => {
      const currentPermission = pushNotificationService.getPermissionStatus();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            setIsSubscribed(true);
            console.log('✅ Active subscription found');
          } else if (!isSubscribing) {
            // Silent re-subscription for users who already granted permission
            console.log('🔄 Permission granted but no subscription, recovering...');
            await subscribe();
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };

    checkAndRecover();
  }, [token, userId, userRole, isSupported, isSubscribing, subscribe]);

  // Request permission and subscribe
  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    setIsLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');

      if (granted) {
        return await subscribe();
      }

      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, subscribe]);

  // Show local notification (legacy support)
  const showNotification = useCallback((type, data = {}) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Cannot show notification: no support or permissions');
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

  // Check if user should receive notification type
  const shouldReceiveNotification = useCallback((type) => {
    if (!userRole) return false;
    
    const allowedTypes = pushNotificationService.getNotificationTypes(userRole);
    return allowedTypes.includes(type);
  }, [userRole]);

  // Get allowed notification types
  const getAllowedNotificationTypes = useCallback(() => {
    if (!userRole) return [];
    return pushNotificationService.getNotificationTypes(userRole);
  }, [userRole]);

  // Initialize support check
  useEffect(() => {
    const supported = pushNotificationService.isPushSupported();
    setIsSupported(supported);
    
    if (supported) {
      const currentPermission = pushNotificationService.getPermissionStatus();
      setPermission(currentPermission);
    }
  }, []);

  return {
    // Estado
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isSubscribing,
    
    // Acciones principales
    subscribe,
    unsubscribe,
    requestPermissionAndSubscribe,
    
    // Utilidades
    showNotification,
    shouldReceiveNotification,
    getAllowedNotificationTypes,
  };
};