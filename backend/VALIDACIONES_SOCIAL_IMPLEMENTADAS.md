# Validaciones Implementadas - Módulo Social

## Resumen de Validaciones

Se han implementado las siguientes validaciones para asegurar que las publicaciones sociales se envíen correctamente a los destinatarios apropiados y que solo los residentes autorizados puedan verlas.

## 1. Validaciones en el Backend (Service Layer)

### 1.1 Creación de Publicaciones (`create_social`)

**Validaciones implementadas:**

- **Destinatarios obligatorios**: Si `para_todos = False`, debe especificar al menos un destinatario
- **Existencia de residentes**: Verifica que todos los destinatarios especificados existan en la base de datos
- **Manejo de errores**: Si falla la validación, la publicación se crea con estado "fallido" y se guarda el mensaje de error

**Código de validación:**
```python
# Validar que si no es para todos, debe tener destinatarios
if not social_data.para_todos and (not social_data.destinatarios or len(social_data.destinatarios) == 0):
    error_message = "Si la publicación no es para todos, debe especificar al menos un destinatario"
    raise ValueError(error_message)

# Validar que los destinatarios existan si se especifican
if social_data.destinatarios:
    for dest in social_data.destinatarios:
        residente = db.query(Residente).filter(Residente.id == dest.residente_id).first()
        if not residente:
            error_message = f"El residente con ID {dest.residente_id} no existe"
            raise ValueError(error_message)
```

### 1.2 Actualización de Publicaciones (`update_social`)

**Validaciones implementadas:**

- Mismas validaciones que en la creación
- Reseteo del estado a "publicado" si la actualización es exitosa
- Manejo de errores con estado "fallido"

### 1.3 Control de Acceso (`can_user_access_social`)

**Lógica implementada:**

- **Admins**: Pueden acceder a todas las publicaciones
- **Residentes**: Solo pueden acceder si:
  - La publicación es para todos (`para_todos = True`), O
  - Son destinatarios específicos de la publicación

### 1.4 Listado de Publicaciones (`get_social_list`)

**Filtrado por rol:**

- **Admins**: Ven todas las publicaciones
- **Residentes**: Solo ven publicaciones para todos O donde son destinatarios específicos

## 2. Validaciones en el Frontend

### 2.1 Formulario de Creación/Edición

**Validaciones implementadas:**

- **Validación de destinatarios**: Si no es para todos, debe seleccionar al menos un destinatario
- **Indicadores visuales**: Campo de destinatarios se marca en rojo si está vacío
- **Mensajes de error**: Muestra mensajes específicos cuando faltan destinatarios

**Código de validación:**
```javascript
// Validar que si no es para todos, debe tener destinatarios
if (!formData.para_todos && (!formData.destinatarios || formData.destinatarios.length === 0)) {
  setMensaje("Error: Si la publicación no es para todos, debe seleccionar al menos un destinatario");
  return;
}
```

### 2.2 Visualización de Estados

**Mejoras implementadas:**

- **Estado fallido**: Se muestra con fondo rojo claro en la tabla
- **Colores de estado**: Verde para "publicado", rojo para "fallido", naranja para "archivado"
- **Mensaje de error**: Se extrae y muestra el mensaje de error cuando el estado es fallido

### 2.3 Detalle de Publicación

**Información mostrada:**

- **Destinatarios**: Muestra si es para todos o lista los destinatarios específicos
- **Estado con color**: Estado con colores distintivos
- **Mensaje de error**: Si es fallido, muestra el mensaje de error en un recuadro rojo

## 3. Estructura de Base de Datos

### 3.1 Tabla `social_destinatarios`

**Propósito:** Almacena la relación entre publicaciones y residentes destinatarios

**Campos:**
- `id`: Clave primaria
- `social_id`: ID de la publicación (FK a `social.id`)
- `residente_id`: ID del residente destinatario (FK a `residentes.id`)

### 3.2 Campo `estado` en tabla `social`

**Valores posibles:**
- `"publicado"`: Publicación creada exitosamente
- `"fallido"`: Publicación con errores de validación
- `"archivado"`: Publicación archivada

## 4. Flujo de Validación

### 4.1 Creación de Publicación

1. **Frontend**: Usuario llena formulario
2. **Validación frontend**: Verifica que haya destinatarios si no es para todos
3. **Envío**: Datos se envían al backend
4. **Validación backend**: Verifica destinatarios y existencia de residentes
5. **Resultado**: 
   - ✅ Éxito: Estado "publicado"
   - ❌ Error: Estado "fallido" con mensaje de error

### 4.2 Visualización de Publicaciones

1. **Residente accede**: Se verifica su rol y ID
2. **Filtrado**: Solo se muestran publicaciones para todos O donde es destinatario
3. **Control de acceso**: Función `can_user_access_social` valida acceso individual

## 5. Casos de Uso Validados

### 5.1 Publicación para Todos
- ✅ Se crea correctamente
- ✅ Todos los residentes pueden verla
- ✅ Estado: "publicado"

### 5.2 Publicación para Destinatarios Específicos
- ✅ Se crea correctamente con destinatarios
- ✅ Solo los destinatarios pueden verla
- ✅ Estado: "publicado"

### 5.3 Publicación sin Destinatarios (No para Todos)
- ❌ Se marca como fallida
- ✅ Muestra mensaje de error específico
- ✅ Estado: "fallido"

### 5.4 Publicación con Destinatario Inexistente
- ❌ Se marca como fallida
- ✅ Muestra mensaje de error específico
- ✅ Estado: "fallido"

## 6. Script de Pruebas

Se ha creado `test_social_validation.py` que valida:

- Creación de publicaciones para todos
- Creación de publicaciones para destinatarios específicos
- Validación de errores cuando faltan destinatarios
- Validación de errores con destinatarios inexistentes
- Control de acceso de residentes
- Listado de publicaciones por rol

## 7. Mejoras de UX Implementadas

### 7.1 Indicadores Visuales
- Campos obligatorios marcados en rojo
- Estados con colores distintivos
- Mensajes de error claros y específicos

### 7.2 Validación en Tiempo Real
- El campo de destinatarios se valida mientras se escribe
- Mensajes de error aparecen inmediatamente
- Prevención de envío de formularios inválidos

### 7.3 Información Clara
- Se muestra claramente si una publicación es para todos o específica
- Los destinatarios se listan en el detalle
- Los errores se muestran de forma prominente

## 8. Seguridad Implementada

### 8.1 Control de Acceso
- Solo admins pueden crear/editar publicaciones
- Residentes solo ven publicaciones autorizadas
- Validación en múltiples capas (frontend y backend)

### 8.2 Validación de Datos
- Verificación de existencia de residentes
- Validación de permisos por rol
- Sanitización de datos de entrada

## 9. Próximos Pasos Recomendados

1. **Pruebas exhaustivas**: Ejecutar el script de pruebas en diferentes escenarios
2. **Monitoreo**: Implementar logs para rastrear publicaciones fallidas
3. **Notificaciones**: Considerar notificar a admins sobre publicaciones fallidas
4. **Auditoría**: Implementar registro de quién ve qué publicaciones 