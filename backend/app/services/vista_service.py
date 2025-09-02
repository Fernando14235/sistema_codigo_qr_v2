from sqlalchemy.orm import Session
from app.models.vista import Vista
from app.models.vista_residencial import VistaResidencial
from app.models.vista_admin import VistaAdmin
from app.models.residencial import Residencial
from app.models.admin import Administrador
from app.models.usuario import Usuario
from app.schemas.vista_schema import VistaCreate, VistaUpdate
from app.schemas.vista_residencial_schema import VistaResidencialCreate, VistaResidencialUpdate
from app.schemas.vista_admin_schema import VistaAdminCreate, VistaAdminUpdate
from app.schemas.vista_config_schema import VistaConfigItem, VistaResidencialConfig, VistaAdminConfig, VistaConfigResponse
from fastapi import HTTPException, status
from typing import List, Optional
from sqlalchemy import and_

# Funciones para gestionar Vistas

def crear_vista(db: Session, vista: VistaCreate) -> Vista:
    """Crear una nueva vista"""
    db_vista = Vista(
        nombre=vista.nombre,
        descripcion=vista.descripcion
    )
    db.add(db_vista)
    db.commit()
    db.refresh(db_vista)
    return db_vista

def obtener_vista(db: Session, vista_id: int) -> Vista:
    """Obtener una vista por ID"""
    vista = db.query(Vista).filter(Vista.id == vista_id).first()
    if not vista:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vista no encontrada"
        )
    return vista

def listar_vistas(db: Session, skip: int = 0, limit: int = 100) -> List[Vista]:
    """Listar todas las vistas"""
    return db.query(Vista).offset(skip).limit(limit).all()

def actualizar_vista(db: Session, vista_id: int, vista: VistaUpdate) -> Vista:
    """Actualizar una vista"""
    db_vista = obtener_vista(db, vista_id)
    
    update_data = vista.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vista, field, value)
    
    db.commit()
    db.refresh(db_vista)
    return db_vista

def eliminar_vista(db: Session, vista_id: int) -> bool:
    """Eliminar una vista"""
    db_vista = obtener_vista(db, vista_id)
    db.delete(db_vista)
    db.commit()
    return True

# Funciones para gestionar Vistas por Residencial

def asignar_vista_residencial(db: Session, vista_residencial: VistaResidencialCreate) -> VistaResidencial:
    """Asignar una vista a una residencial"""
    # Verificar que la vista existe
    obtener_vista(db, vista_residencial.vista_id)
    
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == vista_residencial.residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Verificar si ya existe esta asignación
    existente = db.query(VistaResidencial).filter(
        and_(
            VistaResidencial.vista_id == vista_residencial.vista_id,
            VistaResidencial.residencial_id == vista_residencial.residencial_id
        )
    ).first()
    
    if existente:
        # Si ya existe, actualizar el estado activa
        existente.activa = vista_residencial.activa
        db.commit()
        db.refresh(existente)
        return existente
    
    # Si no existe, crear nueva asignación
    db_vista_residencial = VistaResidencial(
        vista_id=vista_residencial.vista_id,
        residencial_id=vista_residencial.residencial_id,
        activa=vista_residencial.activa
    )
    db.add(db_vista_residencial)
    db.commit()
    db.refresh(db_vista_residencial)
    return db_vista_residencial

def actualizar_vista_residencial(db: Session, vista_residencial_id: int, vista_residencial: VistaResidencialUpdate) -> VistaResidencial:
    """Actualizar la configuración de una vista para una residencial"""
    db_vista_residencial = db.query(VistaResidencial).filter(VistaResidencial.id == vista_residencial_id).first()
    if not db_vista_residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de vista a residencial no encontrada"
        )
    
    update_data = vista_residencial.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vista_residencial, field, value)
    
    db.commit()
    db.refresh(db_vista_residencial)
    return db_vista_residencial

