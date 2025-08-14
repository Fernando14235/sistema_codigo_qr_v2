# 🔒 Nueva Jerarquía de Vistas - Prioridad Residencial

## 🎯 Cambio Implementado

Se ha modificado la jerarquía de vistas para que **la configuración de residencial tenga prioridad absoluta** sobre la configuración individual de administradores.

### **Jerarquía ANTERIOR:**
```
1. Configuración específica del administrador (MAYOR prioridad)
2. Configuración de la residencial
3. Configuración por defecto
```

### **Jerarquía NUEVA:**
```
1. Configuración de la residencial (PRIORIDAD ABSOLUTA)
   - Si una vista está desactivada a nivel residencial, NO aparece para ningún admin
2. Configuración específica del administrador 
   - Solo puede activar vistas que estén permitidas por la residencial
3. Configuración por defecto (todas las vistas activas)
```

## 🔧 Cambios Técnicos Implementados

### **1. Backend - Lógica de Jerarquía**

#### **Función `determinar_vistas_admin` Modificada:**
```python
def determinar_vistas_admin(db: Session, admin_id: int) -> List[VistaConfigItem]:
    # PASO 1: Aplicar configuración de residencial (PRIORIDAD ABSOLUTA)
    vistas_bloqueadas_por_residencial = set()
    
    if config.vistas_residencial:
        for vista in config.vistas_residencial.vistas:
            if not vista.activa:
                vistas_bloqueadas_por_residencial.add(vista.id)
    
    # PASO 2: Aplicar configuración del administrador
    # PERO respetando las restricciones de la residencial
    if config.vistas_admin:
        for vista in config.vistas_admin.vistas:
            if vista.id in vistas_bloqueadas_por_residencial:
                # Forzar desactivación - la residencial tiene prioridad absoluta
                vistas_resultado[vista.id].activa = False
            else:
                # Solo si no está bloqueada, aplicar configuración del admin
                vistas_resultado[vista.id].activa = vista.activa
```

#### **Nueva Función `obtener_vistas_admin_con_restricciones`:**
```python
def obtener_vistas_admin_con_restricciones(db: Session, admin_id: int) -> List[dict]:
    """Obtener todas las vistas para un administrador, incluyendo las bloqueadas por residencial"""
    return [
        {
            "id": vista.id,
            "nombre": vista.nombre,
            "descripcion": vista.descripcion,
            "activa": activa_final,
            "bloqueada_por_residencial": bloqueada_por_residencial,
            "configurada_residencial": configurada_residencial,
            "configurada_admin": configurada_admin,
            "estado_residencial": estado_residencial,
            "estado_admin": estado_admin
        }
    ]
```

### **2. Backend - Desactivación Automática**

#### **Endpoint `toggle_vista_residencial` Mejorado:**
```python
# Si se está desactivando la vista a nivel residencial,
# desactivar automáticamente para todos los administradores de esa residencial
if not activa:
    admins_residencial = db.query(Administrador).join(UsuarioModel).filter(
        UsuarioModel.residencial_id == residencial_id
    ).all()
    
    for admin in admins_residencial:
        # Crear/actualizar configuración del admin - forzar desactivación
        vista_admin = VistaAdmin(
            admin_id=admin.id,
            vista_id=vista_id,
            activa=False  # Forzar desactivación
        )
```

### **3. Frontend - Interfaz Visual**

#### **Vistas Bloqueadas:**
```jsx
{vistasAdmin.map(vista => (
  <div key={vista.id} className={`vista-card ${vista.bloqueada_por_residencial ? 'bloqueada' : ''}`}>
    <div className="vista-info">
      <h4>{vista.nombre}</h4>
      <p>{vista.descripcion}</p>
      {vista.bloqueada_por_residencial ? (
        <span className="vista-status bloqueada">
          🔒 Bloqueada por Residencial
        </span>
      ) : (
        <span className="vista-status configurada">Configurada</span>
      )}
    </div>
    <div className="vista-toggle">
      <label className={`switch ${vista.bloqueada_por_residencial ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={vista.activa}
          disabled={vista.bloqueada_por_residencial}
          onChange={(e) => toggleVistaAdmin(vista.id, e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  </div>
))}
```

#### **Validación en Toggle:**
```javascript
const toggleVistaAdmin = async (vistaId, activa) => {
  const vista = vistasAdmin.find(v => v.id === vistaId);
  if (vista && vista.bloqueada_por_residencial) {
    setNotification({ 
      message: "No se puede activar una vista que está desactivada a nivel residencial", 
      type: "error" 
    });
    return;
  }
  // ... resto de la lógica
};
```

### **4. Frontend - Estilos CSS**

#### **Vistas Bloqueadas:**
```css
.vista-card.bloqueada {
  opacity: 0.6;
  background: #fafafa;
  border-color: #e0e0e0;
}

