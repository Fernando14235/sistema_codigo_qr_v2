// Servicio para manejar notificaciones push
class PushNotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscription = null;
    this.permission = 'default';
  }

  // Verificar si las notificaciones están soportadas
  isPushSupported() {
    return this.isSupported;
  }

  // Solicitar permisos de notificación
  async requestPermission() {
    if (!this.isSupported) {
      console.log('Push notifications no están soportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Permisos de notificación concedidos');
        return true;
      } else {
        console.log('❌ Permisos de notificación denegados');
        return false;
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  // Verificar permisos actuales
  getPermissionStatus() {
    if (!this.isSupported) return 'not-supported';
    return Notification.permission;
  }

  // Suscribirse a notificaciones push
  async subscribeToPush(token) {
    if (!this.isSupported) {
      console.log('Push notifications no están soportadas');
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    try {
      // Registrar service worker si no está registrado
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // Obtener VAPID key del backend
      const vapidKey = await this.getVapidPublicKey();
      
      // Suscribirse a push
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(token);
      
      console.log('✅ Suscrito a notificaciones push');
      return true;
    } catch (error) {
      console.error('Error suscribiéndose a push:', error);
      return false;
    }
  }

  // Desuscribirse de notificaciones push
  async unsubscribeFromPush(token) {
    if (!this.subscription) return false;

    try {
      // Notificar al servidor primero
      await this.removeSubscriptionFromServer(token);
      
      // Luego desuscribirse localmente
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      console.log('✅ Desuscrito de notificaciones push');
      return true;
    } catch (error) {
      console.error('Error desuscribiéndose de push:', error);
      return false;
    }
  }

  // Enviar suscripción al servidor
  async sendSubscriptionToServer(token) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: this.subscription,
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        console.log('✅ Suscripción enviada al servidor');
        return true;
      } else {
        const error = await response.json();
        console.error('Error enviando suscripción al servidor:', error);
        return false;
      }
    } catch (error) {
      console.error('Error enviando suscripción:', error);
      return false;
    }
  }

  // Remover suscripción del servidor
  async removeSubscriptionFromServer(token) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      });

      if (response.ok) {
        console.log('✅ Suscripción removida del servidor');
        return true;
      } else {
        console.error('Error removiendo suscripción del servidor');
        return false;
      }
    } catch (error) {
      console.error('Error removiendo suscripción:', error);
      return false;
    }
  }

  // Mostrar notificación local
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    const defaultOptions = {
      icon: '/resi192.png',
      badge: '/resi64.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/resi32.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/resi32.png'
        }
      ],
      ...options
    };

    const notification = new Notification(title, defaultOptions);
    // Manejar clics en la notificación
    notification.onclick = (event) => {
      event.preventDefault();
      
      if (event.action === 'view') {
        // Abrir la aplicación
        window.focus();
        // Aquí se puede navegar a la sección específica
      }
      
      notification.close();
    };

    return notification;
  }

  // Convertir VAPID key de base64 a Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Obtener VAPID public key desde el backend
  async getVapidPublicKey() {
    //const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    //if (envKey) {
    //  return envKey;
    //}
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      // Intentar obtener la key del backend
      const response = await fetch(`${API_URL}/push/vapid-public-key`);
      if (response.ok) {
        const data = await response.json();
        return data.publicKey;
      }
    } catch (error) {
      console.warn('No se pudo obtener VAPID key del backend');
    }
    
    // Fallback a key hardcodeada (debería ser la misma del backend)
    //return envKey;
    throw new Error('No se pudo obtener VAPID key');
  }

  // Configurar tipos de notificación por rol (actualizados con los nuevos tipos del backend)
  getNotificationTypes(role) {
    const types = {
      admin: [
        'visita_creada',
        'solicitud_pendiente',
        'ticket_creado',
        'publicacion_creada'
      ],
      guardia: [
        'visita_creada'
      ],
      residente: [
        'escaneo_entrada',
        'escaneo_salida',
        'visita_actualizada',
        'ticket_actualizado',
        'publicacion_creada'
      ]
    };

    return types[role] || [];
  }

  // Obtener título y mensaje según tipo de notificación (actualizados con los nuevos tipos del backend)
  getNotificationContent(type, data = {}) {
    const content = {
      // Notificaciones de visitas
      visita_creada: {
        title: '🚨 Nueva visita programada',
        body: data.visitante || 'Se ha creado una nueva visita',
        icon: '🚨'
      },
      escaneo_entrada: {
        title: '🚪 Visitante ha ingresado',
        body: data.visitante || 'Un visitante ha ingresado',
        icon: '🚪'
      },
      escaneo_salida: {
        title: '🚗 Visitante ha salido',
        body: data.visitante || 'Un visitante ha salido',
        icon: '🚗'
      },
      visita_actualizada: {
        title: '✏️ Visita actualizada',
        body: data.visitante || 'Se actualizó una visita',
        icon: '✏️'
      },
      solicitud_pendiente: {
        title: '📋 Nueva solicitud de visita',
        body: data.residente || 'Hay una nueva solicitud pendiente',
        icon: '📋'
      },
      
      // Notificaciones de publicaciones
      publicacion_creada: {
        title: '📢 Nueva publicación',
        body: data.titulo || 'Se ha creado una nueva publicación',
        icon: '📢'
      },
      
      // Notificaciones de tickets
      ticket_creado: {
        title: '🎫 Nuevo ticket de soporte',
        body: data.titulo || 'Se ha creado un nuevo ticket',
        icon: '🎫'
      },
      ticket_actualizado: {
        title: '✅ Tu ticket fue actualizado',
        body: data.estado || 'Tu ticket ha sido actualizado',
        icon: '✅'
      }
    };

    return content[type] || {
      title: '🔔 Notificación',
      body: 'Nueva notificación del sistema',
      icon: '🔔'
    };
  }
}

// Instancia singleton
const pushNotificationService = new PushNotificationService();
export default pushNotificationService; 