# 📋 Validaciones Implementadas en el Backend

## 🔐 **Validaciones de Seguridad**

### 1. **Autenticación y Autorización**
- ✅ **Tokens JWT**: Verificación de expiración y firma
- ✅ **Roles y Permisos**: Validación de roles específicos por endpoint
- ✅ **Rate Limiting**: Máximo 100 requests por minuto por IP
- ✅ **IP Blocking**: Sistema de bloqueo de IPs maliciosas

### 2. **Protección contra Ataques**
- ✅ **SQL Injection**: Detección de patrones SQL maliciosos
- ✅ **XSS Protection**: Validación de scripts y contenido peligroso
- ✅ **CSRF Protection**: Headers de seguridad en respuestas
- ✅ **Content-Type Validation**: Validación de tipos de contenido

## 📝 **Validaciones de Datos de Usuario**

### 3. **Validaciones de Email**
```python
# Formato válido de email
validar_formato_email(email: str) -> bool

# Dominio no bloqueado
validar_dominio_email(email: str) -> bool

# Email único en el sistema
validar_email_unico(db, email, usuario_id=None)
```

**Reglas:**
- Formato RFC 5322
- Dominios temporales bloqueados (tempmail.com, etc.)
- Debe ser único en el sistema

### 4. **Validaciones de Teléfono**
```python
# Formato internacional
validar_formato_telefono(telefono: str) -> bool

# Formato peruano específico
validar_formato_telefono_original(telefono: str)

# Formato Honduras (+504) - ACTUALIZADO
validar_formato_telefono_honduras(telefono: str) -> None

# Normalizar teléfono Honduras
normalizar_telefono_honduras(telefono: str) -> str

# Validar que no esté vacío
validar_telefono_no_vacio(telefono: str) -> None

# Versión boolean para Honduras
validar_formato_telefono_honduras_bool(telefono: str) -> bool
```

**Reglas para Honduras (+504) - ACTUALIZADAS:**
- **No puede estar vacío**
- **Acepta cualquier dígito del 0-9** (no solo 9)
- **Se normaliza automáticamente** al formato `+504XXXXXXXX`
- Formatos válidos de entrada:
  - `+504 XXXX XXXX` (con espacio)
  - `+504XXXX XXXX` (sin espacio)
  - `XXXX XXXX` (sin código país)
  - `XXXXXXXX` (sin espacios)
- **Total de 8 dígitos** después del código país

**Ejemplos válidos (cualquier dígito inicial):**
- `+504 9123 4567` → `+50491234567`
- `+504 8123 4567` → `+50481234567`
- `+504 7234 5678` → `+50472345678`
- `+504 6345 6789` → `+50463456789`
- `+504 0000 0000` → `+50400000000`
- `9123 4567` → `+50491234567`
- `81234567` → `+50481234567`

**Ejemplos inválidos:**
- `""` (vacío)
- `+504 912 3456` (menos de 8 dígitos)
- `912345678` (más de 8 dígitos)
- `+503 9123 4567` (código país incorrecto)
- `abc12345` (con letras)

### 5. **Validaciones de Contraseña**
```python
validar_fortaleza_password(password: str) -> bool
```

**Reglas:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

### 6. **Validaciones de DNI**
```python
# Formato peruano
validar_formato_dni(dni: str) -> bool

# Único por fecha de visita
validar_dni_unico_por_fecha(db, dni, fecha_entrada)
```

**Reglas:**
- 8 dígitos numéricos
- Único por fecha de visita
- Formato peruano estándar

## 🏠 **Validaciones Específicas del Sistema**

### 7. **Validaciones de Unidad Residencial**
```python
# Formato válido
validar_formato_unidad_residencial(unidad: str) -> bool

# Disponibilidad
validar_unidad_disponible(db, unidad, usuario_id=None)
```

**Reglas:**
- Formato: `[Letra]-[3 dígitos]` (ej: A-101, B-205)
- Debe estar disponible (no asignada a otro residente)

### 8. **Validaciones de Placa de Vehículo**
```python
validar_formato_placa(placa: str) -> bool
```

**Reglas:**
- Formato peruano: `AAA-000` o `A00-000`
- Solo letras mayúsculas y números