def eliminar_vista_residencial(db: Session, vista_residencial_id: int) -> bool:
    """Eliminar la asignación de una vista a una residencial"""
    db_vista_residencial = db.query(VistaResidencial).filter(VistaResidencial.id == vista_residencial_id).first()
    if not db_vista_residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de vista a residencial no encontrada"
        )
    
    db.delete(db_vista_residencial)
    db.commit()
    return True

# Funciones para gestionar Vistas por Administrador

def asignar_vista_admin(db: Session, vista_admin: VistaAdminCreate) -> VistaAdmin:
    """Asignar una vista a un administrador"""
    # Verificar que la vista existe
    obtener_vista(db, vista_admin.vista_id)
    
    # Verificar que el administrador existe
    admin = db.query(Administrador).filter(Administrador.id == vista_admin.admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrador no encontrado"
        )
    
    # Verificar si ya existe esta asignación
    existente = db.query(VistaAdmin).filter(
        and_(
            VistaAdmin.vista_id == vista_admin.vista_id,
            VistaAdmin.admin_id == vista_admin.admin_id
        )
    ).first()
    
    if existente:
        # Si ya existe, actualizar el estado activa
        existente.activa = vista_admin.activa
        db.commit()
        db.refresh(existente)
        return existente
    
    # Si no existe, crear nueva asignación
    db_vista_admin = VistaAdmin(
        vista_id=vista_admin.vista_id,
        admin_id=vista_admin.admin_id,
        activa=vista_admin.activa
    )
    db.add(db_vista_admin)
    db.commit()
    db.refresh(db_vista_admin)
    return db_vista_admin

def actualizar_vista_admin(db: Session, vista_admin_id: int, vista_admin: VistaAdminUpdate) -> VistaAdmin:
    """Actualizar la configuración de una vista para un administrador"""
    db_vista_admin = db.query(VistaAdmin).filter(VistaAdmin.id == vista_admin_id).first()
    if not db_vista_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de vista a administrador no encontrada"
        )
    
    update_data = vista_admin.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vista_admin, field, value)
    
    db.commit()
    db.refresh(db_vista_admin)
    return db_vista_admin

def eliminar_vista_admin(db: Session, vista_admin_id: int) -> bool:
    """Eliminar la asignación de una vista a un administrador"""
    db_vista_admin = db.query(VistaAdmin).filter(VistaAdmin.id == vista_admin_id).first()
    if not db_vista_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de vista a administrador no encontrada"
        )
    
    db.delete(db_vista_admin)
    db.commit()
    return True

# Función para obtener la configuración de vistas para un administrador

