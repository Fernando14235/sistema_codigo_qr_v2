# Notificación de Aprobación de Solicitudes de Visita

## Descripción

Se ha implementado un sistema de notificaciones para informar al residente cuando su solicitud de visita ha sido aprobada por el administrador.

## Cambios Realizados

### 1. Nueva Función de Notificación

Se creó la función `enviar_notificacion_solicitud_aprobada()` en `backend/app/services/notificacion_service.py`:

- **Propósito**: Notificar específicamente al residente cuando su solicitud es aprobada
- **Contenido**: Incluye todos los datos del visitante, detalles de la visita y el código QR generado
- **Diseño**: Email HTML con diseño profesional y secciones organizadas

### 2. Actualización del Servicio de Visitas

En `backend/app/services/visita_service.py`, función `aprobar_solicitud_visita_admin()`:

- Se reemplazó `enviar_notificacion_residente()` por `enviar_notificacion_solicitud_aprobada()`
- Se mantiene la notificación a los guardias con `enviar_notificacion_guardia()`

### 3. Importación Actualizada

Se agregó la importación de la nueva función en el servicio de visitas.

## Flujo de Notificaciones

### Cuando se Crea una Solicitud:
1. El residente crea una solicitud de visita
2. Se envía notificación a TODOS los administradores
3. La solicitud queda en estado "solicitada"

### Cuando se Aprueba una Solicitud:
1. El administrador aprueba la solicitud
2. Se genera el código QR real
3. Se envía notificación al RESIDENTE con:
   - Confirmación de aprobación
   - Datos del visitante
   - Detalles de la visita
   - Código QR para acceso
   - Instrucciones de uso
4. Se envía notificación a los GUARDIAS sobre la nueva visita
5. La visita cambia a estado "pendiente"

## Contenido del Email de Aprobación

El email incluye:

### 📧 Asunto
"✅ Tu solicitud de visita ha sido aprobada"

### 📋 Secciones del Email:
1. **Saludo personalizado** al residente
2. **Confirmación de aprobación**
3. **Datos del visitante** (nombre, DNI, teléfono, vehículo)
4. **Detalles de la visita** (fecha, motivo, estado)
5. **Código QR de acceso** con instrucciones
6. **Pasos a seguir** para el uso del código
7. **Advertencias de seguridad**

### 🎨 Diseño Visual:
- Colores diferenciados por sección
- Iconos descriptivos
- Diseño responsivo
- Información organizada y clara

## Pruebas

### Script de Prueba
Se creó `backend/test_aprobacion_notificacion.py` que:

1. Crea una solicitud como residente
2. Inicia sesión como administrador
3. Aprueba la solicitud
4. Verifica que se envió la notificación
5. Confirma el cambio de estado

### Ejecutar Prueba:
```bash
cd backend
python test_aprobacion_notificacion.py
```

## Verificación Manual

### 1. Crear Solicitud:
```bash
curl -X POST "http://localhost:8000/api/visitas/residente/solicitar_visita" \
  -H "Authorization: Bearer {TOKEN_RESIDENTE}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_visitante": "Juan Pérez",
    "dni_visitante": "0801-1990-12345",
    "telefono_visitante": "+50499999999",
    "fecha_entrada": "2024-01-15T14:00:00",
    "motivo_visita": "Visita familiar",
    "tipo_vehiculo": "Turismo",
    "marca_vehiculo": "Toyota",
    "color_vehiculo": "Blanco",
    "placa_vehiculo": "ABC-123"
  }'
```

### 2. Aprobar Solicitud:
```bash
curl -X POST "http://localhost:8000/api/visitas/admin/aprobar_solicitud/{VISITA_ID}" \
  -H "Authorization: Bearer {TOKEN_ADMIN}"
```

### 3. Verificar Notificaciones:
```bash
curl -X GET "http://localhost:8000/api/notificaciones/residente/ver_notificaciones" \
  -H "Authorization: Bearer {TOKEN_RESIDENTE}"
```

## Beneficios

1. **Transparencia**: El residente sabe inmediatamente cuando su solicitud es aprobada
2. **Información completa**: Recibe todos los datos necesarios para la visita
3. **Código QR incluido**: No necesita buscar el código en otro lugar
4. **Instrucciones claras**: Sabe exactamente qué hacer con el código
5. **Seguridad**: Incluye advertencias sobre el uso responsable del código

## Notas Técnicas

- La notificación se envía por email usando la función `enviar_correo()`
- Se registra en la base de datos como una notificación
- El código QR se incluye como imagen adjunta en el email
- Se maneja el manejo de errores para evitar fallos en el proceso de aprobación
- La función es independiente y no afecta otras notificaciones del sistema