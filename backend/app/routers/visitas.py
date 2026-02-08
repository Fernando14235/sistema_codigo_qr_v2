from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.visita_schema import VisitaCreate, VisitaQRResponse, ValidarQRRequest, AccionQR, RegistrarSalidaRequest, VisitaResponse, VisitaUpdate, SolicitudVisitaCreate, HistorialEscaneosDiaResponse, HistorialEscaneosTotalesResponse
from app.models.guardia import Guardia
from app.models.residente import Residente
from app.models.admin import Administrador
from app.models.visitante import Visitante
from app.models import Usuario
from app.models.visita import Visita
from app.models.escaneo_qr import EscaneoQR
from app.services.visita_service import crear_visita_con_qr, validar_qr_entrada, registrar_salida_visita, obtener_visitas_residente, editar_visita_residente, eliminar_visita_residente, crear_solicitud_visita_residente, aprobar_solicitud_visita_admin, obtener_solicitudes_pendientes_admin
from app.services.notificacion_service import enviar_notificacion_escaneo, enviar_notificacion_guardia
from app.database import get_db
from app.utils.security import get_current_user, verify_role
from app.utils.time import extraer_modelo_dispositivo
from app.schemas.auth_schema import TokenData
from datetime import datetime, timezone
import logging
import pytz
from app.utils.cloudinary_utils import save_upload_to_temp
from app.services.cloudinary_service import upload_image
import os
from app.schemas.pagination import PaginatedResponse
import math

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
    qr_code: str = Form(..., description="Código QR escaneado"),
    accion: Optional[str] = Form(None, description="Acción a realizar (aprobar/rechazar)"),
    observacion: Optional[str] = Form(None, description="Observación opcional del guardia"),
    imagenes: List[UploadFile] = File(None, description="Imágenes de evidencia (máximo 3)"),
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    # Logging detallado para debugging
    logging.info(f"🔍 INICIO - Validando QR")
    logging.info(f"👤 Usuario: {usuario.id} ({usuario.rol})")
    logging.info(f"📱 QR Code: {qr_code[:20]}..." if len(qr_code) > 20 else f"📱 QR Code: {qr_code}")
    logging.info(f"⚡ Acción: {accion}")
    
    # Validar que el QR no esté vacío
    if not qr_code or not qr_code.strip():
        logging.error("❌ QR Code vacío o inválido")
        return {"valido": False, "error": "Código QR vacío o inválido"}
    
    # Validar enum de accion
    if accion and accion not in ["aprobar", "rechazar"]:
         raise HTTPException(status_code=400, detail="Acción inválida. Debe ser 'aprobar' o 'rechazar'.")

    # Validar cantidad de imágenes
    if imagenes and len(imagenes) > 3:
        raise HTTPException(status_code=400, detail="Se permiten máximo 3 imágenes.")

    # Subir imágenes a Cloudinary
    imagenes_urls = []
    if imagenes:
        try:            
            for img in imagenes:
                # Validar tipo de archivo
                if not img.content_type.startswith("image/"):
                    continue
                
                temp_path = save_upload_to_temp(img)
                try:
                    result = upload_image(temp_path, folder="escaneo_guardia")
                    imagenes_urls.append(result["secure_url"])
                finally:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        except Exception as e:
            logging.error(f"Error subiendo imágenes: {str(e)}")
            # No bloqueamos el flujo si fallan las imágenes, pero lo loggeamos

    # Obtener el guardia actual
    guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
    if not guardia:
        logging.error(f"❌ Guardia no encontrado para usuario_id: {usuario.id}")
        return {"valido": False, "error": "Guardia no encontrado"}

    # Llamar al servicio para validar el QR
    resultado = validar_qr_entrada(db, qr_code, guardia.id, accion, observacion, imagenes_urls)
    
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

    # Obtener el estado actualizado de la visita para confirmar el cambio
    visita_actualizada = db.query(Visita).filter(Visita.id == resultado["visita_id"]).first()

    # Enviar notificación al residente después del escaneo
    try:
        usuario_obj = db.query(Usuario).filter(Usuario.id == usuario.id).first()
        enviar_notificacion_escaneo(db, visita_actualizada, get_username(usuario_obj))
    except Exception as e:
        logging.error(f"Error al enviar notificación tras escaneo QR: {e}")
        
    return {
        "valido": True,
        "visitante": resultado["visitante"],
        "estado": visita_actualizada.estado,
        "visita_id": resultado["visita_id"],
        "accion_aplicada": accion,
        "observacion_entrada": getattr(visita_actualizada, "observacion_entrada", None),
        "imagenes": imagenes_urls,
        "guardia": {
            "id": guardia.id,
            "nombre": guardia.usuario.nombre if guardia.usuario else f"Guardia {guardia.id}",
            "rol": usuario.rol
        }
    }