def obtener_configuracion_vistas(db: Session, admin_id: int) -> VistaConfigResponse:
    """Obtener la configuración de vistas para un administrador, considerando la jerarquía"""
    try:
        # Obtener el administrador
        admin = db.query(Administrador).filter(Administrador.id == admin_id).first()
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador no encontrado"
            )
    
        # Obtener todas las vistas disponibles
        todas_vistas = db.query(Vista).all()
        vistas_disponibles = [
            VistaConfigItem(
                id=vista.id,
                nombre=vista.nombre,
                descripcion=vista.descripcion or "",
                activa=True  # Por defecto todas las vistas están activas
            ) for vista in todas_vistas
        ]
        
        # Obtener configuración de vistas para la residencial del administrador
        vistas_residencial = None
        if admin.residencial_id:
            vistas_residencial_db = db.query(VistaResidencial).filter(
                VistaResidencial.residencial_id == admin.residencial_id
            ).all()
            
            if vistas_residencial_db:
                residencial = db.query(Residencial).filter(Residencial.id == admin.residencial_id).first()
                
                # Crear lista de vistas con su configuración
                vistas_config = []
                for vr in vistas_residencial_db:
                    # Buscar la vista correspondiente
                    vista = next((v for v in todas_vistas if v.id == vr.vista_id), None)
                    if vista:
                        vistas_config.append(VistaConfigItem(
                            id=vista.id,
                            nombre=vista.nombre,
                            descripcion=vista.descripcion or "",
                            activa=vr.activa
                        ))
                
                vistas_residencial = VistaResidencialConfig(
                    residencial_id=admin.residencial_id,
                    nombre_residencial=residencial.nombre if residencial else "Desconocido",
                    vistas=vistas_config
                )
        
        # Obtener configuración de vistas para el administrador específico
        vistas_admin_db = db.query(VistaAdmin).filter(
            VistaAdmin.admin_id == admin_id
        ).all()
        
        vistas_admin = None
        if vistas_admin_db:
            # Obtener información del admin
            admin_usuario = db.query(Usuario).filter(Usuario.id == admin.usuario_id).first()
            
            # Crear lista de vistas con su configuración
            vistas_config = []
            for va in vistas_admin_db:
                # Buscar la vista correspondiente
                vista = next((v for v in todas_vistas if v.id == va.vista_id), None)
                if vista:
                    vistas_config.append(VistaConfigItem(
                        id=vista.id,
                        nombre=vista.nombre,
                        descripcion=vista.descripcion or "",
                        activa=va.activa
                    ))
            
            vistas_admin = VistaAdminConfig(
                admin_id=admin_id,
                nombre_admin=admin_usuario.nombre if admin_usuario else "Desconocido",
                vistas=vistas_config
            )
        
        return VistaConfigResponse(
            vistas_disponibles=vistas_disponibles,
            vistas_residencial=vistas_residencial,
            vistas_admin=vistas_admin
        )
        
    except Exception as e:
        print(f"Error en obtener_configuracion_vistas: {str(e)}")
        import traceback
        traceback.print_exc()
        # En caso de error, devolver configuración básica
        return VistaConfigResponse(
            vistas_disponibles=[],
            vistas_residencial=None,
            vistas_admin=None
        )

# Función para determinar qué vistas debe ver un administrador

def determinar_vistas_admin(db: Session, admin_id: int) -> List[VistaConfigItem]:
    """Determinar qué vistas debe ver un administrador según la jerarquía de configuración
    
    NUEVA JERARQUÍA DE PRIORIDAD:
    1. Configuración de la residencial (PRIORIDAD ABSOLUTA)
       - Si una vista está desactivada a nivel residencial, NO aparece para ningún admin
    2. Configuración específica del administrador 
       - Solo puede activar vistas que estén permitidas por la residencial
    3. Configuración por defecto (todas las vistas activas)
    """
    try:
        # Obtener toda la configuración
        config = obtener_configuracion_vistas(db, admin_id)
        
        # Si no hay vistas disponibles, devolver lista vacía
        if not config.vistas_disponibles:
            return []
        
        # Crear un diccionario con todas las vistas disponibles (por defecto todas activas)
        vistas_resultado = {vista.id: vista for vista in config.vistas_disponibles}
        
        # PASO 1: Aplicar configuración de residencial (PRIORIDAD ABSOLUTA)
        vistas_bloqueadas_por_residencial = set()
        
        if config.vistas_residencial and config.vistas_residencial.vistas:
            for vista in config.vistas_residencial.vistas:
                if vista.id in vistas_resultado:
                    # Si la vista está desactivada a nivel residencial, marcarla como bloqueada
                    if not vista.activa:
                        vistas_bloqueadas_por_residencial.add(vista.id)
                    
                    # Aplicar configuración de residencial
                    vistas_resultado[vista.id] = VistaConfigItem(
                        id=vista.id,
                        nombre=vista.nombre,
                        descripcion=vista.descripcion,
                        activa=vista.activa
                    )
        
        # PASO 2: Aplicar configuración específica del administrador
        # PERO respetando las restricciones de la residencial
        if config.vistas_admin and config.vistas_admin.vistas:
            for vista in config.vistas_admin.vistas:
                if vista.id in vistas_resultado:
                    # Si la vista está bloqueada por la residencial, NO permitir que el admin la active
                    if vista.id in vistas_bloqueadas_por_residencial:
                        # Forzar desactivación - la residencial tiene prioridad absoluta
                        vistas_resultado[vista.id] = VistaConfigItem(
                            id=vista.id,
                            nombre=vista.nombre,
                            descripcion=vista.descripcion,
                            activa=False  # Forzar desactivación
                        )
                    else:
                        # Solo si no está bloqueada por residencial, aplicar configuración del admin
                        vistas_resultado[vista.id] = VistaConfigItem(
                            id=vista.id,
                            nombre=vista.nombre,
                            descripcion=vista.descripcion,
                            activa=vista.activa
                        )
        
        # PASO 3: Filtrar solo las vistas activas
        vistas_activas = [vista for vista in vistas_resultado.values() if vista.activa]
        
        # Ordenar por nombre para consistencia
        vistas_activas.sort(key=lambda x: x.nombre)
        
        return vistas_activas
        
    except Exception as e:
        print(f"Error en determinar_vistas_admin: {str(e)}")
        # En caso de error, intentar devolver todas las vistas de la base de datos
        try:
            todas_vistas = db.query(Vista).all()
            return [
                VistaConfigItem(
                    id=vista.id,
                    nombre=vista.nombre,
                    descripcion=vista.descripcion or "",
                    activa=True
                ) for vista in todas_vistas
            ]
        except:
            # Si todo falla, devolver lista vacía
            return []

