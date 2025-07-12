from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.utils.security import verify_role, get_current_residencial_id
from app.models.usuario import Usuario
from app.schemas.estadisticas_schema import EstadisticasResponse
from app.services.estadisticas_service import obtener_estadisticas_completas

router = APIRouter(prefix="/admin", tags=["Estadísticas"])

@router.get("/estadisticas", response_model=EstadisticasResponse)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(verify_role(["admin"])),
    residencial_id: int = Depends(get_current_residencial_id)
):
    try:
        estadisticas = obtener_estadisticas_completas(db, residencial_id)
        
        return EstadisticasResponse(
            fecha_consulta=datetime.now(timezone.utc),
            **estadisticas
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas: {str(e)}"
        ) 