@router.post("/guardia/registrar_salida", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def registrar_salida(
    raw_request: Request,
    qr_code: str = Form(..., description="Código QR escaneado"),
    observacion: Optional[str] = Form(None, description="Observación opcional de salida"),
    imagenes: List[UploadFile] = File(None, description="Imágenes de evidencia (máximo 3)"),
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    # Validar cantidad de imágenes
    if imagenes and len(imagenes) > 3:
        raise HTTPException(status_code=400, detail="Se permiten máximo 3 imágenes.")

    # Subir imágenes a Cloudinary
    imagenes_urls = []
    if imagenes:
        try:
            for img in imagenes:
                if not img.content_type.startswith("image/"):
                    continue
                
                temp_path = save_upload_to_temp(img)
                try:
                    result = upload_image(temp_path, folder="escaneo_guardia")
                    imagenes_urls.append(result["secure_url"])
                finally:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        except Exception as e:
            logging.error(f"Error subiendo imágenes de salida: {str(e)}")

    # Obtener el guardia actual
    guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
    if not guardia:
        raise HTTPException(status_code=404, detail="Guardia no encontrado")
    
    # Llamar al servicio para registrar la salida
    resultado = registrar_salida_visita(db, qr_code, guardia.id, observacion, imagenes_urls)
    
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
        "observacion_salida": resultado.get("observacion_salida"),
        "imagenes": resultado.get("imagenes", []),
        "guardia": {
            "id": guardia.id,
            "nombre": guardia.usuario.nombre if guardia.usuario else usuario_obj.nombre,
            "rol": usuario.rol
        }
    }

@router.get("/residente/mis_visitas", response_model=PaginatedResponse[VisitaResponse], dependencies=[Depends(verify_role(["residente", "admin"]))])
def mis_visitas(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1),
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    result = obtener_visitas_residente(db, usuario.id, page, limit)
    
    total = result["total"]
    total_pages = math.ceil(total / limit)
    
    return PaginatedResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        data=result["data"]
    )

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

@router.get("/debug/visita/{visita_id}", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def debug_visita_estado(
    visita_id: int,
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user)
):
    """Endpoint para debuggear el estado de una visita específica"""
    visita = db.query(Visita).filter(Visita.id == visita_id).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    return {
        "visita_id": visita.id,
        "estado": visita.estado,
        "qr_code": visita.qr_code[:20] + "..." if visita.qr_code else None,
        "guardia_id": visita.guardia_id,
        "fecha_entrada": visita.fecha_entrada,
        "qr_expiracion": visita.qr_expiracion,
        "tipo_creador": visita.tipo_creador
    }

