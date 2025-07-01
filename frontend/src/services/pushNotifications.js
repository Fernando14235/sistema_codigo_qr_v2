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
  async subscribeToPush(userId, userRole) {
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
      
      // Suscribirse a push
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
      });

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(userId, userRole);
      
      console.log('✅ Suscrito a notificaciones push');
      return true;
    } catch (error) {
      console.error('Error suscribiéndose a push:', error);
      return false;
    }
  }

  // Desuscribirse de notificaciones push
  async unsubscribeFromPush() {
    if (!this.subscription) return false;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Notificar al servidor
      await this.removeSubscriptionFromServer();
      
      console.log('✅ Desuscrito de notificaciones push');
      return true;
    } catch (error) {
      console.error('Error desuscribiéndose de push:', error);
      return false;
    }
  }

  // Enviar suscripción al servidor
  async sendSubscriptionToServer(userId, userRole) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userRole,
          subscription: this.subscription,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        console.log('✅ Suscripción enviada al servidor');
        return true;
      } else {
        console.error('Error enviando suscripción al servidor');
        return false;
      }
    } catch (error) {
      console.error('Error enviando suscripción:', error);
      return false;
    }
  }

  // Remover suscripción del servidor
  async removeSubscriptionFromServer() {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.subscription
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

  // Obtener VAPID public key (esto debería venir del servidor)
  getVapidPublicKey() {
    // Esta key debería ser configurada en el backend
    return 'BEl62iUYgUivxIkv69yViEuiBIa1qkS3qgRupZW2oONf_3j8gZmxbDnEY_4zJPKNBmhoXV0d2D4R49sJqYoLtEWY';
  }

  // Configurar tipos de notificación por rol
  getNotificationTypes(role) {
    const types = {
      admin: [
        'publicacion_creada',
        'visita_creada',
        'escaneo_registrado'
      ],
      guardia: [
        'visita_creada',
        'publicacion_creada'
      ],
      residente: [
        'visita_creada',
        'publicacion_creada',
        'escaneo_entrada',
        'escaneo_salida'
      ]
    };

    return types[role] || [];
  }

  // Obtener título y mensaje según tipo de notificación
  getNotificationContent(type, data = {}) {
    const content = {
      publicacion_creada: {
        title: '📢 Nueva Publicación',
        body: data.titulo || 'Se ha creado una nueva publicación',
        icon: '📢'
      },
      visita_creada: {
        title: '👥 Nueva Visita',
        body: data.visitante || 'Se ha creado una nueva visita',
        icon: '👥'
      },
      escaneo_entrada: {
        title: '🚪 Entrada Registrada',
        body: data.visitante || 'Un visitante ha ingresado',
        icon: '🚪'
      },
      escaneo_salida: {
        title: '🚗 Salida Registrada',
        body: data.visitante || 'Un visitante ha salido',
        icon: '🚗'
      },
      escaneo_registrado: {
        title: '📱 Escaneo Registrado',
        body: data.tipo || 'Se ha registrado un nuevo escaneo',
        icon: '📱'
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