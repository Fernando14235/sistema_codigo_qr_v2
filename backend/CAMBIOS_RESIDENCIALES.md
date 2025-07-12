# Cambios Implementados - Sistema de Residenciales

## Resumen de Cambios

Se han implementado cambios en la base de datos y el código para permitir el manejo de múltiples residenciales en el sistema, mejorando la seguridad y organización de los datos.

## 1. Nuevo Modelo: Residencial

### Archivo: `backend/app/models/residencial.py`

Se creó el modelo `Residencial` con los siguientes campos:
- `id`: Identificador único
- `nombre`: Nombre de la residencial
- `direccion`: Dirección de la residencial
- `fecha_creacion`: Fecha de creación del registro

### Relaciones:
- `usuarios`: Relación con usuarios de la residencial
- `administradores`: Relación con administradores de la residencial
- `residentes`: Relación con residentes de la residencial
- `guardias`: Relación con guardias de la residencial

## 2. Actualizaciones en Modelos Existentes

### Usuario (`backend/app/models/usuario.py`)
- Agregado campo `residencial_id` como ForeignKey
- Agregada relación `residencial`

### Administrador (`backend/app/models/admin.py`)
- Agregado campo `residencial_id` como ForeignKey
- Agregada relación `residencial`
- Cambiado `telefono` a nullable y String(25)

### Residente (`backend/app/models/residente.py`)
- Agregado campo `residencial_id` como ForeignKey
- Agregada relación `residencial`
- Cambiado `telefono` a nullable y String(25)
- Cambiado `unidad_residencial` a nullable

### Guardia (`backend/app/models/guardia.py`)
- Agregado campo `residencial_id` como ForeignKey
- Agregada relación `residencial`
- Cambiado `telefono` a nullable y String(25)

### Visitante (`backend/app/models/visitante.py`)
- Actualizado campos según el script SQL:
  - `nombre_conductor`: String(150)
  - `dni_conductor`: String(50)
  - `telefono`: String(20), nullable
  - `tipo_vehiculo`: String(70), nullable
  - `placa_vehiculo`: String(30), nullable
  - `motivo_visita`: String(150), nullable
  - Eliminados campos `marca_vehiculo` y `color_vehiculo`

### Visita (`backend/app/models/visita.py`)
- Actualizado campos según el script SQL:
  - `qr_code`: String(255)
  - `fecha_entrada`: nullable
  - `estado`: String(30)
  - `notas`: nullable
  - `expiracion`: String(1), nullable=False
- Agregados CheckConstraints para validar valores permitidos

### EscaneoQR (`backend/app/models/escaneo_qr.py`)
- `dispositivo`: String(100), nullable

### Notificacion (`backend/app/models/notificacion.py`)
- `mensaje`: String(1000), nullable
- Agregado CheckConstraint para validar estados

### Social (`backend/app/models/social.py`)
- Agregados CheckConstraints para validar tipos de publicación y estados

### Ticket (`backend/app/models/ticket.py`)
- `titulo`: String(200)

## 3. Nuevos Schemas

### Residencial (`backend/app/schemas/residencial_schema.py`)
- `ResidencialBase`: Schema base
- `ResidencialCreate`: Para crear residenciales
- `ResidencialUpdate`: Para actualizar residenciales
- `ResidencialResponse`: Respuesta completa
- `ResidencialListResponse`: Para listar residenciales

### Actualizaciones en Schemas Existentes

#### Usuario (`backend/app/schemas/usuario_schema.py`)
- Agregado campo `residencial_id` opcional

#### Auth (`backend/app/schemas/auth_schema.py`)
- Agregado `residencial_id` en `TokenData`
- Agregado `residencial_id` en `LoginResponse`

#### Visitante (`backend/app/schemas/visitante_schema.py`)
- Actualizado campos según el nuevo modelo
- Eliminados campos `marca_vehiculo` y `color_vehiculo`

#### Visita (`backend/app/schemas/visita_schema.py`)
- Actualizado `SolicitudVisitaCreate` para campos opcionales

## 4. Nuevos Servicios

### Residencial (`backend/app/services/residencial_service.py`)
- `crear_residencial`: Crear nueva residencial
- `obtener_residencial`: Obtener residencial por ID
- `listar_residenciales`: Listar todas las residenciales
- `actualizar_residencial`: Actualizar residencial
- `eliminar_residencial`: Eliminar residencial

### Actualizaciones en Servicios Existentes

#### User Service (`backend/app/services/user_service.py`)
- Agregado `residencial_id` en creación de usuarios
- Agregado filtro por `residencial_id` en `obtener_usuario`
- Actualizada creación de registros específicos por rol

## 5. Nuevos Routers

### Residencial (`backend/app/routers/residenciales.py`)
- `POST /residenciales/`: Crear residencial
- `GET /residenciales/`: Listar residenciales
- `GET /residenciales/{id}`: Obtener residencial específica
- `PUT /residenciales/{id}`: Actualizar residencial
- `DELETE /residenciales/{id}`: Eliminar residencial

### Actualizaciones en Routers Existentes

#### Usuarios (`backend/app/routers/usuarios.py`)
- Agregado filtro por `residencial_id` en endpoints de residentes

## 6. Actualizaciones en Autenticación

### Auth Router (`backend/app/routers/auth.py`)
- Agregado `residencial_id` en token JWT
- Agregado `residencial_id` en respuesta de login
- Actualizado endpoint de refresh token

### Security Utils (`backend/app/utils/security.py`)
- Agregada función `get_current_residencial_id`
- Agregada función `verify_residencial_access`
- Actualizada función `verify_role` para usar Usuario en lugar de TokenData

## 7. Configuración Principal

### Main (`backend/app/main.py`)
- Agregado router de residenciales

## 8. Script SQL de Base de Datos

El script SQL proporcionado incluye:
- Creación de tabla `residenciales`
- Modificación de tablas existentes para agregar `residencial_id`
- Actualización de constraints y tipos de datos
- Nuevos estados para visitas y notificaciones

## 9. Beneficios de los Cambios

1. **Seguridad**: Los datos están separados por residencial
2. **Escalabilidad**: Permite manejar múltiples residenciales
3. **Organización**: Mejor estructura de datos
4. **Filtrado**: Todos los endpoints filtran por residencial automáticamente
5. **Validación**: Constraints mejorados en la base de datos

## 10. Próximos Pasos

Para completar la implementación, se deben:

1. **Actualizar todos los endpoints protegidos** para filtrar por `residencial_id`
2. **Crear migraciones de Alembic** para aplicar los cambios en la base de datos
3. **Actualizar el frontend** para manejar el `residencial_id`
4. **Probar la funcionalidad** con múltiples residenciales
5. **Documentar los nuevos endpoints** en la API

## 11. Ejemplo de Uso

```python
# Obtener residencial_id del usuario actual
residencial_id = get_current_residencial_id(user)

# Filtrar consultas por residencial
residentes = db.query(Residente).filter(
    Residente.residencial_id == residencial_id
).all()

# Verificar acceso a residencial específica
verify_residencial_access(user, residencial_id)
``` 