# Endpoints de Historial de Escaneos del Día

## Descripción
Estos endpoints permiten obtener el historial de escaneos QR realizados durante el día actual, diferenciando entre escaneos de entrada y salida.

## Endpoints Disponibles

### 1. Historial para Administradores
```
GET /visitas/admin/escaneos-dia
```

**Autenticación**: Solo administradores
**Descripción**: Muestra todos los escaneos QR del día actual realizados por todos los guardias

### 2. Historial para Guardias
```
GET /visitas/guardia/escaneos-dia
```

**Autenticación**: Solo guardias
**Descripción**: Muestra solo los escaneos QR del día actual realizados por el guardia autenticado

## Respuesta

### Estructura de Respuesta
```json
{
  "escaneos": [
    {
      "id_escaneo": 1,
      "fecha_escaneo": "2024-01-15T14:30:00Z",
      "dispositivo": "iPhone 12",
      "nombre_guardia": "Carlos Guardia",
      "nombre_visitante": "Juan Pérez",
      "dni_visitante": "12345678",
      "tipo_vehiculo": "Automóvil",
      "placa_vehiculo": "ABC123",
      "motivo_visita": "Visita familiar",
      "nombre_residente": "María González",
      "unidad_residencial": "A-101",
      "estado_visita": "completado",
      "tipo_escaneo": "entrada"
    }
  ],
  "total_escaneos": 25,
  "fecha_consulta": "2024-01-15T16:45:00Z"
}
```

### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_escaneo` | int | ID único del escaneo |
| `fecha_escaneo` | datetime | Fecha y hora del escaneo (UTC) |
| `dispositivo` | string | Dispositivo usado para el escaneo |
| `nombre_guardia` | string | Nombre del guardia que realizó el escaneo |
| `nombre_visitante` | string | Nombre del visitante |
| `dni_visitante` | string | DNI del visitante |
| `tipo_vehiculo` | string | Tipo de vehículo del visitante |
| `placa_vehiculo` | string | Placa del vehículo |
| `motivo_visita` | string | Motivo de la visita |
| `nombre_residente` | string | Nombre del residente que autorizó la visita |
| `unidad_residencial` | string | Unidad residencial del residente |
| `estado_visita` | string | Estado actual de la visita |
| `tipo_escaneo` | string | "entrada" o "salida" |
| `total_escaneos` | int | Total de escaneos del día |
| `fecha_consulta` | datetime | Fecha y hora de la consulta |

## Lógica de Determinación de Tipo de Escaneo

El sistema determina automáticamente si un escaneo es de "entrada" o "salida" basándose en:

1. **Escaneo de Entrada**: Cualquier escaneo realizado antes de que se registre la fecha de salida
2. **Escaneo de Salida**: Escaneo realizado después de que se registre la fecha de salida de la visita

## Filtros Aplicados

### Por Fecha
- **Rango**: Desde las 00:00:00 hasta las 23:59:59 del día actual
- **Zona Horaria**: UTC
- **Orden**: Más reciente primero

### Por Usuario
- **Administradores**: Ven todos los escaneos del día
- **Guardias**: Solo ven sus propios escaneos del día

## Códigos de Error

### 401 - No autenticado
```json
{
  "detail": "No se pudieron validar las credenciales"
}
```

### 403 - Sin permisos
```json
{
  "detail": "Solo los guardias pueden acceder a este endpoint"
}
```

### 404 - Guardia no encontrado
```json
{
  "detail": "Guardia no encontrado"
}
```

### 500 - Error interno
```json
{
  "detail": "Error al obtener historial de escaneos"
}
```

## Ejemplos de Uso

### Para Administradores
```bash
curl -X GET "http://localhost:8000/visitas/admin/escaneos-dia" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Para Guardias
```bash
curl -X GET "http://localhost:8000/visitas/guardia/escaneos-dia" \
  -H "Authorization: Bearer GUARDIA_JWT_TOKEN"
```

## Características Técnicas

### Base de Datos
- **Tabla principal**: `escaneos_qr`
- **Joins**: `visitas`, `visitantes`, `residentes`, `usuarios`, `guardias`
- **Índices**: Optimizado para consultas por fecha y guardia

### Rendimiento
- **Filtrado por fecha**: Usa índices de base de datos
- **Paginación**: No implementada (considerar para grandes volúmenes)
- **Caché**: No implementado (considerar para consultas frecuentes)

### Seguridad
- **Autenticación JWT**: Requerida para ambos endpoints
- **Autorización por rol**: Separación clara entre admin y guardia
- **Filtrado de datos**: Los guardias solo ven sus propios escaneos

## Casos de Uso

### Para Administradores
- Monitoreo general de actividad del día
- Auditoría de escaneos realizados
- Análisis de patrones de entrada/salida
- Reportes de seguridad

### Para Guardias
- Revisión de sus escaneos del turno
- Verificación de visitas procesadas
- Control de calidad de sus operaciones
- Historial personal de actividad

## Próximas Mejoras Sugeridas

1. **Paginación**: Para manejar grandes volúmenes de datos
2. **Filtros adicionales**: Por tipo de escaneo, residente, etc.
3. **Exportación**: CSV, PDF para reportes
4. **Notificaciones**: Alertas de escaneos anómalos
5. **Dashboard**: Interfaz gráfica para visualización 