### 9. **Validaciones de Fechas y Horarios**
```python
# Fecha de entrada válida
validar_fecha_entrada(fecha_entrada: datetime) -> bool

# Horario permitido
validar_horario_visita(fecha_entrada: datetime) -> bool

# Día de la semana
validar_dia_semana_visita(fecha_entrada: datetime) -> bool
```

**Reglas:**
- No puede ser en el pasado
- Máximo 30 días en el futuro
- Horario: 6:00 AM - 10:00 PM
- Todos los días permitidos

## 📊 **Validaciones de Negocio**

### 10. **Límites y Restricciones**
```python
# Límite de visitas diarias
validar_limite_visitas_diarias(db, residente_id, fecha) -> bool

# Límite de visitantes por visita
validar_limite_visitantes_por_visita(visitantes: list) -> bool
```

**Reglas:**
- Máximo 5 visitas por día por residente
- Máximo 4 visitantes por visita

### 11. **Validaciones de Estado**
```python
validar_transicion_estado(estado_actual: str, nuevo_estado: str) -> bool
```

**Transiciones Válidas:**
- `pendiente` → `en_proceso` o `cancelada`
- `en_proceso` → `completada` o `cancelada`
- `completada` → (estado final)
- `cancelada` → (estado final)

### 12. **Validaciones de QR**
```python
validar_qr_expirado(fecha_expiracion: datetime) -> bool
```

**Reglas:**
- QR válido hasta 24 horas después de la fecha de entrada
- No puede ser usado después de expirar

## 🔍 **Validaciones de Entrada**

### 13. **Sanitización de Datos**
```python
# Sanitizar texto
sanitizar_texto(texto: str) -> str

# Validar longitud
validar_longitud_campo(valor: str, max_length: int, min_length: int = 1) -> bool
```

**Reglas:**
- Remover caracteres de control peligrosos
- Limitar longitud de campos
- Escapar caracteres HTML

## 📋 **Validaciones Compuestas**

### 14. **Validación Completa de Usuario**
```python
validar_datos_usuario_completos(db, email, telefono, password, unidad_residencial=None, usuario_id=None) -> dict
```

**Retorna:**
```json
{
    "valido": true/false,
    "errores": ["lista de errores"]
}
```

### 15. **Validación Completa de Visita**
```python
validar_datos_visita_completos(db, residente_id, fecha_entrada, visitantes) -> dict
```

**Incluye validaciones de:**
- Fecha y horario
- Límites de visitas
- Datos de visitantes
- DNI únicos
- Placas de vehículos

## 🛡️ **Middleware de Seguridad**

### 16. **SecurityMiddleware**
```python
# Protecciones implementadas:
- Rate limiting por IP
- Detección de SQL injection
- Detección de XSS
- Validación de headers
- Bloqueo de IPs maliciosas
- Headers de seguridad automáticos
```

## 📊 **Sistema de Auditoría**

### 17. **AuditLogger**
```python
# Eventos registrados:
- Creación/actualización/eliminación de usuarios
- Intentos de login
- Creación de visitas
- Escaneo de QR
- Acciones administrativas
- Eventos de seguridad
- Errores del sistema
- Acceso a datos sensibles
- Cambios de configuración
- Operaciones de backup
- Envío de notificaciones
- Uso de APIs
```

## 🚀 **Cómo Implementar las Validaciones**

### En los Servicios:
```python
from app.utils.validators import validar_datos_usuario_completos, validar_formato_telefono_honduras, normalizar_telefono_honduras

def crear_usuario(db: Session, usuario: UsuarioCreate) -> Usuario:
    # Validar email único
    validar_email_unico(db, usuario.email)
    
    # Validar formato de teléfono Honduras
    validar_formato_telefono_honduras(usuario.telefono)
    
    # Normalizar teléfono al formato +504XXXXXXXX
    telefono_normalizado = normalizar_telefono_honduras(usuario.telefono)
    
    # Continuar con la creación usando telefono_normalizado...
```

