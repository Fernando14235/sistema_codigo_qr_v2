# Sistema de Solicitudes de Visita

## Descripción General

El sistema de solicitudes de visita permite a los residentes enviar solicitudes de visita al administrador para su aprobación. Una vez aprobada, la solicitud se convierte en una visita activa con código QR.

## Flujo del Sistema

### 1. Solicitud del Residente
- El residente completa un formulario con los datos del visitante
- Los campos DNI y teléfono son opcionales (si no se proporcionan, se guardan como "No agregado")
- La solicitud se guarda en la base de datos con estado "solicitada"
- Se envía notificación por email a todos los administradores

### 2. Revisión del Administrador
- El administrador puede ver todas las solicitudes pendientes
- Cada solicitud muestra información completa del residente y visitante
- El administrador puede aprobar la solicitud

### 3. Aprobación y Activación
- Al aprobar, la solicitud se convierte en una visita activa
- Se genera un código QR real
- Se envía notificación al residente con el QR
- Se notifica a los guardias sobre la nueva visita
- En la base de datos se registra como creada por el administrador

## Endpoints Implementados

### Para Residentes
- `POST /visitas/residente/solicitar_visita` - Crear solicitud de visita

### Para Administradores
- `GET /visitas/admin/solicitudes_pendientes` - Ver solicitudes pendientes
- `POST /visitas/admin/aprobar_solicitud/{visita_id}` - Aprobar solicitud

## Estructura de Datos

### SolicitudVisitaCreate Schema
```python
{
    "nombre_visitante": str,
    "dni_visitante": Optional[str],  # "No agregado" si no se proporciona
    "telefono_visitante": Optional[str],  # "No agregado" si no se proporciona
    "fecha_entrada": datetime,
    "motivo_visita": str,
    "tipo_vehiculo": str,
    "marca_vehiculo": Optional[str],
    "color_vehiculo": Optional[str],
    "placa_vehiculo": Optional[str]
}
```

### Estados de Visita
- `"solicitada"` - Solicitud pendiente de aprobación
- `"pendiente"` - Visita aprobada, pendiente de entrada
- `"aprobado"` - Visitante ha entrado
- `"completado"` - Visitante ha salido
- `"expirado"` - QR expirado
- `"rechazado"` - Visita rechazada

## Notificaciones

### Al Crear Solicitud
- Se envía email a todos los administradores con detalles completos
- Se crea notificación en la base de datos

### Al Aprobar Solicitud
- Se envía email al residente con el código QR
- Se notifica a los guardias sobre la nueva visita
- Se crea notificación en la base de datos

## Frontend

### Residente Dashboard
- Nuevo botón "Solicitar Visita" en el menú principal
- Formulario específico para solicitudes
- Visualización del estado "Solicitada" en la lista de visitas

### Admin Dashboard
- Nuevo botón "Solicitudes Pendientes" en el menú principal
- Vista de tarjetas con todas las solicitudes pendientes
- Botón para aprobar cada solicitud
- Diseño responsive para móviles

## Validaciones

### Al Crear Solicitud
- Fecha de entrada no puede ser en el pasado
- Campos obligatorios: nombre, fecha, motivo, tipo de vehículo
- DNI y teléfono son opcionales

### Al Aprobar Solicitud
- Solo administradores pueden aprobar
- La solicitud debe estar en estado "solicitada"
- La fecha de entrada no debe haber pasado

## Seguridad

- Solo residentes pueden crear solicitudes
- Solo administradores pueden aprobar solicitudes
- Validación de permisos en cada endpoint
- Manejo de errores y rollback en transacciones

## Base de Datos

### Cambios en la Tabla Visitas
- Nuevo estado: "solicitada"
- Las solicitudes tienen `admin_id = NULL` hasta ser aprobadas
- `tipo_creador` cambia de "residente" a "admin" al aprobar

### Relaciones
- Las solicitudes mantienen las mismas relaciones que las visitas normales
- Se pueden eliminar en cascada si es necesario 