def obtener_vistas_admin_con_restricciones(db: Session, admin_id: int) -> List[dict]:
    """Obtener todas las vistas para un administrador, incluyendo las bloqueadas por residencial"""
    try:
        # Verificar que el administrador existe
        admin = db.query(Administrador).filter(Administrador.id == admin_id).first()
        if not admin:
            return []
        
        # Obtener todas las vistas disponibles
        todas_vistas = db.query(Vista).all()
        if not todas_vistas:
            return []
        
        # Obtener configuración de residencial si existe
        configuracion_residencial = {}
        vistas_bloqueadas_por_residencial = set()
        
        if admin.residencial_id:
            vistas_residencial = db.query(VistaResidencial).filter(
                VistaResidencial.residencial_id == admin.residencial_id
            ).all()
            
            for vr in vistas_residencial:
                configuracion_residencial[vr.vista_id] = vr.activa
                if not vr.activa:
                    vistas_bloqueadas_por_residencial.add(vr.vista_id)
        
        # Obtener configuración específica del admin
        configuracion_admin = {}
        vistas_admin = db.query(VistaAdmin).filter(
            VistaAdmin.admin_id == admin_id
        ).all()
        
        for va in vistas_admin:
            configuracion_admin[va.vista_id] = va.activa
        
        # Procesar cada vista disponible
        resultado = []
        for vista in todas_vistas:
            # Determinar el estado final
            bloqueada_por_residencial = vista.id in vistas_bloqueadas_por_residencial
            configurada_residencial = vista.id in configuracion_residencial
            configurada_admin = vista.id in configuracion_admin
            
            # Estado final: si está bloqueada por residencial, siempre false
            if bloqueada_por_residencial:
                activa_final = False
            elif configurada_admin:
                activa_final = configuracion_admin[vista.id]
            elif configurada_residencial:
                activa_final = configuracion_residencial[vista.id]
            else:
                activa_final = True  # Por defecto activa
            
            resultado.append({
                "id": vista.id,
                "nombre": vista.nombre,
                "descripcion": vista.descripcion or "",
                "activa": activa_final,
                "bloqueada_por_residencial": bloqueada_por_residencial,
                "configurada_residencial": configurada_residencial,
                "configurada_admin": configurada_admin,
                "estado_residencial": configuracion_residencial.get(vista.id, True),
                "estado_admin": configuracion_admin.get(vista.id, True)
            })
        
        return resultado
        
    except Exception as e:
        print(f"Error en obtener_vistas_admin_con_restricciones: {str(e)}")
        import traceback
        traceback.print_exc()
        return []