### En los Schemas (Pydantic):
```python
from pydantic import validator

class UsuarioCreate(UsuarioBase):
    telefono: str 
    
    @validator('telefono')
    def validar_telefono_honduras(cls, v):
        if not v or not v.strip():
            raise ValueError('El teléfono es obligatorio y no puede estar vacío')
        
        # Validación de formato Honduras (cualquier dígito)
        telefono_limpio = re.sub(r'[\s\-]', '', v.strip())
        patrones_validos = [
            r'^\+504\d{8}$',
            r'^\+504\s?\d{8}$',
            r'^\d{8}$',
        ]
        
        if not any(re.match(patron, telefono_limpio) for patron in patrones_validos):
            raise ValueError('Formato de teléfono inválido para Honduras')
        
        # Normalizar al formato +504XXXXXXXX
        return cls.normalizar_telefono(v)
    
    @staticmethod
    def normalizar_telefono(telefono: str) -> str:
        # Lógica de normalización...
        return f"+504{numero_normalizado}"
```

### En los Endpoints:
```python
from app.utils.audit import audit_logger

@app.post('/usuarios/')
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        db_usuario = user_service.crear_usuario(db, usuario)
        
        # Registrar en auditoría
        audit_logger.log_user_creation(db, db_usuario)
        
        return db_usuario
    except Exception as e:
        audit_logger.log_system_error("USER_CREATION", str(e), {"email": usuario.email})
        raise
```

## 📈 **Métricas y Monitoreo**

### Logs Generados:
- `audit.log`: Eventos de auditoría
- `security.log`: Eventos de seguridad
- `application.log`: Logs generales de la aplicación

### Métricas Clave:
- Intentos de login fallidos
- Rate limiting activado
- IPs bloqueadas
- Errores de validación
- Tiempo de respuesta de APIs

## 🔧 **Configuración**

### Variables de Entorno:
```env
# Rate limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=INFO
AUDIT_LOG_FILE=audit.log

# Seguridad
MAX_REQUEST_SIZE=1048576  # 1MB
```

## 📱 **Validaciones de Teléfono Honduras - Detalles Actualizados**

### Cambios Implementados:

1. **✅ Flexibilidad de dígitos**: Ya no requiere que empiece con 9
2. **✅ Cualquier dígito del 0-9**: Acepta números que empiecen con cualquier dígito
3. **✅ Normalización automática**: Convierte automáticamente al formato `+504XXXXXXXX`
4. **✅ Guardado consistente**: Todos los teléfonos se guardan en el mismo formato

### Implementación en Múltiples Niveles:

1. **Nivel Schema (Pydantic)**: Validación y normalización automática
2. **Nivel Servicio**: Validación adicional y normalización antes de guardar
3. **Nivel Utilitario**: Funciones reutilizables para validaciones

### Casos de Uso Actualizados:

```python
# Crear usuario con diferentes formatos de teléfono
usuarios_ejemplo = [
    {
        "nombre": "Juan Pérez",
        "email": "juan@example.com",
        "telefono": "+504 9123 4567",  # ✅ Válido, se normaliza
        "password": "Password123",
        "rol": "residente",
        "unidad_residencial": "A-101"
    },
    {
        "nombre": "María López", 
        "email": "maria@example.com",
        "telefono": "8123 4567",  # ✅ Válido, se normaliza a +50481234567
        "password": "Password123",
        "rol": "residente",
        "unidad_residencial": "B-202"
    },
    {
        "nombre": "Carlos Ruiz",
        "email": "carlos@example.com", 
        "telefono": "+50472345678",  # ✅ Válido, se normaliza
        "password": "Password123",
        "rol": "guardia"
    }
]

# Errores que se previenen:
# ❌ "telefono": ""  # Error: El teléfono es obligatorio
# ❌ "telefono": "+504 912 3456"  # Error: Menos de 8 dígitos
# ❌ "telefono": "912345678"  # Error: Más de 8 dígitos
# ❌ "telefono": "+503 9123 4567"  # Error: Código país incorrecto
```

### Proceso de Normalización:

```python
# Ejemplos de normalización:
"+504 9123 4567" → "+50491234567"
"+50491234567"   → "+50491234567"  
"9123 4567"      → "+50491234567"
"91234567"       → "+50491234567"
"8123 4567"      → "+50481234567"
"+504 7234-5678" → "+50472345678"
```

Esta implementación proporciona una capa robusta de validaciones que garantiza la integridad, seguridad y confiabilidad del sistema de control de acceso residencial, con validaciones de teléfono Honduras flexibles y normalización automática. 