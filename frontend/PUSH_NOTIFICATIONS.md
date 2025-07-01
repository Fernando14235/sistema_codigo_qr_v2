# Notificaciones Push - Residencial Access

## 📱 Descripción General

Se ha implementado un sistema completo de notificaciones push para la PWA de Residencial Access. Las notificaciones permiten a los usuarios recibir alertas en tiempo real sobre eventos importantes del sistema, incluso cuando la aplicación está cerrada.

## 🔔 Tipos de Notificaciones por Rol

### 👨‍💼 Administradores
- **📢 Nueva Publicación**: Cuando se crea una nueva publicación en el sistema
- **👥 Nueva Visita**: Cuando un residente crea una nueva visita
- **📱 Escaneo Registrado**: Cuando se registra un nuevo escaneo de entrada/salida

### 🛡️ Guardias
- **👥 Nueva Visita**: Cuando un residente crea una nueva visita
- **📢 Nueva Publicación**: Cuando se crea una nueva publicación

### 🏠 Residentes
- **👥 Nueva Visita**: Cuando se crea una nueva visita (individual)
- **📢 Nueva Publicación**: Cuando se crea una nueva publicación (para todos o específicos)
- **🚪 Entrada Registrada**: Cuando un guardia escanea la entrada de un visitante
- **🚗 Salida Registrada**: Cuando un guardia escanea la salida de un visitante

## 🛠️ Componentes Implementados

### 1. Servicio de Notificaciones Push (`pushNotifications.js`)
- Manejo de permisos de notificación
- Suscripción/desuscripción a notificaciones push
- Conversión de VAPID keys
- Configuración de tipos de notificación por rol
- Generación de contenido de notificaciones

### 2. Hook Personalizado (`usePushNotifications.js`)
- Estado de soporte y permisos
- Funciones para suscribirse/desuscribirse
- Verificación de tipos de notificación permitidos
- Manejo de notificaciones recibidas

### 3. Componente de Configuración (`PushNotificationSettings.jsx`)
- Interfaz para activar/desactivar notificaciones
- Estado visual de permisos
- Información sobre tipos de notificación
- Manejo de errores y estados

### 4. Probador de Notificaciones (`NotificationTester.jsx`)
- Herramienta para probar notificaciones localmente
- Selección de tipos de notificación
- Validación por rol de usuario
- Simulación de datos de notificación

### 5. Service Worker (`sw.js`)
- Manejo de eventos push
- Mostrar notificaciones
- Manejo de clics en notificaciones
- Cache y funcionalidad offline

## 🔧 Configuración Técnica

### VAPID Keys
Las notificaciones push requieren VAPID (Voluntary Application Server Identification) keys para autenticación:

```javascript
// Clave pública (frontend)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa1qkS3qgRupZW2oONf_3j8gZmxbDnEY_4zJPKNBmhoXV0d2D4R49sJqYoLtEWY';

// Clave privada (backend - mantener segura)
const VAPID_PRIVATE_KEY = 'tu_clave_privada_aqui';
```

### Endpoints del Backend
El sistema espera los siguientes endpoints en el backend:

```javascript
// Suscribirse a notificaciones
POST /api/push/subscribe
{
  "userId": "123",
  "userRole": "residente",
  "subscription": {...},
  "userAgent": "..."
}

// Desuscribirse de notificaciones
POST /api/push/unsubscribe
{
  "subscription": {...}
}

// Enviar notificación
POST /api/push/send
{
  "type": "publicacion_creada",
  "data": {...},
  "recipients": ["user1", "user2"] // o "all" para todos
}
```

## 📋 Uso del Sistema

### 1. Activación de Notificaciones
1. El usuario navega a Configuración
2. Ve la sección "Notificaciones Push"
3. Hace clic en "Activar Notificaciones"
4. El navegador solicita permisos
5. Si se conceden, se suscribe automáticamente

### 2. Configuración de Tipos
- Los tipos de notificación se configuran automáticamente según el rol
- No se pueden modificar desde la interfaz (configuración del sistema)
- Se muestran solo los tipos relevantes para cada rol

### 3. Pruebas Locales
- Usar el "Probador de Notificaciones" en Configuración
- Seleccionar tipo de notificación
- Hacer clic en "Probar Notificación"
- Verificar que aparece la notificación

## 🔒 Seguridad y Privacidad

### Permisos
- Las notificaciones solo se activan con consentimiento explícito del usuario
- Se puede revocar en cualquier momento desde la configuración
- Los permisos se manejan a nivel del navegador

### Datos
- Solo se envían datos mínimos necesarios para la notificación
- No se almacenan datos personales en el service worker
- Las suscripciones se pueden eliminar del servidor

### Autenticación
- Las notificaciones requieren autenticación VAPID
- Las suscripciones están vinculadas al usuario autenticado
- Se valida el rol antes de enviar notificaciones

## 🚀 Implementación en el Backend

Para completar la implementación, el backend debe:

1. **Generar VAPID keys**:
```python
from py_vapid import Vapid

vapid = Vapid()
vapid_claims = {
    "sub": "mailto:admin@residencial.com",
    "aud": "https://fcm.googleapis.com"
}
vapid_key = vapid.from_string("tu_clave_privada")
```

2. **Almacenar suscripciones**:
```python
class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    subscription_json = Column(Text)
    user_agent = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

3. **Enviar notificaciones**:
```python
async def send_push_notification(type: str, data: dict, recipients: List[int]):
    # Obtener suscripciones de los usuarios
    # Enviar notificación usando web-push
    # Manejar errores y limpiar suscripciones inválidas
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+ (con limitaciones)

### Dispositivos
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (Android, iOS)
- ✅ Tablet

### Limitaciones
- iOS Safari requiere HTTPS
- Algunas funcionalidades pueden variar entre navegadores
- Las notificaciones en iOS tienen restricciones adicionales

## 🐛 Solución de Problemas

### Notificaciones no aparecen
1. Verificar permisos del navegador
2. Comprobar que el service worker está registrado
3. Revisar la consola del navegador para errores
4. Verificar que la suscripción se envió al servidor

### Error de suscripción
1. Verificar que las VAPID keys son correctas
2. Comprobar que el endpoint del servidor responde
3. Verificar que el usuario está autenticado
4. Revisar logs del servidor

### Notificaciones duplicadas
1. Verificar que no hay múltiples service workers
2. Comprobar que las suscripciones no están duplicadas
3. Usar tags únicos para las notificaciones

## 🔄 Próximas Mejoras

1. **Notificaciones en tiempo real** usando WebSockets
2. **Configuración granular** por tipo de notificación
3. **Programación de notificaciones** para eventos futuros
4. **Estadísticas de notificaciones** (apertura, clics)
5. **Sonidos personalizados** para diferentes tipos
6. **Notificaciones silenciosas** para actualizaciones de datos
7. **Sincronización de estado** entre dispositivos

## 📞 Soporte

Para problemas técnicos o preguntas sobre la implementación:
- Revisar la documentación del navegador
- Consultar logs del service worker
- Verificar configuración del servidor
- Contactar al equipo de desarrollo 