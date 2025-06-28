# Endpoint de Registro de Salida

## Descripción
Este endpoint permite a los guardias y administradores registrar la fecha de salida de un visitante que ya ha sido aprobado para ingresar al residencial.

## Arquitectura
El endpoint sigue el patrón de arquitectura limpia donde:
- **Router** (`visitas.py`): Maneja la presentación, autenticación y respuesta HTTP
- **Servicio** (`visita_service.py`): Contiene toda la lógica de negocio
- **Modelos**: Manejan la persistencia de datos

## Endpoint
```
POST /visitas/registrar_salida
```

## Autenticación
- **Requerido**: Token Bearer JWT
- **Roles permitidos**: `admin`, `guardia`

## Parámetros de entrada
```json
{
  "qr_code": "string"
}
```

## Validaciones
1. **QR válido**: El código QR debe existir en la base de datos
2. **Estado correcto**: Solo se permite registrar salida para visitas con estado "aprobado"
3. **Guardia válido**: El usuario debe ser un guardia registrado en el sistema

## Respuesta exitosa (200)
```json
{
  "mensaje": "Salida registrada exitosamente",
  "fecha_salida": "2024-01-15T14:30:00Z",
  "estado": "completado",
  "visitante": {
    "nombre_conductor": "Juan Pérez",
    "dni_conductor": "12345678",
    "telefono": "3001234567",
    "tipo_vehiculo": "Automóvil",
    "placa_vehiculo": "ABC123",
    "motivo_visita": "Visita familiar"
  },
  "guardia": {
    "id": 1,
    "nombre": "Carlos Guardia",
    "rol": "guardia"
  }
}
```

## Códigos de error

### 400 - Estado incorrecto
```json
{
  "detail": "No se puede registrar la salida. La visita está en estado 'pendiente'. Solo se permite registrar salida para visitas aprobadas."
}
```

### 401 - No autenticado
```json
{
  "detail": "No se pudieron validar las credenciales"
}
```

### 403 - Sin permisos
```json
{
  "detail": "No tienes permiso para acceder a este recurso"
}
```

### 404 - QR no encontrado
```json
{
  "detail": "Código QR no encontrado"
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
  "detail": "Error interno del servidor al registrar la salida"
}
```

## Funcionalidades adicionales
1. **Registro de escaneo**: Se registra automáticamente un nuevo escaneo QR para la salida
2. **Notificación**: Se envía una notificación por correo al residente informando que el visitante ha salido
3. **Cambio de estado**: La visita se marca automáticamente como "completado"
4. **Auditoría**: Se registra el dispositivo y guardia que realizó el escaneo de salida

## Estructura del código

### Router (`app/routers/visitas.py`)
```python
@router.post("/registrar_salida")
def registrar_salida(request, db, usuario):
    # Validación de guardia
    # Llamada al servicio
    # Registro de escaneo
    # Envío de notificación
    # Respuesta HTTP
```

### Servicio (`app/services/visita_service.py`)
```python
def registrar_salida_visita(db, qr_code, guardia_id):
    # Lógica de negocio
    # Validaciones
    # Actualización de datos
    # Retorno de resultado
```

## Ejemplo de uso con curl
```bash
curl -X POST "http://localhost:8000/visitas/registrar_salida" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code": "qr_code_here"
  }'
```

## Flujo de estados de visita
1. **pendiente** → QR creado, esperando aprobación
2. **aprobado** → QR escaneado y aprobado por guardia
3. **completado** → Salida registrada (estado final)
4. **rechazado** → QR rechazado por guardia
5. **expirado** → QR expirado automáticamente 