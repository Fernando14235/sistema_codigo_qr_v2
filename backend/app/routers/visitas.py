from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.schemas.visita_schema import VisitaCreate, VisitaQRResponse, ValidarQRRequest, AccionQR, RegistrarSalidaRequest, VisitaResponse, VisitaUpdate, SolicitudVisitaCreate
from app.models.guardia import Guardia
from app.services.visita_service import crear_visita_con_qr, validar_qr_entrada, registrar_salida_visita, obtener_visitas_residente, editar_visita_residente, eliminar_visita_residente, crear_solicitud_visita_residente, aprobar_solicitud_visita_admin, obtener_solicitudes_pendientes_admin
from app.services.notificacion_service import enviar_notificacion_escaneo, enviar_notificacion_guardia
from app.database import get_db
from app.models import Usuario
from app.models.visita import Visita
from app.models.escaneo_qr import EscaneoQR
from app.utils.security import get_current_user, verify_role
from app.utils.time import extraer_modelo_dispositivo
from app.schemas.auth_schema import TokenData
from app.models.visitante import Visitante
import logging

router = APIRouter(prefix="/visitas", tags=["Visitas"])

def get_username(usuario):
    return usuario.nombre or usuario.email or f"ID {usuario.id}"

@router.post("/residente/crear_visita", response_model=list[VisitaQRResponse], dependencies=[Depends(verify_role(["admin", "residente"]))])
def crear_visita(visita: VisitaCreate, db: Session = Depends(get_db), usuario: TokenData = Depends(get_current_user)):
    if usuario.rol == "admin":
        return crear_visita_con_qr(
            db,
            visita,
            admin_id=usuario.id,
            residente_id=None,
            tipo_creador="admin"
        )
    elif usuario.rol == "residente":
        return crear_visita_con_qr(
            db,
            visita,
            admin_id=None,
            residente_id=usuario.id,
            tipo_creador="residente"
        )
    else:
        raise HTTPException(status_code=403, detail="No autorizado para crear visitas.")


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

@router.get("/residente/mis_visitas", response_model=list[VisitaResponse], dependencies=[Depends(verify_role(["residente", "admin"]))])
def mis_visitas(
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return obtener_visitas_residente(db, usuario.id)

@router.patch("/residente/editar_visita/{visita_id}", response_model=VisitaResponse, dependencies=[Depends(verify_role(["residente", "admin"]))])
def editar_visita(
    visita_id: int,
    visita_update: VisitaUpdate,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    visita = editar_visita_residente(db, visita_id, usuario.id, visita_update, rol=usuario.rol)
    # Obtener visitante para la respuesta
    visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
    return VisitaResponse(
        id=visita.id,
        residente_id=visita.residente_id,
        admin_id=visita.admin_id,
        guardia_id=visita.guardia_id,
        visitante=visitante,
        notas=visita.notas,
        fecha_entrada=visita.fecha_entrada,
        fecha_salida=visita.fecha_salida,
        estado=visita.estado,
        qr_code=visita.qr_code,
        qr_expiracion=visita.qr_expiracion,
        qr_code_img_base64=getattr(visita, "qr_code_img_base64", ""),
        tipo_creador=visita.tipo_creador
    )

@router.delete("/residente/eliminar_visita/{visita_id}", dependencies=[Depends(verify_role(["residente", "admin"]))])
def eliminar_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return eliminar_visita_residente(db, visita_id, usuario.id, rol=usuario.rol)

@router.post("/residente/solicitar_visita", dependencies=[Depends(verify_role(["residente"]))])
def solicitar_visita(
    solicitud: SolicitudVisitaCreate,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return crear_solicitud_visita_residente(db, solicitud, usuario.id)

@router.get("/admin/solicitudes_pendientes", dependencies=[Depends(verify_role(["admin"]))])
def obtener_solicitudes_pendientes(
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return obtener_solicitudes_pendientes_admin(db)

@router.post("/admin/aprobar_solicitud/{visita_id}", response_model=list[VisitaQRResponse], dependencies=[Depends(verify_role(["admin"]))])
def aprobar_solicitud_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    return aprobar_solicitud_visita_admin(db, visita_id, usuario.id)