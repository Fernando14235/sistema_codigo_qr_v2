# 🎯 Guía del Super Administrador - Residencial Access

## 📋 Descripción

El Super Administrador es el usuario con más privilegios en el sistema, capaz de gestionar múltiples residenciales y crear administradores para cada una.

## 🔐 Características del Super Admin

- **Rol**: `admin`
- **Residencial**: `NULL` (no tiene residencial asignada)
- **Privilegios**: Acceso total al sistema
- **Funciones**: Crear residenciales, administradores, ver estadísticas globales

## 🚀 Configuración Inicial

### Paso 1: Crear el Super Admin

Ejecuta el script desde el directorio `backend`:

```bash
cd backend
python create_super_admin.py
```

**Resultado esperado:**
```
🏗️  Creando Super Administrador para Residencial Access
============================================================
✅ Super administrador creado exitosamente!
   Nombre: Super Administrador
   Email: superadmin@residencialaccess.com
   Contraseña: SuperAdmin123!
   Teléfono: +50499999999

🔐 IMPORTANTE: Cambia la contraseña después del primer login!

🎉 Configuración completada!

📋 Próximos pasos:
1. Inicia sesión con el super admin
2. Crea las residenciales necesarias
3. Crea administradores para cada residencial
4. Cambia la contraseña del super admin
```

### Paso 2: Iniciar Sesión

```bash
POST /auth/token
```

**Body:**
```json
{
    "username": "superadmin@residencialaccess.com",
    "password": "SuperAdmin123!"
}
```

**Respuesta:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "usuario": "superadmin@residencialaccess.com",
    "rol": "admin",
    "residencial_id": null,
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**🔑 Nota:** El `residencial_id` es `null`, indicando que es super admin.

## 🏗️ Flujo de Configuración del Sistema

### 1. Crear Residenciales

```bash
POST /residenciales/
Authorization: Bearer {super_admin_token}
```

**Body:**
```json
{
    "nombre": "Residencial Las Palmas",
    "direccion": "Calle Principal #123, Tegucigalpa"
}
```

**Respuesta:**
```json
{
    "id": 1,
    "nombre": "Residencial Las Palmas",
    "direccion": "Calle Principal #123, Tegucigalpa",
    "fecha_creacion": "2024-01-15T10:30:00Z"
}
```

### 2. Crear Administrador para la Residencial

```bash
POST /super-admin/crear-admin-residencial?residencial_id=1
Authorization: Bearer {super_admin_token}
```

**Body:**
```json
{
    "nombre": "Juan Pérez",
    "email": "admin@residencialpalmas.com",
    "password": "password123",
    "rol": "admin",
    "telefono": "+50499999999"
}
```

**Respuesta:**
```json
{
    "message": "Administrador creado exitosamente",
    "admin": {
        "id": 2,
        "nombre": "Juan Pérez",
        "email": "admin@residencialpalmas.com",
        "residencial_id": 1,
        "residencial_nombre": "Residencial Las Palmas"
    }
}
```

### 3. Verificar Administradores Creados

```bash
GET /super-admin/listar-admins
Authorization: Bearer {super_admin_token}
```

**Respuesta:**
```json
[
    {
        "id": 1,
        "nombre": "Super Administrador",
        "email": "superadmin@residencialaccess.com",
        "residencial_id": null,
        "residencial_nombre": "Super Admin",
        "fecha_creacion": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "nombre": "Juan Pérez",
        "email": "admin@residencialpalmas.com",
        "residencial_id": 1,
        "residencial_nombre": "Residencial Las Palmas",
        "fecha_creacion": "2024-01-15T10:35:00Z"
    }
]
```

### 4. Ver Estadísticas de Residenciales

```bash
GET /super-admin/listar-residenciales
Authorization: Bearer {super_admin_token}
```

**Respuesta:**
```json
[
    {
        "id": 1,
        "nombre": "Residencial Las Palmas",
        "direccion": "Calle Principal #123, Tegucigalpa",
        "fecha_creacion": "2024-01-15T10:30:00Z",
        "estadisticas": {
            "administradores": 1,
            "residentes": 0,
            "guardias": 0
        }
    }
]
```

## 🔄 Flujo Completo de Configuración

### Escenario: Configurar 3 Residenciales

