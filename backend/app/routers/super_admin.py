from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.utils.security import is_super_admin
from app.services.user_service import crear_usuario
from app.schemas.usuario_schema import UsuarioCreate, Usuario
from app.models.usuario import Usuario as UsuarioModel
from app.models.residencial import Residencial
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