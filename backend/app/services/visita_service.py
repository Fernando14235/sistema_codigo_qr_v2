from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.escaneo_qr import EscaneoQR
from app.models.guardia import Guardia
from app.models.usuario import Usuario
from app.models.visita import Visita
from app.models.visitante import Visitante
from app.models.residente import Residente
from app.services.notificacion_service import enviar_notificacion_residente, enviar_notificacion_guardia, enviar_notificacion_visita_actualizada
from app.schemas.visita_schema import VisitaCreate, VisitaQRResponse, VisitaUpdate
from app.schemas.visitante_schema import VisitanteCreate, VisitanteResponse
from app.utils.qr import validar_payload_qr, generar_payload_qr, generar_qr_completo, generar_imagen_qr_personalizada
from app.utils.validators import validar_dni_visita_unico
from datetime import datetime, timedelta, timezone
import traceback
from app.utils.time import get_honduras_time

def to_utc(dt: datetime) -> datetime:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

# Creacion de visita y visitante, generacion codigo QR con validacion de fecha y hora 
def crear_visita_con_qr(db: Session, visita_data: VisitaCreate, admin_id: int = None, residente_id: int = None, tipo_creador: str = None, guardia_id: int = None) -> list[VisitaQRResponse]:
    try:
        # Validación de tipo_creador y asignación de ids
        if tipo_creador == "admin":
            if not admin_id or residente_id:
                raise HTTPException(status_code=400, detail="Si el creador es admin, debe proporcionar admin_id y residente_id debe ser NULL.")
        elif tipo_creador == "residente":
            if not residente_id or admin_id:
                raise HTTPException(status_code=400, detail="Si el creador es residente, debe proporcionar residente_id y admin_id debe ser NULL.")
        else:
            raise HTTPException(status_code=400, detail="Tipo de creador inválido.")

        # Buscar el objeto correspondiente
        admin = None
        residente = None
        if tipo_creador == "admin":
            from app.models.admin import Administrador
            admin = db.query(Administrador).filter(Administrador.usuario_id == admin_id).first()
            if not admin:
                raise HTTPException(status_code=404, detail="Administrador no encontrado")
        elif tipo_creador == "residente":
            from app.models.residente import Residente
            residente = db.query(Residente).filter(Residente.usuario_id == residente_id).first()
            if not residente:
                raise HTTPException(status_code=404, detail="Residente no encontrado")

        acompanantes = getattr(visita_data, "acompanantes", None)
        if acompanantes is not None:
            if not isinstance(acompanantes, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El campo 'acompañantes' debe ser una lista de nombres o no enviarse."
                )
            for nombre in acompanantes:
                if not isinstance(nombre, str) or not nombre.strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Todos los acompañantes deben ser nombres válidos."
                    )
                    
        # 2. Asegurar que esté en zona horaria de Honduras
        fecha_entrada = visita_data.fecha_entrada or get_honduras_time()
        if fecha_entrada.tzinfo is None:
            fecha_entrada = get_honduras_time().tzinfo.localize(fecha_entrada)
        else:
            fecha_entrada = fecha_entrada.astimezone(get_honduras_time().tzinfo)
        if fecha_entrada < get_honduras_time():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede crear una visita con fecha/hora pasada"
            )
        
        visitas = []
        visitas_respuestas = []
        
        for visitante_data in visita_data.visitantes:
            visitante_dict = visitante_data.dict()
            visitante = Visitante(**visitante_dict)
            db.add(visitante)
            db.flush()

            expiracion = fecha_entrada + timedelta(days=1)

            visita = Visita(
                admin_id=admin.id if admin else None,
                residente_id=residente.id if residente else None,
                visitante_id=visitante.id,
                notas=visita_data.notas,
                fecha_entrada=fecha_entrada,
                qr_expiracion=expiracion,
                qr_code="TEMPORAL",
                tipo_creador=tipo_creador,
                estado="pendiente"
            )
            db.add(visita)
            db.flush()
            
            # Actualizar el QR con el id real de la visita (opcional, pero aquí lo dejamos igual para todos)
            qr_code, qr_img_b64 = generar_qr_completo(visita.id, minutos_validez=1440)
            visita.qr_code = qr_code
            
            # Generar QR personalizado con información del residente y visitante
            qr_img_personalizado = generar_imagen_qr_personalizada(
                qr_data=qr_code,
                nombre_residente=residente.usuario.nombre if residente else admin.usuario.nombre,
                nombre_visitante=visitante.nombre_conductor,
                nombre_residencial="Residencial Access",  # Puedes hacer esto configurable
                unidad_residencial=residente.unidad_residencial if residente else "-",
                fecha_creacion=datetime.now(timezone.utc),
                fecha_expiracion=expiracion
            )
                        
            visitas_respuestas.append(
                VisitaQRResponse(
                    id=visita.id,
                    residente_id=visita.residente_id,
                    admin_id=visita.admin_id,
                    visitante=visitante,
                    estado=visita.estado,
                    qr_expiracion=expiracion,
                    qr_code=visita.qr_code,
                    qr_code_img_base64=qr_img_personalizado,
                    fecha_entrada=visita.fecha_entrada,
                    notas=visita.notas,
                    tipo_creador=tipo_creador,
                    fecha_salida=visita.fecha_salida,
                    guardia_id=visita.guardia_id
                )
            )
            visitas.append(visita)
        
        # Solo enviar la notificación una vez, después del ciclo
        try:
            enviar_notificacion_residente(
                db, 
                visitas[0], 
                visitas_respuestas[0].qr_code_img_base64,
                acompanantes=acompanantes  # pásalos aquí
            )
            # Llamar también a la notificación para guardias
            enviar_notificacion_guardia(db, visitas[0])
        except Exception as e:
            print(f"Error al enviar notificación: {str(e)}")
        
        for visita in visitas:
            db.refresh(visita)
        db.commit()
        return visitas_respuestas
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al crear la visita: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la visita: {str(e)}"
        )