.vista-status.bloqueada {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch.disabled .slider {
  background-color: #e0e0e0;
}
```

#### **Información de Jerarquía:**
```css
.jerarquia-info {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}
```

## 🎯 Comportamiento Resultante

### **Escenario 1: Vista Desactivada a Nivel Residencial**
```
1. Super Admin desactiva "Social" para Residencial A
2. AUTOMÁTICAMENTE se desactiva "Social" para todos los admins de Residencial A
3. Los admins de Residencial A NO pueden reactivar "Social"
4. En el dashboard de admins de Residencial A, "Social" NO aparece
5. En la configuración del super admin, "Social" aparece como 🔒 Bloqueada
```

### **Escenario 2: Vista Activada a Nivel Residencial**
```
1. Super Admin activa "Tickets" para Residencial B
2. Los admins de Residencial B pueden activar/desactivar "Tickets" individualmente
3. Si un admin desactiva "Tickets", solo afecta a ese admin específico
4. Otros admins de la misma residencial siguen viendo "Tickets"
```

### **Escenario 3: Vista Sin Configuración Residencial**
```
1. Vista "Estadísticas" no tiene configuración específica para Residencial C
2. Por defecto está ACTIVA para todos los admins de Residencial C
3. Cada admin puede activar/desactivar "Estadísticas" individualmente
4. No hay restricciones a nivel residencial
```

## 🔍 Indicadores Visuales

### **En el SuperAdminDashboard:**
- ✅ **Vista Activa**: Toggle azul, texto normal
- ❌ **Vista Inactiva**: Toggle gris, texto normal
- 🔒 **Vista Bloqueada para Admin**: Toggle deshabilitado, texto "Bloqueada por Residencial"
- ℹ️ **Mensaje Informativo**: "Las vistas desactivadas a nivel residencial no pueden ser activadas por administradores individuales"

### **En el AdminDashboard:**
- ✅ **Vista Disponible**: Aparece en el menú principal
- ❌ **Vista Bloqueada**: NO aparece en el menú principal
- 🚫 **Acceso Directo**: Si intenta acceder por URL, se redirige al menú

## 📋 Flujo de Trabajo

### **Para el Super Administrador:**
1. **Seleccionar Residencial** → Ver todas las vistas
2. **Desactivar Vista** → Confirmar que afectará a todos los admins
3. **Ver Administradores** → Verificar que las vistas están bloqueadas
4. **Configurar por Admin** → Solo puede activar vistas permitidas por residencial

### **Para el Administrador:**
1. **Login** → Sistema carga vistas según jerarquía
2. **Menú Principal** → Solo ve vistas permitidas por su residencial
3. **Acceso Denegado** → No puede acceder a vistas bloqueadas por residencial
4. **Configuración Personal** → Solo puede modificar vistas no bloqueadas

## 🎉 Beneficios de la Nueva Jerarquía

1. **Control Centralizado**: Super admin tiene control absoluto por residencial
2. **Seguridad Mejorada**: No se puede eludir la configuración residencial
3. **Claridad Visual**: Indicadores claros de qué está bloqueado y por qué
4. **Automatización**: Desactivación automática de vistas para todos los admins
5. **Consistencia**: Todos los admins de una residencial ven lo mismo (a menos que tengan configuración individual)

La nueva jerarquía garantiza que la configuración de residencial sea respetada absolutamente, proporcionando un control más granular y seguro del sistema.