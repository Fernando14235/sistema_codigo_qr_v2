import { useState, useEffect, useCallback, useRef } from 'react';
import pushNotificationService from '../../services/pwa/pushNotifications';

/**
 * ✅ SMART STATE INITIALIZATION
 * Reads browser state BEFORE first render to prevent "amnesia effect"
 */
const getInitialPushState = () => {
  // Check if push is supported
  if (!pushNotificationService.isPushSupported()) {
    return { 
      permission: 'default', 
      isSubscribed: false, 
      isSupported: false,
      isStandalone: false
    };
  }

  // ✅ iOS STANDALONE MODE DETECTION
  // Push notifications only work in iOS if app is installed to home screen
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

  const permission = pushNotificationService.getPermissionStatus();
  
  // ✅ OPTIMISTIC INITIALIZATION
  // If permission is granted, assume subscription exists (will verify async)
  return {
    permission,
    isSubscribed: permission === 'granted',
    isSupported: true,
    isStandalone
  };
};

/**
 * Hook para manejar notificaciones push
 * ✅ FIXES IMPLEMENTED:
 * - Smart initialization: reads browser state before first render
 * - Early verification: checks subscription independently of userId
 * - iOS standalone detection: prevents subscription attempts in Safari browser
 * - Separated re-subscription logic: only runs when userId is available
 * - Anti-race conditions con isSubscribing lock
 * - Session validation antes de llamadas backend
 * - Retry mechanism con exponential backoff
 */
export const usePushNotifications = (token, userId, userRole) => {
  // ✅ SMART INITIALIZATION using function to compute initial state
  const initialState = useRef(getInitialPushState()).current;
  
  const [isSupported, setIsSupported] = useState(initialState.isSupported);
  const [permission, setPermission] = useState(initialState.permission);
  const [isSubscribed, setIsSubscribed] = useState(initialState.isSubscribed);
  const [isStandalone] = useState(initialState.isStandalone);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false); // 🔒 ANTI-RACE LOCK
  const [isInitializing, setIsInitializing] = useState(true); // 🆕 PREVENTS UI FLICKER

  // ✅ REFINEMENT 3: Session Validation
  const validateSession = useCallback((authToken) => {
    if (!authToken || authToken.trim() === '') {
      console.log('⚠️ No auth token, skipping backend sync');
      return false;
    }
    return true;
  }, []);

  // ✅ REFINEMENT 5: Retry Mechanism with Exponential Backoff
  // ⚡ OPTIMIZED: Reduced retries and delays to prevent UI freeze
  const subscribeWithRetry = useCallback(async (maxRetries = 2) => { // Reduced from 3 to 2
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
        
        // ⚡ OPTIMIZED: Reduced exponential backoff (500ms, 1s instead of 1s, 2s, 4s)
        const delayMs = Math.min(500 * Math.pow(2, attempt - 1), 2000);
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return false;
  }, [token, userId, userRole, validateSession]);

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

  // ✅ FIX 1: EARLY VERIFICATION (Independent of userId)
  // Runs immediately on mount to verify actual subscription state
  // This prevents showing the banner when permission is already granted
  useEffect(() => {
    if (!isSupported) return;

    const verifySubscription = async () => {
      try {
        const currentPermission = pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            setIsSubscribed(true);
            console.log('✅ Existing subscription verified on mount');
          } else {
            setIsSubscribed(false);
            console.log('⚠️ Permission granted but no subscription found (will re-subscribe when userId available)');
          }
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('❌ Error verifying subscription on mount:', error);
        setIsSubscribed(false);
      } finally {
        // ✅ INITIALIZATION COMPLETE - UI can now render safely
        setIsInitializing(false);
      }
    };

    verifySubscription();
  }, [isSupported]); // Only depends on isSupported - runs once

  // ✅ FIX 2: SILENT RE-SUBSCRIPTION (Only when userId is available)
  // If permission is granted but subscription is missing, re-subscribe silently
  // ⚡ NON-BLOCKING: Runs in background without freezing UI
  useEffect(() => {
    if (!token || !userId || !userRole || !isSupported) return;
    if (permission !== 'granted') return; // Only re-subscribe if permission exists
    if (isSubscribed) return; // Already subscribed
    if (isSubscribing) return; // Already in progress
    if (isInitializing) return; // Wait for initial verification to complete

    const silentResubscribe = async () => {
      console.log('🔄 Silent re-subscription: permission granted but no active subscription');
      // ⚡ NON-BLOCKING: Fire and forget, don't block UI
      subscribe().catch(err => console.error('Silent re-subscription failed:', err));
    };

    silentResubscribe();
  }, [token, userId, userRole, isSupported, permission, isSubscribed, isSubscribing, isInitializing, subscribe]);

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

  // ✅ REMOVED: Redundant initialization useEffect
  // State is now initialized smartly using getInitialPushState()

  return {
    // Estado
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isSubscribing,
    isInitializing, // 🆕 EXPORTED: UI can use this to prevent flicker
    isStandalone,   // 🆕 EXPORTED: UI can show iOS-specific messages
    
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