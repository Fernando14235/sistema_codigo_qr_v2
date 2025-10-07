from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.utils.security import verify_role, get_current_user, is_super_admin, get_current_residencial_id
from app.services.vista_service import (
    crear_vista,
    obtener_vista,
    listar_vistas,
    actualizar_vista,
    eliminar_vista,
    asignar_vista_residencial,
    actualizar_vista_residencial,
    eliminar_vista_residencial,
    asignar_vista_admin,
    actualizar_vista_admin,
    eliminar_vista_admin,
    obtener_configuracion_vistas,
    determinar_vistas_admin
)
from app.schemas.vista_schema import (
    VistaCreate,
    VistaUpdate,
    VistaResponse,
    VistaListResponse
)
from app.schemas.vista_residencial_schema import (
    VistaResidencialCreate,
    VistaResidencialUpdate,
    VistaResidencialResponse,
    VistaResidencialListResponse
)
from app.schemas.vista_admin_schema import (
    VistaAdminCreate,
    VistaAdminUpdate,
    VistaAdminResponse,
    VistaAdminListResponse
)
from app.schemas.vista_config_schema import (
    VistaConfigResponse,
    VistaConfigItem
)
from app.models.admin import Administrador
from app.models.vista import Vista
from app.models.usuario import Usuario

router = APIRouter(prefix="/vistas", tags=["Vistas"])

@router.post("/", response_model=VistaResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def crear_nueva_vista(vista: VistaCreate, db: Session = Depends(get_db)):
    """Crear una nueva vista (solo super_admin)"""
    return crear_vista(db, vista)

@router.get("/", response_model=List[VistaListResponse])
def listar_todas_vistas(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Listar todas las vistas disponibles"""
    # Todos los usuarios pueden ver las vistas disponibles
    return listar_vistas(db)

@router.put("/{vista_id}", response_model=VistaResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def actualizar_vista_por_id(vista_id: int, vista: VistaUpdate, db: Session = Depends(get_db)):
    """Actualizar una vista (solo super_admin)"""
    return actualizar_vista(db, vista_id, vista)

@router.delete("/{vista_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def eliminar_vista_por_id(vista_id: int, db: Session = Depends(get_db)):
    """Eliminar una vista (solo super_admin)"""
    eliminar_vista(db, vista_id)
    return {"message": "Vista eliminada correctamente"}

# Endpoints para gestionar Vistas por Residencial (solo super_admin)

@router.post("/residencial", response_model=VistaResidencialResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def asignar_vista_a_residencial(vista_residencial: VistaResidencialCreate, db: Session = Depends(get_db)):
    """Asignar una vista a una residencial (solo super_admin)"""
    return asignar_vista_residencial(db, vista_residencial)

@router.put("/residencial/{vista_residencial_id}", response_model=VistaResidencialResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def actualizar_vista_residencial_por_id(vista_residencial_id: int, vista_residencial: VistaResidencialUpdate, db: Session = Depends(get_db)):
    """Actualizar la configuración de una vista para una residencial (solo super_admin)"""
    return actualizar_vista_residencial(db, vista_residencial_id, vista_residencial)

@router.delete("/residencial/{vista_residencial_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def eliminar_vista_residencial_por_id(vista_residencial_id: int, db: Session = Depends(get_db)):
    """Eliminar la asignación de una vista a una residencial (solo super_admin)"""
    eliminar_vista_residencial(db, vista_residencial_id)
    return {"message": "Asignación de vista a residencial eliminada correctamente"}

# Endpoints para gestionar Vistas por Administrador (solo super_admin)

@router.post("/admin", response_model=VistaAdminResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def asignar_vista_a_admin(vista_admin: VistaAdminCreate, db: Session = Depends(get_db)):
    """Asignar una vista a un administrador (solo super_admin)"""
    return asignar_vista_admin(db, vista_admin)

@router.put("/admin/{vista_admin_id}", response_model=VistaAdminResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def actualizar_vista_admin_por_id(vista_admin_id: int, vista_admin: VistaAdminUpdate, db: Session = Depends(get_db)):
    """Actualizar la configuración de una vista para un administrador (solo super_admin)"""
    return actualizar_vista_admin(db, vista_admin_id, vista_admin)

@router.delete("/admin/{vista_admin_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def eliminar_vista_admin_por_id(vista_admin_id: int, db: Session = Depends(get_db)):
    """Eliminar la asignación de una vista a un administrador (solo super_admin)"""
    eliminar_vista_admin(db, vista_admin_id)
    return {"message": "Asignación de vista a administrador eliminada correctamente"}

# Endpoints para obtener configuración de vistas

@router.get("/configuracion/{admin_id}", response_model=VistaConfigResponse, dependencies=[Depends(verify_role(["super_admin"]))])
def obtener_config_vistas_admin(admin_id: int, db: Session = Depends(get_db)):
    """Obtener la configuración de vistas para un administrador (solo super_admin)"""
    return obtener_configuracion_vistas(db, admin_id)

@router.get("/mi-configuracion", response_model=List[VistaConfigItem])
def obtener_mis_vistas(db: Session = Depends(get_db), current_user = Depends(verify_role(["admin"]))):
    """Obtener las vistas activas para el administrador actual"""
    try:
        # Verificar si existen vistas en el sistema
        total_vistas = db.query(Vista).count()
        if total_vistas == 0:
            # Si no hay vistas en la base de datos, devolver lista vacía
            return []
        
        # Obtener el ID del administrador actual
        admin = db.query(Administrador).filter(Administrador.usuario_id == current_user.id).first()
        if not admin:
            # Si no existe el registro de administrador, crear uno básico
            usuario = db.query(Usuario).filter(Usuario.id == current_user.id).first()
            if usuario and usuario.rol == "admin":
                # Crear registro de administrador básico
                admin = Administrador(
                    usuario_id=current_user.id,
                    telefono="",
                    unidad_residencial=""
                )
                db.add(admin)
                db.commit()
                db.refresh(admin)
            else:
                # Si no es admin, devolver vistas vacías
                return []
        
        # Determinar las vistas activas para este administrador
        vistas_activas = determinar_vistas_admin(db, admin.id)
        
        # Si no hay vistas activas configuradas, devolver todas las vistas de la BD como activas
        if not vistas_activas:
            todas_vistas = db.query(Vista).all()
            return [
                VistaConfigItem(
                    id=vista.id,
                    nombre=vista.nombre,
                    descripcion=vista.descripcion or "",
                    activa=True
                ) for vista in todas_vistas
            ]
        
        return vistas_activas
        
    except Exception as e:
        # En caso de error, devolver todas las vistas de la base de datos
        import traceback
        traceback.print_exc()
        
        try:
            # Intentar obtener vistas de la base de datos como fallback
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
        
@router.get("/{vista_id}", response_model=VistaResponse)
def obtener_vista_por_id(vista_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Obtener una vista específica por ID"""
    return obtener_vista(db, vista_id)