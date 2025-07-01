# Funcionalidades Offline - PWA Residencial Access

## 🚀 Descripción General

El sistema ahora incluye funcionalidades offline completas que permiten a los usuarios continuar trabajando sin conexión a internet. Los datos se sincronizan automáticamente cuando se recupera la conexión.

## 📱 Funcionalidades por Rol

### 👨‍💼 **Administrador**

#### ✅ **Disponible Offline:**
- **Ver Historial de Visitas**: Acceso a datos de visitas recientes (24 horas)
- **Ver Estadísticas Recientes**: Estadísticas generales (6 horas)
- **Ver Escaneos del Día**: Escaneos registrados hoy (24 horas)
- **Ver Publicaciones Recientes**: Contenido social (12 horas)

#### ❌ **No Disponible Offline:**
- Crear usuarios
- Eliminar usuarios
- Crear publicaciones
- Modificar configuraciones del sistema

### 👮‍♂️ **Guardia**

#### ✅ **Disponible Offline:**
- **Registrar Entrada**: Se guarda localmente y sincroniza después
- **Registrar Salida**: Se guarda localmente y sincroniza después
- **Ver Escaneos Recientes**: Escaneos del día (24 horas)

#### ❌ **No Disponible Offline:**
- Ver estadísticas completas
- Acceso a reportes detallados

### 🏠 **Residente**

#### ✅ **Disponible Offline:**
- **Ver Comunicados Recientes**: Comunicados del sistema (12 horas)
- **Ver Historial de Visitas**: Visitas propias (24 horas)

#### ❌ **No Disponible Offline:**
- Crear visitas (requiere conexión para validación en tiempo real)

## 🔄 Sincronización en Segundo Plano

### **Características:**
- **Background Sync**: Las acciones se procesan automáticamente cuando se recupera la conexión
- **Persistencia**: Los datos se guardan en localStorage con timestamps
- **Expiración Inteligente**: Los datos offline expiran según su tipo
- **Fallback Graceful**: Si falla la conexión, usa datos offline automáticamente

### **Tipos de Acciones Pendientes:**
- `REGISTER_ENTRY`: Registro de entrada de visitantes
- `REGISTER_EXIT`: Registro de salida de visitantes
- `CREATE_VISIT`: Creación de visitas (solo online)

## 🛠️ Implementación Técnica

### **Componentes Principales:**

1. **`useOffline.js`**: Hook para detectar estado de conexión
2. **`useOfflineOperations.js`**: Hook para operaciones específicas por rol
3. **`offlineStorage.js`**: Servicio de almacenamiento local
4. **`OfflineIndicator.jsx`**: Indicador visual del estado offline
5. **`DataStatusIndicator.jsx`**: Indicador del origen de los datos
6. **`OfflineMessage.jsx`**: Mensajes informativos offline

### **Configuración PWA:**

```javascript
// vite.config.js
workbox: {
  runtimeCaching: [
    // Cache para diferentes endpoints de la API
    {
      urlPattern: /.*\/admin\/estadisticas/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-estadisticas',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 6 * 60 * 60, // 6 horas
        },
      },
    },
    // ... más configuraciones de cache
  ],
  backgroundSync: {
    name: 'residencial-sync',
    options: {
      maxRetentionTime: 24 * 60, // 24 horas
    },
  },
}
```

## 📊 Gestión de Datos

### **Estrategias de Cache:**

1. **NetworkFirst**: Intenta red primero, fallback a cache
2. **CacheFirst**: Usa cache primero, actualiza en segundo plano
3. **StaleWhileRevalidate**: Sirve cache inmediatamente, actualiza en background

### **Expiración de Datos:**
- **Estadísticas**: 6 horas
- **Historial**: 24 horas
- **Escaneos**: 24 horas
- **Publicaciones**: 12 horas
- **Comunicados**: 12 horas

## 🎯 Experiencia de Usuario

### **Indicadores Visuales:**
- 🔴 **Sin conexión**: Modo offline activo
- 🔄 **Acciones pendientes**: Sincronización en progreso
- 🟢 **Conectado**: Funcionamiento normal

### **Mensajes Informativos:**
- Explicación de funcionalidades disponibles
- Lista de funcionalidades restringidas
- Estado de sincronización

### **Navegación:**
- Botón de descarga PWA en esquina superior izquierda
- Indicador de estado en esquina superior derecha
- Mensajes contextuales según el rol

## 🔧 Configuración y Mantenimiento

### **Limpieza Automática:**
- Los datos expirados se eliminan automáticamente
- Las acciones sincronizadas se remueven del almacenamiento
- Optimización de espacio en localStorage

### **Debugging:**
```javascript
// Ver información del almacenamiento
console.log(offlineStorage.getStorageInfo());

// Ver acciones pendientes
console.log(offlineStorage.getPendingActions());
```

## 🚀 Beneficios

1. **Continuidad de Servicio**: Los usuarios pueden trabajar sin interrupciones
2. **Mejor Experiencia**: No hay pérdida de datos por problemas de conexión
3. **Eficiencia**: Sincronización automática en segundo plano
4. **Confiabilidad**: Fallback graceful a datos offline
5. **Escalabilidad**: Sistema preparado para crecimiento

## 📱 Compatibilidad

- ✅ Chrome (Android y Desktop)
- ✅ Edge (Desktop)
- ✅ Firefox (Desktop)
- ✅ Safari (iOS) - Limitado
- ✅ Samsung Internet (Android)

## 🔮 Próximas Mejoras

1. **Sincronización Bidireccional**: Actualización de datos en tiempo real
2. **Conflict Resolution**: Manejo de conflictos de datos
3. **Push Notifications**: Notificaciones offline
4. **Analytics Offline**: Seguimiento de uso sin conexión
5. **Compresión de Datos**: Optimización del almacenamiento 