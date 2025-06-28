# Refactorización de Arquitectura - Endpoints de Visitas

## Objetivo
Separar la lógica de negocio de los endpoints para mejorar la legibilidad, mantenibilidad y testabilidad del código.

## Cambios Realizados

### 1. **Antes de la Refactorización**
Los endpoints contenían toda la lógica de negocio:
- Validaciones complejas
- Consultas a la base de datos
- Lógica de actualización de estados
- Manejo de errores específicos del dominio

### 2. **Después de la Refactorización**
La lógica se separó en capas:

#### **Capa de Presentación (Routers)**
- `app/routers/visitas.py`
- Responsabilidades:
  - Validación de autenticación/autorización
  - Extracción de datos de la request
  - Llamada a servicios
  - Formateo de respuesta HTTP
  - Registro de escaneos (auditoría)
  - Envío de notificaciones

#### **Capa de Servicios**
- `app/services/visita_service.py`
- Responsabilidades:
  - Lógica de negocio pura
  - Validaciones de dominio
  - Operaciones de base de datos
  - Manejo de errores de negocio

## Funciones Refactorizadas

### 1. **validar_qr** → **validar_qr_entrada**
```python
# Antes: Lógica completa en el endpoint
@router.post("/validar_qr")
def validar_qr(request, db, usuario):
    # 50+ líneas de lógica de negocio
    # Validaciones
    # Consultas a BD
    # Actualizaciones
    # Respuesta

# Después: Lógica separada
@router.post("/validar_qr")
def validar_qr(request, db, usuario):
    # Validación de guardia
    resultado = validar_qr_entrada(db, qr_code, guardia_id, accion)
    # Registro de escaneo
    # Notificación
    # Respuesta
```

### 2. **registrar_salida** → **registrar_salida_visita**
```python
# Antes: Lógica completa en el endpoint
@router.post("/registrar_salida")
def registrar_salida(request, db, usuario):
    # 40+ líneas de lógica de negocio
    # Validaciones
    # Consultas a BD
    # Actualizaciones
    # Respuesta

# Después: Lógica separada
@router.post("/registrar_salida")
def registrar_salida(request, db, usuario):
    # Validación de guardia
    resultado = registrar_salida_visita(db, qr_code, guardia_id)
    # Registro de escaneo
    # Notificación
    # Respuesta
```

## Beneficios de la Refactorización

### 1. **Legibilidad**
- Los endpoints son más fáciles de leer y entender
- Cada función tiene una responsabilidad clara
- Código más limpio y organizado

### 2. **Mantenibilidad**
- Cambios en la lógica de negocio solo afectan los servicios
- Cambios en la presentación solo afectan los routers
- Menor acoplamiento entre capas

### 3. **Testabilidad**
- Los servicios pueden ser probados independientemente
- Los endpoints pueden ser probados con servicios mock
- Pruebas unitarias más específicas

### 4. **Reutilización**
- Los servicios pueden ser usados por otros endpoints
- Lógica de negocio centralizada
- Menos duplicación de código

### 5. **Separación de Responsabilidades**
- **Routers**: Manejo HTTP, autenticación, presentación
- **Servicios**: Lógica de negocio, validaciones, operaciones de datos
- **Modelos**: Persistencia y estructura de datos

## Estructura Final

```
app/
├── routers/
│   └── visitas.py          # Endpoints HTTP (presentación)
├── services/
│   └── visita_service.py   # Lógica de negocio
├── models/
│   ├── visita.py           # Modelo de datos
│   └── escaneo_qr.py       # Modelo de auditoría
└── schemas/
    └── visita_schema.py    # Validación de entrada/salida
```

## Patrón Aplicado

### **Clean Architecture / Layered Architecture**
- **Capa Externa**: Routers (HTTP, autenticación)
- **Capa de Aplicación**: Servicios (casos de uso)
- **Capa de Dominio**: Modelos (entidades de negocio)
- **Capa de Infraestructura**: Base de datos, notificaciones

## Próximos Pasos Recomendados

1. **Aplicar el mismo patrón** a otros endpoints
2. **Crear interfaces** para los servicios (dependency injection)
3. **Implementar tests unitarios** para los servicios
4. **Documentar** todos los servicios con docstrings
5. **Crear DTOs** específicos para cada operación

## Conclusión

La refactorización mejora significativamente la calidad del código al:
- Separar responsabilidades claramente
- Facilitar el mantenimiento y testing
- Mejorar la legibilidad y organización
- Seguir principios de arquitectura limpia 