from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import verify_role
from app.models.residencial import Residencial
from app.schemas.residencial_schema import ResidencialUpdate
from app.models.usuario import Usuario
from app.services.estadisticas_service import obtener_estadisticas_completas

router = APIRouter(prefix="/entidades", tags=["Super Admin - Entidades"])

@router.put("/{id}", dependencies=[Depends(verify_role(["super_admin"]))])
def update_residencial(id: int, residencial_update: ResidencialUpdate, db: Session = Depends(get_db)):
    """Actualizar datos básicos de una residencial"""
    residencial = db.query(Residencial).filter(Residencial.id == id).first()
    if not residencial:
        raise HTTPException(status_code=404, detail="Residencial no encontrada")
    
    for key, value in residencial_update.dict(exclude_unset=True).items():
        setattr(residencial, key, value)
    
    db.commit()
    db.refresh(residencial)
    return residencial

@router.patch("/{id}/estatus", dependencies=[Depends(verify_role(["super_admin"]))])
def toggle_residencial_status(id: int, activa: bool, db: Session = Depends(get_db)):
    """Activar o suspender una residencial"""
    residencial = db.query(Residencial).filter(Residencial.id == id).first()
    if not residencial:
        raise HTTPException(status_code=404, detail="Residencial no encontrada")
    
    residencial.activa = activa
    db.commit()
    return {"message": f"Residencial {'activada' if activa else 'suspendida'} exitosamente", "activa": activa}

@router.delete("/{id}", dependencies=[Depends(verify_role(["super_admin"]))])
def delete_residencial(id: int, db: Session = Depends(get_db)):
    """Eliminar residencial (solo si no tiene datos críticos activos)"""
    residencial = db.query(Residencial).filter(Residencial.id == id).first()
    if not residencial:
        raise HTTPException(status_code=404, detail="Residencial no encontrada")
    
    # Validar si tiene visitas activas
    # TODO: Implementar validación lógica más compleja si es necesario
    # Por ahora confiamos en foreign keys o verificamos conteos
    
    try:
        db.delete(residencial)
        db.commit()
        return {"message": "Residencial eliminada exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar la residencial porque tiene datos asociados. Considere suspenderla en su lugar.")

@router.get("/{id}/estadisticas", dependencies=[Depends(verify_role(["super_admin"]))])
def get_residencial_stats(id: int, db: Session = Depends(get_db)):
    """Obtener estadísticas detalladas de una residencial específica"""
    try:
        stats = obtener_estadisticas_completas(db, id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")
