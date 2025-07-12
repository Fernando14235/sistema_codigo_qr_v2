from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.utils.security import verify_role, get_current_user, is_super_admin
from app.services.residencial_service import (
    crear_residencial,
    obtener_residencial,
    listar_residenciales,
    actualizar_residencial,
    eliminar_residencial
)
from app.schemas.residencial_schema import (
    ResidencialCreate,
    ResidencialUpdate,
    ResidencialResponse,
    ResidencialListResponse
)

router = APIRouter(prefix="/residenciales", tags=["Residenciales"])

@router.post("/", response_model=ResidencialResponse, dependencies=[Depends(is_super_admin)])
def crear_nueva_residencial(
    residencial: ResidencialCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva residencial (solo super administradores)"""
    return crear_residencial(db, residencial)

@router.get("/", response_model=List[ResidencialListResponse])
def obtener_residenciales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener lista de residenciales según el rol del usuario"""
    # Super admin puede ver todas las residenciales
    if current_user.rol == "super_admin":
        return listar_residenciales(db, skip=skip, limit=limit)
    
    # Admin solo puede ver su residencial específica
    elif current_user.rol == "admin":
        if not current_user.residencial_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes una residencial asignada"
            )
        # Obtener solo la residencial del admin
        residencial = obtener_residencial(db, current_user.residencial_id)
        return [residencial]
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver residenciales"
        )

@router.get("/{residencial_id}", response_model=ResidencialResponse)
def obtener_residencial_por_id(
    residencial_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener una residencial específica por ID"""
    # Super admin puede ver cualquier residencial
    if current_user.rol == "super_admin":
        return obtener_residencial(db, residencial_id)
    
    # Admin solo puede ver su residencial específica
    elif current_user.rol == "admin":
        if not current_user.residencial_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes una residencial asignada"
            )
        if current_user.residencial_id != residencial_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes ver tu residencial asignada"
            )
        return obtener_residencial(db, residencial_id)
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver residenciales"
        )

@router.put("/{residencial_id}", response_model=ResidencialResponse)
def actualizar_residencial_por_id(
    residencial_id: int,
    residencial: ResidencialUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar una residencial específica"""
    # Super admin puede actualizar cualquier residencial
    if current_user.rol == "super_admin":
        return actualizar_residencial(db, residencial_id, residencial)
    
    # Admin solo puede actualizar su residencial específica
    elif current_user.rol == "admin":
        if not current_user.residencial_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes una residencial asignada"
            )
        if current_user.residencial_id != residencial_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes actualizar tu residencial asignada"
            )
        return actualizar_residencial(db, residencial_id, residencial)
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar residenciales"
        )

@router.delete("/{residencial_id}")
def eliminar_residencial_por_id(
    residencial_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar una residencial específica (solo super administradores)"""
    if current_user.rol != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super administradores pueden eliminar residenciales"
        )
    
    eliminar_residencial(db, residencial_id)
    return {"message": "Residencial eliminada exitosamente"} 