def validar_qr_visita(db: Session, qr_code: str, guardia_id: int) -> dict:
    try:
        # 1. Validacion del codigo QR
        _, error = validar_payload_qr(qr_code)
        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Código QR no identificado, no puede pasar!"
            )
            
        now_utc = datetime.now(timezone.utc)
        
        # 2. Busqueda de la visita
        visitas = db.query(Visita).filter(Visita.qr_code == qr_code).all()
        if not visitas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Codigo QR no identificado, no puede pasar!"
            )
            
        # 3. Validar expiración
        visitantes_aprobados = []
        for visita in visitas:
            if visita.qr_expiracion < now_utc:
                visita.estado = "expirado"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El QR ha expirado"
                )
            if visita.fecha_entrada > now_utc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Aún no es la hora de entrada programada para esta visita"
                )
            # Aprobamos esta visita
            visita.estado = "aprobado"
            visita.guardia_id = guardia_id
            visitantes_aprobados.append({
                "nombre_conductor": visita.visitante.nombre_conductor,
                "dni_conductor": visita.visitante.dni_conductor,
                "telefono": visita.visitante.telefono,
                "tipo_vehiculo": visita.visitante.tipo_vehiculo,
                "placa_vehiculo": visita.visitante.placa_vehiculo,
                "motivo_visita": visita.visitante.motivo_visita
            })
        db.commit()

        if not visitantes_aprobados:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ningún visitante fue aprobado. El QR puede estar expirado o aún no es válido."
            )

        return {
            "valido": True,
            "visitantes": visitantes_aprobados,
            "estado": visita.estado
        }

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al validar QR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar QR: {str(e)}"
        )

def validar_qr_entrada(db: Session, qr_code: str, guardia_id: int, accion: str = None) -> dict:
    try:
        # Buscar la visita con el QR proporcionado
        visitas = db.query(Visita).filter(Visita.qr_code == qr_code).all()
        if not visitas:
            return {"valido": False, "error": "Código QR no identificado, no puede pasar!"}

        # Busca todas las visitas con ese QR
        visita = next((v for v in visitas if v.estado == "pendiente"), None)
        if not visita:
            return {"valido": False, "error": "No hay visitantes pendientes para este QR."}

        now_hn = get_honduras_time()

        # Validar expiración en zona Honduras
        if visita.qr_expiracion:
            if now_hn > visita.qr_expiracion:
                visita.estado = "expirado"
                db.commit()
                return {"valido": False, "error": "El QR ha expirado"}

        # Validar hora de entrada en zona Honduras
        if visita.fecha_entrada:
            if now_hn < visita.fecha_entrada:
                return {
                    "valido": False,
                    "error": "Aún no es la hora de entrada programada para esta visita"
                }
        
        # Aplicar acción si se especifica
        if accion == "aprobar":
            visita.estado = "aprobado"
        elif accion == "rechazar":
            visita.estado = "rechazado"
        elif accion is not None:
            raise HTTPException(status_code=400, detail="Acción inválida.")
        
        # Asignar guardia a la visita
        visita.guardia_id = guardia_id
        
        # Obtener información del visitante para la respuesta
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        db.commit()
        
        return {
            "valido": True,
            "visitante": {
                "nombre_conductor": visitante.nombre_conductor,
                "dni_conductor": visitante.dni_conductor,
                "telefono": visitante.telefono,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita
            },
            "estado": visita.estado,
            "visita_id": visita.id
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al validar QR de entrada: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar QR de entrada: {str(e)}"
        )