1. **Crear Residencial 1:**
   ```bash
   POST /residenciales/
   {"nombre": "Residencial Las Palmas", "direccion": "Calle Principal #123"}
   ```

2. **Crear Admin para Residencial 1:**
   ```bash
   POST /super-admin/crear-admin-residencial?residencial_id=1
   {"nombre": "Juan Pérez", "email": "admin@palmas.com", "password": "pass123", "rol": "admin", "telefono": "+50499999999"}
   ```

3. **Crear Residencial 2:**
   ```bash
   POST /residenciales/
   {"nombre": "Residencial Los Pinos", "direccion": "Avenida Central #456"}
   ```

4. **Crear Admin para Residencial 2:**
   ```bash
   POST /super-admin/crear-admin-residencial?residencial_id=2
   {"nombre": "María García", "email": "admin@pinos.com", "password": "pass456", "rol": "admin", "telefono": "+50488888888"}
   ```

5. **Crear Residencial 3:**
   ```bash
   POST /residenciales/
   {"nombre": "Residencial El Bosque", "direccion": "Boulevard Norte #789"}
   ```

6. **Crear Admin para Residencial 3:**
   ```bash
   POST /super-admin/crear-admin-residencial?residencial_id=3
   {"nombre": "Carlos López", "email": "admin@bosque.com", "password": "pass789", "rol": "admin", "telefono": "+50477777777"}
   ```

## 🔐 Endpoints Exclusivos del Super Admin

### Residenciales
- `POST /residenciales/` - Crear residencial
- `GET /residenciales/` - Listar residenciales
- `GET /residenciales/{id}` - Obtener residencial específica
- `PUT /residenciales/{id}` - Actualizar residencial
- `DELETE /residenciales/{id}` - Eliminar residencial

### Super Admin
- `POST /super-admin/crear-admin-residencial` - Crear admin para residencial
- `GET /super-admin/listar-admins` - Listar todos los administradores
- `GET /super-admin/listar-residenciales` - Listar residenciales con estadísticas

## 🛡️ Seguridad

### Verificación de Super Admin
```python
def is_super_admin(user: Usuario = Depends(get_current_user)) -> bool:
    """Verificar si el usuario es super administrador"""
    return user.rol == "admin" and user.residencial_id is None
```

### Características de Seguridad
- Solo usuarios con `rol = "admin"` y `residencial_id = NULL` son super admins
- Los super admins pueden acceder a todas las residenciales
- Los super admins pueden crear administradores para cualquier residencial
- Los super admins pueden ver estadísticas globales

## 📊 Diferencias entre Super Admin y Admin Normal

| Característica | Super Admin | Admin Normal |
|----------------|-------------|--------------|
| `residencial_id` | `NULL` | `ID específico` |
| Crear residenciales | ✅ | ❌ |
| Crear admins | ✅ | ❌ |
| Ver todas las residenciales | ✅ | ❌ |
| Ver estadísticas globales | ✅ | ❌ |
| Gestionar su residencial | ✅ | ✅ |
| Crear usuarios en su residencial | ✅ | ✅ |

## 🚨 Consideraciones Importantes

1. **Contraseña del Super Admin**: Cambia la contraseña después del primer login
2. **Backup**: Mantén un respaldo de las credenciales del super admin
3. **Acceso Limitado**: Solo el super admin debe tener acceso a estos endpoints
4. **Auditoría**: Todos los cambios del super admin quedan registrados
5. **Seguridad**: Usa contraseñas fuertes para todos los administradores

## 🔧 Troubleshooting

### Error: "Ya existe un super administrador"
- Solo puede haber un super admin en el sistema
- Si necesitas cambiar el super admin, elimina el actual primero

### Error: "Usuario no tiene residencial asignado"
- Los endpoints normales requieren `residencial_id`
- Usa los endpoints específicos del super admin

### Error: "No tienes permiso para acceder a este recurso"
- Verifica que el token sea del super admin
- Verifica que el `residencial_id` sea `NULL` en el token

## 📞 Soporte

Para problemas con el super admin:
1. Verifica los logs del sistema
2. Confirma que el token JWT incluya `residencial_id: null`
3. Verifica que el usuario tenga rol `admin`
4. Contacta al equipo de desarrollo si persisten los problemas 