from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.residente import Residente
from app.models.notificacion import Notificacion
from app.schemas.notificacion_schema import NotificacionDB
from app.utils.security import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])

@router.get("/residente/ver_notificaciones", response_model=list[NotificacionDB])
def listar_notificaciones_residente(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    # Solo residentes pueden consultar sus notificaciones
    if usuario.rol != "residente":
        raise HTTPException(status_code=403, detail="Solo los residentes pueden ver sus notificaciones")

    residente = db.query(Residente).filter(Residente.usuario_id == usuario.id).first()
    if not residente:
        raise HTTPException(status_code=404, detail="Residente no encontrado")

    notificaciones = db.query(Notificacion).filter(Notificacion.visita.has(residente_id=residente.id)).order_by(Notificacion.fecha_envio.desc()).all()

    return notificaciones