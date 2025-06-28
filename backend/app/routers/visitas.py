from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.schemas.visita_schema import VisitaCreate, VisitaQRResponse, ValidarQRRequest, AccionQR, RegistrarSalidaRequest, VisitaResponse
from app.models.guardia import Guardia
from app.services.visita_service import crear_visita_con_qr, validar_qr_entrada, registrar_salida_visita, obtener_visitas_residente
from app.services.notificacion_service import enviar_notificacion_escaneo, enviar_notificacion_guardia
from app.database import get_db
from app.models import Usuario
from app.models.visita import Visita
from app.models.escaneo_qr import EscaneoQR
from app.utils.security import get_current_user, verify_role
from app.utils.time import extraer_modelo_dispositivo
from app.schemas.auth_schema import TokenData
import logging

router = APIRouter(prefix="/visitas", tags=["Visitas"])

def get_username(usuario):
    return usuario.nombre or usuario.email or f"ID {usuario.id}"

@router.post("/residente/crear_visita", response_model=list[VisitaQRResponse], dependencies=[Depends(verify_role(["admin", "residente"]))])
def crear_visita(visita: VisitaCreate, db: Session = Depends(get_db), usuario: TokenData = Depends(get_current_user)):
    return crear_visita_con_qr(db, visita, usuario_id=usuario.id)


@router.post("/guardia/validar_qr", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def validar_qr(
    raw_request: Request,
    request: ValidarQRRequest,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    # Obtener el guardia actual
    guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
    if not guardia:
        return {"valido": False, "error": "Guardia no encontrado"}

    # Llamar al servicio para validar el QR
    accion = request.accion.value if request.accion else None
    resultado = validar_qr_entrada(db, request.qr_code, guardia.id, accion)
    
    if not resultado["valido"]:
        return resultado

    # Registrar el escaneo QR
    user_agent_str = raw_request.headers.get("user-agent", "desconocido")
    modelo_dispositivo = extraer_modelo_dispositivo(user_agent_str)

    escaneo_qr = EscaneoQR(
        visita_id=resultado["visita_id"],
        guardia_id=guardia.id,
        dispositivo=modelo_dispositivo
    )
    db.add(escaneo_qr)
    db.commit()

    # Enviar notificación al residente después del escaneo
    try:
        usuario_obj = db.query(Usuario).filter(Usuario.id == usuario.id).first()
        visita = db.query(Visita).filter(Visita.id == resultado["visita_id"]).first()
        enviar_notificacion_escaneo(db, visita, get_username(usuario_obj))
    except Exception as e:
        logging.error(f"Error al enviar notificación tras escaneo QR: {e}")
        
    return {
        "valido": True,
        "visitante": resultado["visitante"],
        "estado": resultado["estado"],
        "guardia": {
            "id": guardia.id,
            "nombre": guardia.usuario.nombre if guardia else usuario_obj.nombre,
            "rol": usuario.rol
        }
    }

@router.post("/guardia/registrar_salida", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def registrar_salida(
    raw_request: Request,
    request: RegistrarSalidaRequest,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    # Obtener el guardia actual
    guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
    if not guardia:
        raise HTTPException(status_code=404, detail="Guardia no encontrado")
    
    # Llamar al servicio para registrar la salida
    resultado = registrar_salida_visita(db, request.qr_code, guardia.id)
    
    # Registrar el escaneo de salida
    user_agent_str = raw_request.headers.get("user-agent", "desconocido")
    modelo_dispositivo = extraer_modelo_dispositivo(user_agent_str)
    
    escaneo_salida = EscaneoQR(
        visita_id=resultado["visita_id"],
        guardia_id=guardia.id,
        dispositivo=modelo_dispositivo
    )
    db.add(escaneo_salida)
    db.commit()
    
    # Enviar notificación al residente sobre la salida
    try:
        usuario_obj = db.query(Usuario).filter(Usuario.id == usuario.id).first()
        visita = db.query(Visita).filter(Visita.id == resultado["visita_id"]).first()
        enviar_notificacion_escaneo(db, visita, get_username(usuario_obj), es_salida=True)
    except Exception as e:
        logging.error(f"Error al enviar notificación de salida: {e}")
    
    return {
        "mensaje": resultado["mensaje"],
        "fecha_salida": resultado["fecha_salida"],
        "estado": resultado["estado"],
        "visitante": resultado["visitante"],
        "guardia": {
            "id": guardia.id,
            "nombre": guardia.usuario.nombre if guardia else usuario_obj.nombre,
            "rol": usuario.rol
        }
    }

@router.get("/residente/mis_visitas", response_model=list[VisitaResponse], dependencies=[Depends(verify_role(["residente"]))])
def mis_visitas(
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return obtener_visitas_residente(db, usuario.id)