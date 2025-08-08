from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.utils.security import is_super_admin
from app.services.user_service import crear_usuario
from app.schemas.usuario_schema import UsuarioCreate, Usuario
from app.models.usuario import Usuario as UsuarioModel
from app.models.residencial import Residencial
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.utils.security import verify_role

router = APIRouter(prefix="/super-admin", tags=["Super Administrador"])

@router.post("/crear-admin-residencial", dependencies=[Depends(verify_role(["super_admin"]))])
def crear_admin_para_residencial(
    admin_data: UsuarioCreate,
    residencial_id: int,
    db: Session = Depends(get_db)
):
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    # Verificar que el rol sea admin
    if admin_data.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden crear administradores con este endpoint"
        )
    
    # Asignar la residencial al admin
    admin_data.residencial_id = residencial_id
    
    # Crear el administrador
    try:
        nuevo_admin = crear_usuario(db, admin_data)
        return {
            "message": "Administrador creado exitosamente",
            "admin": {
                "id": nuevo_admin.id,
                "nombre": nuevo_admin.nombre,
                "email": nuevo_admin.email,
                "residencial_id": residencial_id,
                "residencial_nombre": residencial.nombre
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear administrador: {str(e)}"
        )

@router.get("/listar-admins", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_administradores(db: Session = Depends(get_db)):

    admins = db.query(UsuarioModel).filter(
        UsuarioModel.rol == "admin"
    ).all()
    
    resultado = []
    for admin in admins:
        residencial_nombre = "Super Admin" if admin.residencial_id is None else "N/A"
        if admin.residencial_id:
            residencial = db.query(Residencial).filter(Residencial.id == admin.residencial_id).first()
            if residencial:
                residencial_nombre = residencial.nombre
        
        resultado.append({
            "id": admin.id,
            "nombre": admin.nombre,
            "email": admin.email,
            "residencial_id": admin.residencial_id,
            "residencial_nombre": residencial_nombre,
            "fecha_creacion": admin.fecha_creacion
        })
    
    return resultado

@router.get("/usuarios-residencial/{residencial_id}", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_usuarios_residencial(
    residencial_id: int,
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    rol: Optional[str] = Query(None, description="Filtrar por rol (admin, residente, guardia)"),
    db: Session = Depends(get_db)
):
    """Listar todos los usuarios de una residencial específica con filtros opcionales"""
    
    # Verificar que la residencial existe
    residencial = db.query(Residencial).filter(Residencial.id == residencial_id).first()
    if not residencial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Residencial no encontrada"
        )
    
    resultado = []
    
    # Obtener administradores de la residencial
    admins_query = db.query(UsuarioModel).filter(
        UsuarioModel.rol == "admin",
        UsuarioModel.residencial_id == residencial_id
    )
    if nombre:
        admins_query = admins_query.filter(UsuarioModel.nombre.ilike(f"%{nombre}%"))
    
    admins = admins_query.all()
    for admin in admins:
        resultado.append({
            "id": admin.id,
            "nombre": admin.nombre,
            "email": admin.email,
            "rol": "admin",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": admin.fecha_creacion
        })
    
    # Obtener residentes de la residencial
    residentes_query = db.query(Residente).filter(
        Residente.residencial_id == residencial_id
    )
    if nombre:
        residentes_query = residentes_query.filter(Residente.nombre.ilike(f"%{nombre}%"))
    
    residentes = residentes_query.all()
    for residente in residentes:
        resultado.append({
            "id": residente.id,
            "nombre": residente.usuario.nombre,
            "email": residente.usuario.email,
            "rol": "residente",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": residente.usuario.fecha_creacion
        })
    
    # Obtener guardias de la residencial
    guardias_query = db.query(Guardia).filter(
        Guardia.residencial_id == residencial_id
    )
    if nombre:
        guardias_query = guardias_query.filter(Guardia.nombre.ilike(f"%{nombre}%"))
    
    guardias = guardias_query.all()
    for guardia in guardias:
        resultado.append({
            "id": guardia.id,
            "nombre": guardia.usuario.nombre,
            "email": guardia.usuario.email,
            "rol": "guardia",
            "residencial_id": residencial_id,
            "residencial_nombre": residencial.nombre,
            "fecha_creacion": guardia.usuario.fecha_creacion
        })
    
    # Aplicar filtro por rol si se especifica
    if rol:
        resultado = [usuario for usuario in resultado if usuario["rol"] == rol]
    
    # Ordenar por fecha de creación (más recientes primero)
    resultado.sort(key=lambda x: x["fecha_creacion"], reverse=True)
    
    return {
        "residencial": {
            "id": residencial.id,
            "nombre": residencial.nombre,
            "direccion": residencial.direccion
        },
        "usuarios": resultado,
        "total_usuarios": len(resultado)
    }

@router.get("/listar-residenciales", dependencies=[Depends(verify_role(["super_admin"]))])
def listar_residenciales_super_admin(db: Session = Depends(get_db)):
    residenciales = db.query(Residencial).all()
    
    resultado = []
    for residencial in residenciales:
        # Contar administradores de esta residencial
        admins_count = db.query(UsuarioModel).filter(
            UsuarioModel.rol == "admin",
            UsuarioModel.residencial_id == residencial.id
        ).count()
        
        # Contar residentes de esta residencial
        from app.models.residente import Residente
        residentes_count = db.query(Residente).filter(
            Residente.residencial_id == residencial.id
        ).count()
        
        # Contar guardias de esta residencial
        from app.models.guardia import Guardia
        guardias_count = db.query(Guardia).filter(
            Guardia.residencial_id == residencial.id
        ).count()
        
        resultado.append({
            "id": residencial.id,
            "nombre": residencial.nombre,
            "direccion": residencial.direccion,
            "fecha_creacion": residencial.fecha_creacion,
            "estadisticas": {
                "administradores": admins_count,
                "residentes": residentes_count,
                "guardias": guardias_count
            }
        })
    
    return resultado 