@router.post("/debug/test-qr-payload", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def test_qr_payload(
    request: ValidarQRRequest,
    usuario: TokenData = Depends(get_current_user)
):
    """Endpoint para probar que el payload del QR llegue correctamente"""
    return {
        "received_data": {
            "qr_code": request.qr_code,
            "qr_code_length": len(request.qr_code) if request.qr_code else 0,
            "qr_code_type": type(request.qr_code).__name__,
            "accion": request.accion,
            "accion_value": request.accion.value if request.accion else None,
        },
        "usuario": {
            "id": usuario.id,
            "rol": usuario.rol
        },
        "validation_status": "OK - Datos recibidos correctamente"
    }

@router.get("/admin/escaneos-guardia", dependencies=[Depends(verify_role(["admin"]))])
def obtener_escaneos_guardia_admin(
    db: Session = Depends(get_db),
    usuario: TokenData = Depends(get_current_user),
    guardia_id: int = None,
    fecha_inicio: str = None,
    fecha_fin: str = None,
    limit: int = 50
):
    """Endpoint para que los administradores vean los escaneos realizados por guardias"""
    try:
        # Verificar que el usuario es admin
        admin = db.query(Administrador).filter(Administrador.usuario_id == usuario.id).first()
        if not admin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden acceder a esta información")
        
        # Construir consulta base
        query = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            Usuario.nombre.label('nombre_guardia')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            Usuario, Guardia.usuario_id == Usuario.id
        )
        
        # Filtrar por residencial del admin
        if admin.residencial_id:
            query = query.filter(Guardia.residencial_id == admin.residencial_id)
        
        # Filtrar por guardia específico si se proporciona
        if guardia_id:
            query = query.filter(EscaneoQR.guardia_id == guardia_id)
        
        # Filtrar por fechas si se proporcionan
        if fecha_inicio:
            try:
                fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
                query = query.filter(EscaneoQR.fecha_escaneo >= fecha_inicio_dt)
            except ValueError:
                pass
                
        if fecha_fin:
            try:
                fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
                query = query.filter(EscaneoQR.fecha_escaneo <= fecha_fin_dt)
            except ValueError:
                pass
        
        # Ejecutar consulta con límite
        resultados = query.order_by(EscaneoQR.fecha_escaneo.desc()).limit(limit).all()
        
        # Procesar resultados
        escaneos = []
        for escaneo, visita, visitante, guardia, nombre_guardia in resultados:
            # Determinar tipo de escaneo
            tipo_escaneo = "salida" if visita.fecha_salida and escaneo.fecha_escaneo >= visita.fecha_salida else "entrada"
            
            # Obtener información del residente
            residente_info = {"nombre": "N/A", "unidad": "N/A"}
            if visita.residente_id:
                residente = db.query(Residente).join(Usuario).filter(Residente.id == visita.residente_id).first()
                if residente:
                    residente_info = {
                        "nombre": residente.usuario.nombre,
                        "unidad": residente.unidad_residencial
                    }
            
            escaneos.append({
                "id_escaneo": escaneo.id,
                "fecha_escaneo": escaneo.fecha_escaneo,
                "dispositivo": escaneo.dispositivo or "No especificado",
                "guardia": {
                    "id": guardia.id,
                    "nombre": nombre_guardia,
                    "usuario_id": guardia.usuario_id
                },
                "visitante": {
                    "nombre": visitante.nombre_conductor,
                    "dni": visitante.dni_conductor,
                    "telefono": visitante.telefono,
                    "vehiculo": f"{visitante.tipo_vehiculo} - {visitante.placa_vehiculo}",
                    "motivo": visitante.motivo_visita
                },
                "residente": residente_info,
                "visita": {
                    "id": visita.id,
                    "estado": visita.estado,
                    "fecha_entrada": visita.fecha_entrada,
                    "fecha_salida": visita.fecha_salida
                },
                "tipo_escaneo": tipo_escaneo
            })
        
        return {
            "escaneos": escaneos,
            "total": len(escaneos),
            "filtros_aplicados": {
                "guardia_id": guardia_id,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
                "limit": limit
            }
        }
        
    except Exception as e:
        print(f"Error al obtener escaneos de guardia: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener escaneos: {str(e)}"
        )


