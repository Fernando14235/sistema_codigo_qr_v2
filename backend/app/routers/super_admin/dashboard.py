from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.utils.security import verify_role
from app.models.usuario import Usuario, Rol
from app.models.residencial import Residencial
from app.models.visita import Visita
from app.models.ticket import Ticket
from datetime import datetime
from app.utils.time import get_current_time

router = APIRouter(prefix="/dashboard-global", tags=["Super Admin - Dashboard"])

@router.get("/", dependencies=[Depends(verify_role(["super_admin"]))])
def get_global_dashboard(db: Session = Depends(get_db)):
    """
    Obtener métricas globales del sistema para el dashboard de super admin.
    """
    try:
        # 1. Total de entidades activas vs inactivas
        entidades_stats = db.query(
            func.count(Residencial.id).label("total"),
            func.sum(case((Residencial.activa == True, 1), else_=0)).label("activas"),
            func.sum(case((Residencial.activa == False, 1), else_=0)).label("inactivas")
        ).first()

        if not entidades_stats or entidades_stats.total is None:
            entidades_data = {"total": 0, "activas": 0, "inactivas": 0}
        else:
            entidades_data = {
                "total": entidades_stats.total,
                "activas": token_stats(entidades_stats.activas),
                "inactivas": token_stats(entidades_stats.inactivas)
            }

        # 2. Total de usuarios por rol (admins, residentes, guardias)
        usuarios_stats = db.query(
            Usuario.rol,
            func.count(Usuario.id).label("count")
        ).group_by(Usuario.rol).all()
        
        # Asegurar que todos los roles clave existan en el dict, incluso con 0
        usuarios_dict = {r.value: 0 for r in Rol}
        for rol, count in usuarios_stats:
            if rol in usuarios_dict:
                usuarios_dict[rol] = count
            else:
                usuarios_dict[rol] = count

        # 3. Visitas activas en este momento (todas las entidades)
        now = get_current_time()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        visitas_activas = db.query(Visita).filter(
            Visita.estado.in_(['aprobado', 'pendiente']),
            Visita.fecha_entrada >= start_of_day,
            Visita.fecha_entrada <= end_of_day
        ).count()

        # 4. Tickets sin resolver globales
        tickets_pendientes = db.query(Ticket).filter(
            Ticket.estado.notin_(['resuelto', 'cerrado'])
        ).count()

        return {
            "entidades": entidades_data,
            "usuarios": {
                "total": sum(usuarios_dict.values()),
                "por_rol": usuarios_dict
            },
            "visitas_activas_hoy": visitas_activas,
            "tickets_pendientes": tickets_pendientes,
            "fecha_consulta": now
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener métricas del dashboard: {str(e)}"
        )

def token_stats(val):
    return val if val is not None else 0