def registrar_salida_visita(db: Session, qr_code: str, guardia_id: int) -> dict:
    try:
        # Buscar la visita con el QR proporcionado
        visita = db.query(Visita).filter(Visita.qr_code == qr_code).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Código QR no encontrado")
        
        # Validar que la visita esté en estado "aprobado"
        if visita.estado != "aprobado":
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede registrar la salida. La visita está en estado '{visita.estado}'. Solo se permite registrar salida para visitas aprobadas."
            )
        
        # Registrar la fecha de salida en UTC
        now_utc = datetime.now(timezone.utc)
        visita.fecha_salida = now_utc
        visita.estado = "completado"
        
        # Obtener información del visitante para la respuesta
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        db.commit()
        
        return {
            "mensaje": "Salida registrada exitosamente",
            "fecha_salida": now_utc,
            "estado": visita.estado,
            "visitante": {
                "nombre_conductor": visitante.nombre_conductor,
                "dni_conductor": visitante.dni_conductor,
                "telefono": visitante.telefono,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita
            },
            "visita_id": visita.id
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al registrar salida: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al registrar la salida: {str(e)}"
        )

def obtener_historial_escaneos_dia(db: Session, guardia_id: int = None) -> dict:
    try:
        from app.models.escaneo_qr import EscaneoQR
        from app.models.guardia import Guardia
        from app.models.residente import Residente
        from app.models.usuario import Usuario
        
        # Obtener fecha actual en UTC
        now_utc = datetime.now(timezone.utc)
        fecha_inicio = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_fin = now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Construir consulta base
        query = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Residente,
            Usuario,
            Guardia
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Residente, Visita.residente_id == Residente.id
        ).join(
            Usuario, Residente.usuario_id == Usuario.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).filter(
            EscaneoQR.fecha_escaneo >= fecha_inicio,
            EscaneoQR.fecha_escaneo <= fecha_fin
        )
        
        # Filtrar por guardia específico si se proporciona
        if guardia_id:
            query = query.filter(EscaneoQR.guardia_id == guardia_id)
        
        # Ejecutar consulta ordenada por fecha de escaneo descendente
        resultados = query.order_by(EscaneoQR.fecha_escaneo.desc()).all()
        
        # Procesar resultados
        escaneos = []
        for escaneo, visita, visitante, residente, usuario_residente, guardia in resultados:
            fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
            tipo_escaneo = "salida" if visita.fecha_salida and fecha_escaneo_utc >= to_utc(visita.fecha_salida) else "entrada"
            
            escaneos.append({
                "id_escaneo": escaneo.id,
                "fecha_escaneo": fecha_escaneo_utc,
                "dispositivo": escaneo.dispositivo or "No especificado",
                "nombre_guardia": guardia.usuario.nombre if guardia.usuario else f"Guardia {guardia.id}",
                "nombre_visitante": visitante.nombre_conductor,
                "dni_visitante": visitante.dni_conductor,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita,
                "nombre_residente": usuario_residente.nombre,
                "unidad_residencial": residente.unidad_residencial,
                "estado_visita": visita.estado,
                "tipo_escaneo": tipo_escaneo
            })
        
        return {
            "escaneos": escaneos,
            "total_escaneos": len(escaneos),
            "fecha_consulta": now_utc
        }
        
    except Exception as e:
        print(f"Error al obtener historial de escaneos del día: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial de escaneos: {str(e)}"
        )
        
def obtener_historial_escaneos_totales(
    db: Session,
    nombre_guardia: str = None,
    tipo_escaneo: str = None,
    estado_visita: str = None
) -> dict:
    from app.models.escaneo_qr import EscaneoQR
    from app.models.guardia import Guardia
    from app.models.usuario import Usuario
    from app.models.visita import Visita
    from app.models.visitante import Visitante
    from app.models.residente import Residente

    query = db.query(
        EscaneoQR,
        Visita,
        Visitante,
        Residente,
        Usuario,
        Guardia
    ).join(
        Visita, EscaneoQR.visita_id == Visita.id
    ).join(
        Visitante, Visita.visitante_id == Visitante.id
    ).join(
        Residente, Visita.residente_id == Residente.id
    ).join(
        Guardia, EscaneoQR.guardia_id == Guardia.id
    ).join(
        Usuario, Guardia.usuario_id == Usuario.id
    )

    if nombre_guardia:
        query = query.filter(Usuario.nombre.ilike(f"%{nombre_guardia}%"))
    if estado_visita:
        query = query.filter(Visita.estado == estado_visita)

    resultados = query.order_by(EscaneoQR.fecha_escaneo.desc()).all()

    escaneos = []
    for escaneo, visita, visitante, residente, usuario_guardia, guardia in resultados:
        fecha_escaneo_utc = escaneo.fecha_escaneo
        tipo_escaneo_val = "salida" if visita.fecha_salida and fecha_escaneo_utc >= visita.fecha_salida else "entrada"
        if tipo_escaneo and tipo_escaneo_val != tipo_escaneo:
            continue
        escaneos.append({
            "id_escaneo": escaneo.id,
            "fecha_escaneo": fecha_escaneo_utc,
            "dispositivo": escaneo.dispositivo or "No especificado",
            "nombre_guardia": usuario_guardia.nombre if usuario_guardia else f"Guardia {guardia.id}",
            "nombre_visitante": visitante.nombre_conductor,
            "dni_visitante": visitante.dni_conductor,
            "tipo_vehiculo": visitante.tipo_vehiculo,
            "placa_vehiculo": visitante.placa_vehiculo,
            "motivo_visita": visitante.motivo_visita,
            "nombre_residente": residente.usuario.nombre if hasattr(residente, "usuario") else "",
            "unidad_residencial": residente.unidad_residencial,
            "estado_visita": visita.estado,
            "tipo_escaneo": tipo_escaneo_val
        })

    return {
        "escaneos": escaneos,
        "total_escaneos": len(escaneos),
        "fecha_consulta": datetime.now()
    }