@router.get("/guardia/visitas-del-dia", dependencies=[Depends(verify_role(["admin", "guardia"]))])
def obtener_visitas_del_dia(
    fecha: Optional[str] = Query(None, description="Fecha en formato YYYY-MM-DD (por defecto hoy)"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: pendiente, aceptado, rechazado, completado"),
    busqueda: Optional[str] = Query(None, description="Buscar por nombre de visitante o placa"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Obtiene todas las visitas del día para el guardia.
    
    - **fecha**: Fecha específica (YYYY-MM-DD), por defecto hoy
    - **estado**: Filtrar por estado de la visita
    - **busqueda**: Buscar por nombre de visitante o placa de vehículo
    
    Retorna lista de visitas con información completa del visitante y residente.
    """
    from app.utils.time import get_honduras_time
    from datetime import date, timedelta
    
    try:
        # Obtener el guardia actual
        guardia = None
        residencial_id = None
        
        if usuario.rol == "guardia":
            guardia = db.query(Guardia).filter(Guardia.usuario_id == usuario.id).first()
            if not guardia:
                raise HTTPException(status_code=404, detail="Guardia no encontrado")
            residencial_id = guardia.residencial_id
        elif usuario.rol == "admin":
            admin = db.query(Administrador).filter(Administrador.usuario_id == usuario.id).first()
            if admin:
                residencial_id = admin.residencial_id
        
        # Determinar la fecha a consultar
        if fecha:
            try:
                # Si viene una fecha, asumimos que es en la zona horaria de Honduras
                honduras_tz = pytz.timezone('America/Tegucigalpa')
                fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
                fecha_inicio = honduras_tz.localize(datetime.combine(fecha_dt.date(), datetime.min.time()))
                fecha_fin = honduras_tz.localize(datetime.combine(fecha_dt.date(), datetime.max.time()))
                fecha_consulta = fecha_dt.date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")
        else:
            ahora_honduras = get_honduras_time()
            fecha_consulta = ahora_honduras.date()
            fecha_inicio = ahora_honduras.replace(hour=0, minute=0, second=0, microsecond=0)
            fecha_fin = ahora_honduras.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Query base
        query = db.query(Visita).join(Visitante).filter(
            Visita.fecha_entrada >= fecha_inicio,
            Visita.fecha_entrada <= fecha_fin
        )
        
        # Filtrar por residencial si es guardia
        if residencial_id:
            # Filtrar visitas del residencial del guardia
            query = query.outerjoin(Residente, Visita.residente_id == Residente.id)
            query = query.outerjoin(Administrador, Visita.admin_id == Administrador.id)
            query = query.filter(
                (Residente.residencial_id == residencial_id) | 
                (Administrador.residencial_id == residencial_id)
            )
        
        # Filtrar por estado si se especifica
        if estado:
            if estado not in ['pendiente', 'aceptado', 'rechazado', 'completado']:
                raise HTTPException(status_code=400, detail="Estado inválido")
            query = query.filter(Visita.estado == estado)
        
        # Filtrar por búsqueda (nombre o placa)
        if busqueda:
            busqueda_lower = f"%{busqueda.lower()}%"
            query = query.filter(
                (Visitante.nombre_conductor.ilike(busqueda_lower)) |
                (Visitante.placa_vehiculo.ilike(busqueda_lower))
            )
        
        # Ordenar por fecha de entrada (más recientes primero)
        visitas = query.order_by(Visita.fecha_entrada.desc()).all()
        
        # Formatear respuesta
        resultado = []
        for visita in visitas:
            # Obtener visitante
            visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
            
            # Obtener información del creador
            creador_info = {
                "tipo": "desconocido",
                "nombre": "N/A",
                "email": "N/A",
                "telefono": "N/A",
                "unidad_residencial": "N/A"
            }
            
            if visita.tipo_creador == "admin" and visita.admin_id:
                admin = db.query(Administrador).join(Usuario).filter(Administrador.id == visita.admin_id).first()
                if admin and admin.usuario:
                    creador_info = {
                        "tipo": "admin",
                        "nombre": admin.usuario.nombre or "Admin sin nombre",
                        "email": admin.usuario.email or "N/A",
                        "telefono": admin.telefono or "N/A",
                        "unidad_residencial": admin.unidad_residencial or "N/A"
                    }
            elif visita.tipo_creador == "residente" and visita.residente_id:
                residente = db.query(Residente).join(Usuario).filter(Residente.id == visita.residente_id).first()
                if residente and residente.usuario:
                    creador_info = {
                        "tipo": "residente",
                        "nombre": residente.usuario.nombre or "Residente sin nombre",
                        "email": residente.usuario.email or "N/A",
                        "telefono": residente.telefono or "N/A",
                        "unidad_residencial": residente.unidad_residencial or "N/A"
                    }
            
            # Obtener imágenes si existen
            from app.models.visita_imagen import VisitaImagen
            imagenes_db = db.query(VisitaImagen).filter(VisitaImagen.visita_id == visita.id).all()
            imagenes = [{"imagen_url": img.url} for img in imagenes_db] if imagenes_db else []
            
            # Determinar indicador visual según estado
            indicador = "🟢"  # Verde por defecto
            if visita.estado == "pendiente":
                indicador = "🟡"  # Amarillo
            elif visita.estado == "rechazado":
                indicador = "🔴"  # Rojo
            elif visita.estado == "completado":
                indicador = "⚫"  # Gris
            elif visita.qr_expiracion and visita.qr_expiracion < get_honduras_time():
                indicador = "🔴"  # Rojo si expiró
            
            resultado.append({
                "id": visita.id,
                "fecha_entrada": visita.fecha_entrada,
                "hora_entrada": visita.fecha_entrada.strftime("%H:%M"),
                "estado": visita.estado,
                "indicador": indicador,
                "notas": visita.notas,
                "qr_expiracion": visita.qr_expiracion,
                "fecha_salida": visita.fecha_salida,
                "visitante": {
                    "nombre_conductor": visitante.nombre_conductor,
                    "dni_conductor": visitante.dni_conductor,
                    "telefono": visitante.telefono,
                    "tipo_vehiculo": visitante.tipo_vehiculo,
                    "marca_vehiculo": visitante.marca_vehiculo or "N/A",
                    "color_vehiculo": visitante.color_vehiculo or "N/A",
                    "placa_vehiculo": visitante.placa_vehiculo or "N/A",
                    "motivo": visitante.motivo_visita
                },
                "destino_visita": visitante.destino_visita or "N/A",
                "creador": creador_info,
                "imagenes": imagenes
            })
        
        return {
            "fecha": fecha_consulta.isoformat(),
            "total": len(resultado),
            "visitas": resultado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error obteniendo visitas del día: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener visitas del día: {str(e)}"
        )