def obtener_visitas_residente(db: Session, usuario_id: int):
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_id).first()
    from app.models.admin import Administrador
    admin = db.query(Administrador).filter(Administrador.usuario_id == usuario_id).first()

    # Si no es residente ni admin, retorna vacío
    if not residente and not admin:
        return []

    # Buscar visitas creadas por el residente o por el admin
    query = db.query(Visita)
    if residente and admin:
        visitas = query.filter(
            (Visita.residente_id == residente.id) | (Visita.admin_id == admin.id)
        ).order_by(Visita.fecha_entrada.desc()).all()
    elif residente:
        visitas = query.filter(Visita.residente_id == residente.id).order_by(Visita.fecha_entrada.desc()).all()
    else:  # solo admin
        visitas = query.filter(Visita.admin_id == admin.id).order_by(Visita.fecha_entrada.desc()).all()

    result = []
    for v in visitas:
        visitante = db.query(Visitante).filter(Visitante.id == v.visitante_id).first()
        # Si tipo_creador es None, asigna un valor por defecto
        tipo_creador_val = v.tipo_creador if v.tipo_creador is not None else ("admin" if v.admin_id else "residente")
        result.append({
            "id": v.id,
            "residente_id": v.residente_id,
            "guardia_id": v.guardia_id,
            "visitante": visitante,
            "notas": v.notas,
            "fecha_entrada": v.fecha_entrada,
            "fecha_salida": v.fecha_salida,
            "estado": v.estado,
            "qr_code": v.qr_code,
            "qr_expiracion": v.qr_expiracion,
            "qr_code_img_base64": getattr(v, "qr_code_img_base64", ""),
            "tipo_creador": tipo_creador_val,
        })
    return result

def editar_visita_residente(db: Session, visita_id: int, usuario_id: int, visita_update: VisitaUpdate, rol: str = "residente"):
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Visita no encontrada")
        # Verificar que la visita pertenezca al usuario correcto según el rol
        if rol == "residente":
            from app.models.residente import Residente
            residente = db.query(Residente).filter(Residente.id == visita.residente_id, Residente.usuario_id == usuario_id).first()
            if not residente:
                raise HTTPException(status_code=403, detail="No tienes permiso para editar esta visita")
            if visita.tipo_creador != "residente":
                raise HTTPException(status_code=403, detail="Solo puedes editar visitas creadas por residentes")
        elif rol == "admin":
            from app.models.admin import Administrador
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id, Administrador.usuario_id == usuario_id).first()
            if not admin:
                raise HTTPException(status_code=403, detail="No tienes permiso para editar esta visita")
            if visita.tipo_creador != "admin":
                raise HTTPException(status_code=403, detail="Solo puedes editar visitas creadas por administradores")
        else:
            raise HTTPException(status_code=403, detail="Rol no autorizado para editar visitas")
        # Solo se puede editar si está pendiente y no expirada
        if visita.estado != "pendiente" or getattr(visita, "expiracion", "N") == "S":
            raise HTTPException(status_code=400, detail="Solo puedes editar visitas en estado pendiente y no expiradas")
        # Actualizar campos permitidos
        if visita_update.fecha_entrada is not None:
            visita.fecha_entrada = visita_update.fecha_entrada
            visita.qr_expiracion = visita_update.fecha_entrada + timedelta(days=1)
        if visita_update.notas is not None:
            visita.notas = visita_update.notas
        if visita_update.visitante is not None:
            visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
            if visitante:
                for field, value in visita_update.visitante.dict(exclude_unset=True).items():
                    setattr(visitante, field, value)
        db.commit()
        db.refresh(visita)
        enviar_notificacion_visita_actualizada(db, visita)
        return visita
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al editar la visita: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al editar la visita: {str(e)}"
        )