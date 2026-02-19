from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.escaneo_qr import EscaneoQR
from app.models.guardia import Guardia
from app.models.usuario import Usuario
from app.models.visita import Visita
from app.models.visitante import Visitante
from app.models.residente import Residente
from app.models.admin import Administrador
from app.models.residencial import Residencial
from app.models.notificacion import Notificacion
from app.utils.notificaciones import enviar_correo
from app.models.visita_imagen import VisitaImagen
from sqlalchemy import literal
from app.services.notificacion_service import enviar_notificacion_residente, enviar_notificacion_guardia, enviar_notificacion_visita_actualizada, enviar_notificacion_solicitud_visita, enviar_notificacion_solicitud_aprobada, enviar_notificacion_escaneo
from app.schemas.visita_schema import VisitaCreate, VisitaQRResponse, VisitaUpdate, SolicitudVisitaCreate
from app.schemas.visitante_schema import VisitanteCreate, VisitanteResponse
from app.utils.qr import validar_payload_qr, generar_payload_qr, generar_qr_completo, generar_imagen_qr_personalizada
from app.utils.validators import validar_dni_visita_unico
from datetime import datetime, timedelta, timezone
import traceback
from app.utils.time import get_honduras_time
import base64
import os
from app.utils.cloudinary_utils import save_bytes_to_temp
from app.services.cloudinary_service import upload_image
from sqlalchemy import case, and_, literal
from sqlalchemy.orm import aliased

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
            admin = db.query(Administrador).filter(Administrador.usuario_id == admin_id).first()
            if not admin:
                raise HTTPException(status_code=404, detail="Administrador no encontrado")
        elif tipo_creador == "residente":
            residente = db.query(Residente).filter(Residente.usuario_id == residente_id).first()
            if not residente:
                raise HTTPException(status_code=404, detail="Residente no encontrado")

        # Validar que el creador tenga residencial_id asignado
        creador_residencial_id = None
        if admin:
            creador_residencial_id = admin.residencial_id
        elif residente:
            creador_residencial_id = residente.residencial_id
            
        if not creador_residencial_id:
            raise HTTPException(
                status_code=400, 
                detail="El creador de la visita debe tener una residencial asignada."
            )

        # Validar campos requeridos según el tipo de entidad de la residencial
        residencial_obj = db.query(Residencial).filter(Residencial.id == creador_residencial_id).first()
        if not residencial_obj:
             raise HTTPException(status_code=404, detail="Residencial no encontrada.")
        
        tipo_entidad = getattr(residencial_obj, "tipo_entidad", "residencial")
        
        for visitante_data in visita_data.visitantes:
            # Validación para Predio e Industrial: Placa/Chasis obligatoria
            if tipo_entidad in ["predio", "industrial"]:
                if not visitante_data.placa_chasis:
                     raise HTTPException(
                         status_code=400, 
                         detail=f"Para el tipo de entidad '{tipo_entidad}', el número de placa o chasis es obligatorio."
                     )
            
            # Validación para Instituto, Empresa, Industrial: Destino de Visita obligatorio
            if tipo_entidad in ["instituto", "empresa", "industrial"]:
                if not visitante_data.destino_visita:
                     raise HTTPException(
                         status_code=400, 
                         detail=f"Para el tipo de entidad '{tipo_entidad}', el destino de visita es obligatorio."
                     )

        acompanantes = getattr(visita_data, "acompanantes", None)
        if acompanantes is not None:
            if not isinstance(acompanantes, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El campo 'acompañantes' debe ser una lista de nombres o no enviarse."
                )
            
            # Validar límite de acompañantes
            MAX_ACOMPANANTES = 10
            if len(acompanantes) > MAX_ACOMPANANTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Máximo {MAX_ACOMPANANTES} acompañantes permitidos. Has intentado agregar {len(acompanantes)}."
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
            # Obtener nombre de la residencial
            residencial_nombre = None
            if admin:
                residencial = db.query(Residencial).filter(Residencial.id == admin.residencial_id).first()
                residencial_nombre = residencial.nombre if residencial else "Residencial"
            elif residente:
                residencial = db.query(Residencial).filter(Residencial.id == residente.residencial_id).first()
                residencial_nombre = residencial.nombre if residencial else "Residencial"
            else:
                residencial_nombre = "Residencial"

            qr_img_personalizado = generar_imagen_qr_personalizada(
                qr_data=qr_code,
                nombre_residente=residente.usuario.nombre if residente else admin.usuario.nombre,
                nombre_visitante=visitante.nombre_conductor,
                nombre_residencial=residencial_nombre,
                unidad_residencial=residente.unidad_residencial if residente else "-",
                fecha_creacion=datetime.now(timezone.utc),
                fecha_expiracion=expiracion
            )

            # Guardar QR en Cloudinary
            qr_bytes = base64.b64decode(qr_img_personalizado)
            
            # Guardar bytes en archivo temporal
            temp_path = save_bytes_to_temp(qr_bytes, extension=".png")
            
            try:
                # Subir a Cloudinary
                public_id = f"qr_{visita.id}_{visitante.id}"
                result = upload_image(temp_path, folder="qr", public_id=public_id)
                qr_url = result["secure_url"]
            finally:
                # Limpiar archivo temporal
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception as e:
                        print(f"Error eliminando archivo temporal {temp_path}: {e}")

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
                    guardia_id=visita.guardia_id,
                    qr_url=qr_url
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

# Función eliminada - se usa validar_qr_entrada en su lugar

def _guardar_imagenes_visita(db: Session, visita_id: int, urls: list[str], tipo: str = None):
    """Guarda las URLs de las imágenes asociadas a una visita."""
    if not urls:
        return
    for url in urls:
        imagen = VisitaImagen(visita_id=visita_id, url=url, tipo=tipo)
        db.add(imagen)

def validar_qr_entrada(db: Session, qr_code: str, guardia_id: int, accion: str = None, observacion: str = None, imagenes: list[str] = [], commit: bool = True) -> dict:
    try:
        # Buscar la visita con el QR proporcionado
        visitas = db.query(Visita).filter(Visita.qr_code == qr_code).all()
        if not visitas:
            return {"valido": False, "error": "Código QR no identificado, no puede pasar!"}

        # Busca todas las visitas con ese QR que estén en estado válido para escanear
        visita = next((v for v in visitas if v.estado == "pendiente"), None)
        if not visita:
            # Verificar si hay visitas ya procesadas para dar un mensaje más específico
            visita_aprobada = next((v for v in visitas if v.estado == "aprobado"), None)
            if visita_aprobada:
                return {"valido": False, "error": "Este código QR ya fue escaneado y aprobado para entrada."}
            
            visita_rechazada = next((v for v in visitas if v.estado == "rechazado"), None)
            if visita_rechazada:
                return {"valido": False, "error": "Este código QR ya fue escaneado y rechazado anteriormente."}
            
            visita_completada = next((v for v in visitas if v.estado == "completado"), None)
            if visita_completada:
                return {"valido": False, "error": "Esta visita ya ha sido completada (entrada y salida registradas)."}
            
            visita_expirada = next((v for v in visitas if v.estado == "expirado"), None)
            if visita_expirada:
                return {"valido": False, "error": "Esta visita ha expirado."}
                
            return {"valido": False, "error": "No hay visitantes pendientes para este QR."}

        # Validar que el guardia y la visita pertenezcan a la misma residencial
        guardia = db.query(Guardia).filter(Guardia.id == guardia_id).first()
        if not guardia:
            return {"valido": False, "error": "Guardia no encontrado."}

        # Obtener la residencial de la visita
        if visita.residente_id:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente:
                return {"valido": False, "error": "Residente de la visita no encontrado."}
            visita_residencial_id = residente.residencial_id
        elif visita.admin_id:
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin:
                return {"valido": False, "error": "Administrador de la visita no encontrado."}
            visita_residencial_id = admin.residencial_id
        else:
            return {"valido": False, "error": "Visita sin creador válido."}

        # Validar valores y tipos

        # Validar que ambos sean int y no None
        if guardia.residencial_id is None or visita_residencial_id is None:
            return {"valido": False, "error": f"Error interno: residencial_id no asignado (guardia: {guardia.residencial_id}, visita: {visita_residencial_id})"}
        try:
            guardia_residencial_id_int = int(guardia.residencial_id)
            visita_residencial_id_int = int(visita_residencial_id)
        except Exception as e:
            return {"valido": False, "error": f"Error de tipo en residencial_id: {str(e)} (guardia: {guardia.residencial_id}, visita: {visita_residencial_id})"}

        # Verificar que ambos pertenezcan a la misma residencial
        if guardia_residencial_id_int != visita_residencial_id_int:
            return {"valido": False, "error": f"No tienes autorización para validar visitas de otra residencial. (guardia: {guardia_residencial_id_int}, visita: {visita_residencial_id_int})"}

        now_hn = get_honduras_time()

        # Validar expiración en zona Honduras
        if visita.qr_expiracion:
            if now_hn > visita.qr_expiracion:
                visita.estado = "expirado"
                if commit:
                    db.commit()
                else:
                    db.flush()
                return {"valido": False, "error": "El QR ha expirado"}

        # Verificar si la visita llega antes de la hora programada
        entrada_anticipada = False
        mensaje_entrada_anticipada = ""
        
        if visita.fecha_entrada and now_hn < visita.fecha_entrada:
            entrada_anticipada = True
            mensaje_entrada_anticipada = "⚠️ ENTRADA ANTICIPADA: El visitante llegó antes de la hora programada"
        
        # Aplicar acción si se especifica, o aprobar por defecto si no se especifica
        if accion == "aprobar" or accion is None:
            visita.estado = "aprobado"
        elif accion == "rechazar":
            visita.estado = "rechazado"
        else:
            raise HTTPException(status_code=400, detail="Acción inválida.")
        
        # Asignar guardia a la visita
        visita.guardia_id = guardia_id
        
        # Guardar observación y generar imágenes
        if observacion:
            visita.observacion_entrada = observacion
        
        _guardar_imagenes_visita(db, visita.id, imagenes, tipo="entrada")
        
        # Obtener información del visitante para la respuesta
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        # Hacer flush antes del commit para asegurar que los cambios se apliquen
        db.flush()
        if commit:
            db.commit()
        
        # Verificar que el cambio se aplicó correctamente
        db.refresh(visita)
        
        return {
            "valido": True,
            "visitante": {
                "nombre_conductor": visitante.nombre_conductor,
                "dni_conductor": visitante.dni_conductor,
                "telefono": visitante.telefono,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "placa_chasis": visitante.placa_chasis,
                "destino_visita": visitante.destino_visita,
                "motivo_visita": visitante.motivo_visita
            },
            "estado": visita.estado,
            "visita_id": visita.id,
            "entrada_anticipada": entrada_anticipada,
            "mensaje_entrada_anticipada": mensaje_entrada_anticipada if entrada_anticipada else None,
            "observacion_entrada": visita.observacion_entrada,
            "imagenes": imagenes
        }
        
    except HTTPException as e:
        if commit:
            db.rollback()
        raise e
    except Exception as e:
        if commit:
            db.rollback()
        print(f"Error al validar QR de entrada: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar QR de entrada: {str(e)}"
        )

def registrar_salida_visita(db: Session, qr_code: str, guardia_id: int, observacion: str = None, imagenes: list[str] = [], commit: bool = True) -> dict:
    try:
        # Buscar la visita con el QR proporcionado
        visita = db.query(Visita).filter(Visita.qr_code == qr_code).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Código QR no encontrado")
        
        # Validar que la visita esté en estado "aprobado"
        if visita.estado == "completado":
            raise HTTPException(
                status_code=400, 
                detail="Este código QR ya fue escaneado para salida. La visita ya está completada."
            )
        elif visita.estado != "aprobado":
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede registrar la salida. La visita está en estado '{visita.estado}'. Solo se permite registrar salida para visitas aprobadas."
            )
        
        # Validar que el guardia y la visita pertenezcan a la misma residencial
        guardia = db.query(Guardia).filter(Guardia.id == guardia_id).first()
        if not guardia:
            raise HTTPException(status_code=404, detail="Guardia no encontrado.")

        # Obtener la residencial de la visita
        if visita.residente_id:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente:
                raise HTTPException(status_code=404, detail="Residente de la visita no encontrado.")
            visita_residencial_id = residente.residencial_id
        elif visita.admin_id:
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin:
                raise HTTPException(status_code=404, detail="Administrador de la visita no encontrado.")
            visita_residencial_id = admin.residencial_id
        else:
            raise HTTPException(status_code=400, detail="Visita sin creador válido.")

        # Verificar que ambos pertenezcan a la misma residencial
        if guardia.residencial_id != visita_residencial_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes autorización para registrar salidas de visitas de otra residencial."
            )
        
        # Registrar la fecha de salida en UTC
        now_utc = datetime.now(timezone.utc)
        now_hn = get_honduras_time()
        
        # Verificar si la salida es tardía (después de la expiración del QR)
        salida_tardia = False
        if visita.qr_expiracion and now_hn > visita.qr_expiracion:
            salida_tardia = True
        
        visita.fecha_salida = now_utc
        visita.estado = "completado"
        
        if observacion:
            visita.observacion_salida = observacion
            
        _guardar_imagenes_visita(db, visita.id, imagenes, tipo="salida")
        
        # Obtener información del visitante para la respuesta
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        # Obtener información del guardia para las notificaciones (si se re-habilita)
        guardia_usuario = db.query(Usuario).filter(Usuario.id == guardia.usuario_id).first()
        # guardia_nombre = guardia_usuario.nombre if guardia_usuario else "Guardia"
        
        if commit:
            db.commit()
        else:
            db.flush()
        
        mensaje_respuesta = "Salida registrada exitosamente"
        if salida_tardia:
            mensaje_respuesta += " (SALIDA TARDÍA - QR expirado)"
        
        return {
            "mensaje": mensaje_respuesta,
            "fecha_salida": now_utc,
            "estado": visita.estado,
            "salida_tardia": salida_tardia,
            "visitante": {
                "nombre_conductor": visitante.nombre_conductor,
                "dni_conductor": visitante.dni_conductor,
                "telefono": visitante.telefono,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita
            },
            "visita_id": visita.id,
            "observacion_salida": visita.observacion_salida,
            "imagenes": imagenes
        }
        
    except HTTPException as e:
        if commit:
            db.rollback()
        raise e
    except Exception as e:
        if commit:
            db.rollback()
        print(f"Error al registrar salida: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al registrar la salida: {str(e)}"
        )


def obtener_historial_escaneos_dia(db: Session, guardia_id: int = None, residencial_id: int = None, nombre_guardia: str = None, page: int = 1, limit: int = 15) -> dict:
    try:
        # Obtener fecha actual en Honduras
        ahora_honduras = get_honduras_time()
        now_utc = datetime.now(timezone.utc)
        fecha_inicio = ahora_honduras.replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_fin = ahora_honduras.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Consultas base
        query_residentes = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            Usuario.nombre.label('creador_nombre'),
            Residente.unidad_residencial.label('unidad_residencial')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            Residente, Visita.residente_id == Residente.id
        ).join(
            Usuario, Residente.usuario_id == Usuario.id
        ).filter(
            EscaneoQR.fecha_escaneo >= fecha_inicio,
            EscaneoQR.fecha_escaneo <= fecha_fin
        )
        
        query_admins = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            Usuario.nombre.label('creador_nombre'),
            literal("Admin").label('unidad_residencial')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            Administrador, Visita.admin_id == Administrador.id
        ).join(
            Usuario, Administrador.usuario_id == Usuario.id
        ).filter(
            EscaneoQR.fecha_escaneo >= fecha_inicio,
            EscaneoQR.fecha_escaneo <= fecha_fin
        )
        
        # Filtros adicionales
        if guardia_id:
            query_residentes = query_residentes.filter(EscaneoQR.guardia_id == guardia_id)
            query_admins = query_admins.filter(EscaneoQR.guardia_id == guardia_id)
        
        if residencial_id:
            query_residentes = query_residentes.filter(Residente.residencial_id == residencial_id)
            query_admins = query_admins.filter(Administrador.residencial_id == residencial_id)

        # Union
        union_query = query_residentes.union_all(query_admins)
        
        # Conteo total antes de paginar
        total_escaneos = union_query.count()
        resultados = union_query.order_by(EscaneoQR.fecha_escaneo.desc()).offset((page - 1) * limit).limit(limit).all()
        
        # Procesar resultados
        escaneos = []
        for row in resultados:
            escaneo, visita, visitante, guardia, creador_nombre, unidad_residencial = row
            
            fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
            tipo_escaneo = "salida" if visita.fecha_salida and fecha_escaneo_utc >= to_utc(visita.fecha_salida) else "entrada"
            
            entrada_anticipada = False
            if tipo_escaneo == "entrada" and visita.fecha_entrada:
                entrada_anticipada = fecha_escaneo_utc < to_utc(visita.fecha_entrada)
                
            escaneos.append({
                "id_escaneo": escaneo.id,
                "fecha_escaneo": fecha_escaneo_utc,
                "dispositivo": escaneo.dispositivo or "No especificado",
                "nombre_guardia": guardia.usuario.nombre if getattr(guardia, 'usuario', None) else f"Guardia {guardia.id}",
                "nombre_visitante": visitante.nombre_conductor,
                "dni_visitante": visitante.dni_conductor,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita,
                "nombre_residente": f"{creador_nombre}{' (Admin)' if unidad_residencial == 'Admin' else ''}",
                "unidad_residencial": unidad_residencial,
                "estado_visita": visita.estado,
                "tipo_escaneo": tipo_escaneo,
                "tipo_creador": "admin" if unidad_residencial == 'Admin' else "residente",
                "entrada_anticipada": entrada_anticipada,
                "placa_chasis": visitante.placa_chasis
            })
            
        return {
            "escaneos": escaneos,
            "total_escaneos": total_escaneos,
            "fecha_consulta": now_utc
        }
        
    except Exception as e:
        print(f"Error al obtener historial de escaneos del día: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial de escaneos: {str(e)}"
        )
        
def obtener_historial_escaneos_totales(db: Session, residencial_id: int = None, nombre_guardia: str = None, tipo_escaneo: str = None, estado_visita: str = None, page: int = 1, limit: int = 15) -> dict:
    try:       
        # Consultas base
        query_residentes = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            Usuario.nombre.label('creador_nombre'),
            Residente.unidad_residencial.label('unidad_residencial')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            Residente, Visita.residente_id == Residente.id
        ).join(
            Usuario, Residente.usuario_id == Usuario.id
        ).filter(
            Visita.residente_id.isnot(None)
        )
        
        query_admins = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            Usuario.nombre.label('creador_nombre'),
            literal("Admin").label('unidad_residencial')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            Administrador, Visita.admin_id == Administrador.id
        ).join(
            Usuario, Administrador.usuario_id == Usuario.id
        ).filter(
            Visita.admin_id.isnot(None)
        )
        
        # Filtros adicionales
        if nombre_guardia:
            query_residentes = query_residentes.filter(Usuario.nombre.ilike(f"%{nombre_guardia}%"))
            pass
        
        # FIX JOINS FOR ACCURATE FILTERING
        UsuarioGuardia = aliased(Usuario)
        UsuarioCreador = aliased(Usuario)
        
        # Re-construct queries with aliases
        query_residentes = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            UsuarioCreador.nombre.label('creador_nombre'),
            Residente.unidad_residencial.label('unidad_residencial'),
            UsuarioGuardia.nombre.label('guardia_nombre')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            UsuarioGuardia, Guardia.usuario_id == UsuarioGuardia.id
        ).join(
            Residente, Visita.residente_id == Residente.id
        ).join(
            UsuarioCreador, Residente.usuario_id == UsuarioCreador.id
        ).filter(
            Visita.residente_id.isnot(None)
        )
        
        query_admins = db.query(
            EscaneoQR,
            Visita,
            Visitante,
            Guardia,
            UsuarioCreador.nombre.label('creador_nombre'),
            literal("Admin").label('unidad_residencial'),
            UsuarioGuardia.nombre.label('guardia_nombre')
        ).join(
            Visita, EscaneoQR.visita_id == Visita.id
        ).join(
            Visitante, Visita.visitante_id == Visitante.id
        ).join(
            Guardia, EscaneoQR.guardia_id == Guardia.id
        ).join(
            UsuarioGuardia, Guardia.usuario_id == UsuarioGuardia.id
        ).join(
            Administrador, Visita.admin_id == Administrador.id
        ).join(
            UsuarioCreador, Administrador.usuario_id == UsuarioCreador.id
        ).filter(
            Visita.admin_id.isnot(None)
        )

        if residencial_id:
            query_residentes = query_residentes.filter(Residente.residencial_id == residencial_id)
            query_admins = query_admins.filter(Administrador.residencial_id == residencial_id)

        if nombre_guardia:
            query_residentes = query_residentes.filter(UsuarioGuardia.nombre.ilike(f"%{nombre_guardia}%"))
            query_admins = query_admins.filter(UsuarioGuardia.nombre.ilike(f"%{nombre_guardia}%"))
            
        if estado_visita:
            query_residentes = query_residentes.filter(Visita.estado == estado_visita)
            query_admins = query_admins.filter(Visita.estado == estado_visita)

        # Union
        union_query = query_residentes.union_all(query_admins)

        cond_salida = and_(Visita.fecha_salida.isnot(None), EscaneoQR.fecha_escaneo >= Visita.fecha_salida)
        
        if tipo_escaneo == "salida":
            query_residentes = query_residentes.filter(cond_salida)
            query_admins = query_admins.filter(cond_salida)
        elif tipo_escaneo == "entrada":
            query_residentes = query_residentes.filter(~cond_salida)
            query_admins = query_admins.filter(~cond_salida)

        # Re-apply Union
        union_query = query_residentes.union_all(query_admins)
        total_escaneos = union_query.count()

        # Trying direct order by if Supported
        resultados = union_query.order_by(EscaneoQR.fecha_escaneo.desc()).offset((page - 1) * limit).limit(limit).all()

        escaneos = []
        for row in resultados:
            escaneo, visita, visitante, guardia, creador_nombre, unidad_residencial, guardia_nombre = row
            
            fecha_escaneo_utc = to_utc(escaneo.fecha_escaneo)
            tipo_escaneo_val = "salida" if visita.fecha_salida and fecha_escaneo_utc >= to_utc(visita.fecha_salida) else "entrada"
            
            escaneos.append({
                "id_escaneo": escaneo.id,
                "fecha_escaneo": fecha_escaneo_utc,
                "dispositivo": escaneo.dispositivo or "No especificado",
                "nombre_guardia": guardia_nombre,
                "nombre_visitante": visitante.nombre_conductor,
                "dni_visitante": visitante.dni_conductor,
                "tipo_vehiculo": visitante.tipo_vehiculo,
                "placa_vehiculo": visitante.placa_vehiculo,
                "motivo_visita": visitante.motivo_visita,
                "nombre_residente": f"{creador_nombre}{' (Admin)' if unidad_residencial == 'Admin' else ''}",
                "unidad_residencial": unidad_residencial,
                "estado_visita": visita.estado,
                "tipo_escaneo": tipo_escaneo_val,
                "placa_chasis": visitante.placa_chasis
            })

        return {
            "escaneos": escaneos,
            "total_escaneos": total_escaneos,
            "fecha_consulta": datetime.now()
        }
    except Exception as e:
        print(f"Error al obtener historial de escaneos totales: {str(e)}")
        print(traceback.format_exc())
        return {
            "escaneos": [],
            "total_escaneos": 0,
            "error": str(e)
        }


def obtener_visitas_residente(db: Session, usuario_id: int, page: int = 1, limit: int = 15):
    residente = db.query(Residente).filter(Residente.usuario_id == usuario_id).first()
    admin = db.query(Administrador).filter(Administrador.usuario_id == usuario_id).first()

    if not residente and not admin:
        return {"total": 0, "data": []}

    query = db.query(Visita)
    if residente and admin:
        query = query.filter(
            (Visita.residente_id == residente.id) | (Visita.admin_id == admin.id)
        )
    elif residente:
        query = query.filter(Visita.residente_id == residente.id)
    else:  # solo admin
        query = query.filter(Visita.admin_id == admin.id)
        
    total = query.count()
    visitas = query.order_by(Visita.fecha_entrada.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for v in visitas:
        visitante = db.query(Visitante).filter(Visitante.id == v.visitante_id).first()
        tipo_creador_val = v.tipo_creador if v.tipo_creador is not None else ("admin" if v.admin_id else "residente")
        result.append({
            "id": v.id,
            "residente_id": v.residente_id,
            "guardia_id": v.guardia_id,
            "admin_id": v.admin_id,
            "visitante": visitante,
            "notas": v.notas,
            "fecha_entrada": v.fecha_entrada,
            "fecha_salida": v.fecha_salida,
            "estado": v.estado,
            "expiracion": v.expiracion,
            "qr_code": v.qr_code,
            "qr_expiracion": v.qr_expiracion,
            "qr_code_img_base64": getattr(v, "qr_code_img_base64", ""),
            "tipo_creador": tipo_creador_val,
        })
    return {"total": total, "data": result}

def editar_visita_residente(db: Session, visita_id: int, usuario_id: int, visita_update: VisitaUpdate, rol: str = "residente"):
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Visita no encontrada")
        # Verificar que la visita pertenezca al usuario correcto según el rol
        if rol == "residente":
            residente = db.query(Residente).filter(Residente.id == visita.residente_id, Residente.usuario_id == usuario_id).first()
            if not residente:
                raise HTTPException(status_code=403, detail="No tienes permiso para editar esta visita")
            if visita.tipo_creador != "residente":
                raise HTTPException(status_code=403, detail="Solo puedes editar visitas creadas por residentes")
        elif rol == "admin":
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

def eliminar_visita_residente(db: Session, visita_id: int, usuario_id: int, rol: str = "residente"):
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Visita no encontrada")
        
        if rol == "residente":
            residente = db.query(Residente).filter(Residente.usuario_id == usuario_id).first()
            if not residente or visita.residente_id != residente.id:
                raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta visita")
            
        elif rol == "admin":
            admin = db.query(Administrador).filter(Administrador.usuario_id == usuario_id).first()
            if not admin or visita.admin_id != admin.id:
                raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta visita")
            
        else:
            raise HTTPException(status_code=403, detail="Rol no autorizado para eliminar visitas")
        db.delete(visita)
        db.commit()
        return {"mensaje": "Visita eliminada correctamente", "visita_id": visita_id}
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar la visita: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la visita: {str(e)}"
        )

def crear_solicitud_visita_residente(db: Session, solicitud_data: SolicitudVisitaCreate, residente_id: int) -> dict:
    """
    Crea una solicitud de visita que el residente envía al administrador.
    El administrador debe aprobar y crear la visita final.
    """
    try:
        # Verificar que el residente existe
        residente = db.query(Residente).filter(Residente.usuario_id == residente_id).first()
        if not residente:
            raise HTTPException(status_code=404, detail="Residente no encontrado")

        # Validar fecha de entrada
        fecha_entrada = solicitud_data.fecha_entrada
        if fecha_entrada.tzinfo is None:
            fecha_entrada = get_honduras_time().tzinfo.localize(fecha_entrada)
        else:
            fecha_entrada = fecha_entrada.astimezone(get_honduras_time().tzinfo)
        
        if fecha_entrada < get_honduras_time():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede crear una solicitud con fecha/hora pasada"
            )

        # Crear el visitante
        visitante = Visitante(
            nombre_conductor=solicitud_data.nombre_visitante,
            dni_conductor=solicitud_data.dni_visitante,
            telefono=solicitud_data.telefono_visitante,
            tipo_vehiculo=solicitud_data.tipo_vehiculo,
            marca_vehiculo=solicitud_data.marca_vehiculo,
            color_vehiculo=solicitud_data.color_vehiculo,
            placa_vehiculo=solicitud_data.placa_vehiculo,
            motivo_visita=solicitud_data.motivo_visita
        )
        db.add(visitante)
        db.flush()

        # Crear la visita con estado "solicitada"
        expiracion = fecha_entrada + timedelta(days=1)
        
        visita = Visita(
            residente_id=residente.id,
            admin_id=None,  # Se asignará cuando el admin apruebe
            visitante_id=visitante.id,
            notas=solicitud_data.motivo_visita,
            fecha_entrada=fecha_entrada,
            qr_expiracion=expiracion,
            qr_code="PENDIENTE_APROBACION",
            tipo_creador="residente",
            estado="solicitada"  # Nuevo estado para solicitudes
        )
        db.add(visita)
        db.flush()

        # Enviar notificación a todos los administradores
        try:
            enviar_notificacion_solicitud_visita(db, visita, residente)
        except Exception as e:
            print(f"Error al enviar notificación de solicitud: {str(e)}")

        db.commit()
        
        return {
            "mensaje": "Solicitud de visita enviada exitosamente al administrador",
            "visita_id": visita.id,
            "estado": "solicitada",
            "fecha_solicitud": get_honduras_time()
        }

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al crear solicitud de visita: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear solicitud de visita: {str(e)}"
        )

def aprobar_solicitud_visita_admin(db: Session, visita_id: int, admin_id: int) -> list[VisitaQRResponse]:
    """
    Aprueba una solicitud de visita y la convierte en una visita activa.
    """
    try:
        # Verificar que el admin existe
        admin = db.query(Administrador).filter(Administrador.usuario_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Administrador no encontrado")

        # Buscar la visita solicitada
        visita = db.query(Visita).filter(Visita.id == visita_id, Visita.estado == "solicitada").first()
        if not visita:
            raise HTTPException(status_code=404, detail="Solicitud de visita no encontrada")

        # Verificar que la fecha de entrada no haya pasado
        if visita.fecha_entrada < get_honduras_time():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede aprobar una solicitud con fecha/hora pasada"
            )

        # Actualizar la visita
        visita.admin_id = admin.id
        visita.estado = "pendiente"
        visita.tipo_creador = "admin"  # Cambiar a admin como creador
        
        # Generar QR real
        qr_code, qr_img_b64 = generar_qr_completo(visita.id, minutos_validez=1440)
        visita.qr_code = qr_code
        
        # Generar QR personalizado
        qr_img_personalizado = generar_imagen_qr_personalizada(
            qr_data=qr_code,
            nombre_residente=visita.residente.usuario.nombre,
            nombre_visitante=visita.visitante.nombre_conductor,
            nombre_residencial="Porto Pass",
            unidad_residencial=visita.residente.unidad_residencial,
            fecha_creacion=datetime.now(timezone.utc),
            fecha_expiracion=visita.qr_expiracion
        )

        # Enviar notificaciones
        try:
            enviar_notificacion_guardia(db, visita)
        except Exception as e:
            print(f"Error al enviar notificaciones: {str(e)}")

        db.commit()
        
        # Retornar respuesta en formato VisitaQRResponse
        return [VisitaQRResponse(
            id=visita.id,
            residente_id=visita.residente_id,
            admin_id=visita.admin_id,
            visitante=visita.visitante,
            estado=visita.estado,
            qr_expiracion=visita.qr_expiracion,
            qr_code=visita.qr_code,
            qr_code_img_base64=qr_img_personalizado,
            fecha_entrada=visita.fecha_entrada,
            notas=visita.notas,
            tipo_creador=visita.tipo_creador,
            fecha_salida=visita.fecha_salida,
            guardia_id=visita.guardia_id
        )]

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error al aprobar solicitud de visita: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al aprobar solicitud de visita: {str(e)}"
        )

def obtener_solicitudes_pendientes_admin(db: Session) -> list:
    """
    Obtiene todas las solicitudes de visita pendientes para el administrador.
    """
    try:
        solicitudes = db.query(Visita).filter(
            Visita.estado == "solicitada"
        ).order_by(Visita.fecha_entrada.asc()).all()

        result = []
        for solicitud in solicitudes:
            result.append({
                "id": solicitud.id,
                "residente": {
                    "nombre": solicitud.residente.usuario.nombre,
                    "email": solicitud.residente.usuario.email,
                    "unidad_residencial": solicitud.residente.unidad_residencial,
                    "telefono": solicitud.residente.telefono
                },
                "visitante": solicitud.visitante,
                "fecha_entrada": solicitud.fecha_entrada,
                "motivo_visita": solicitud.notas,
                "fecha_solicitud": solicitud.fecha_entrada,  # Usamos fecha_entrada como fecha de solicitud
                "estado": solicitud.estado
            })
        
        return result

    except Exception as e:
        print(f"Error al obtener solicitudes pendientes: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener solicitudes pendientes: {str(e)}"
        )

def enviar_notificacion_salida_tardia(db: Session, visita, guardia_nombre: str):
    """
    Envía notificación especial cuando un visitante sale después de la expiración del QR
    """
    try:                
        residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        if not residente or not visitante:
            return

        asunto = "⚠️ Visitante salió con QR expirado"
        
        # Calcular cuánto tiempo después de la expiración salió
        tiempo_extra = ""
        if visita.qr_expiracion:
            diferencia = get_honduras_time() - visita.qr_expiracion
            horas = int(diferencia.total_seconds() // 3600)
            minutos = int((diferencia.total_seconds() % 3600) // 60)
            
            if horas > 0:
                tiempo_extra = f"{horas} horas y {minutos} minutos"
            else:
                tiempo_extra = f"{minutos} minutos"
        
        mensaje_html = f"""
            <html>
                <body>
                    <h2 style="color: #ff9800;">⚠️ Salida Tardía Registrada</h2>
                    <p>El visitante <strong>{visitante.nombre_conductor}</strong> ha <strong>SALIDO</strong> de la residencial con QR expirado.</p>
                    
                    <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0;">
                        <h3 style="color: #e65100; margin-top: 0;">Información de la Salida Tardía:</h3>
                        <p><strong>Visitante:</strong> {visitante.nombre_conductor}</p>
                        <p><strong>QR expiró:</strong> {visita.qr_expiracion.strftime('%Y-%m-%d %H:%M:%S') if visita.qr_expiracion else 'N/A'}</p>
                        <p><strong>Salida registrada:</strong> {get_honduras_time().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p><strong>Tiempo de retraso:</strong> {tiempo_extra}</p>
                        <p><strong>Guardia que registró:</strong> {guardia_nombre}</p>
                    </div>
                    
                    <p>La visita ha sido marcada como <strong>COMPLETADA</strong> a pesar de la expiración del QR.</p>
                    <p><em>Nota: Se recomienda coordinar mejor los horarios de visita para evitar inconvenientes futuros.</em></p>
                    
                    <p>Gracias por usar nuestro sistema de control de acceso.</p>
                </body>
            </html>
        """
        
        mensaje_notificacion = f"Salida tardía: {visitante.nombre_conductor} - QR expirado hace {tiempo_extra} - registrado por {guardia_nombre}"

        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html)

        estado = "enviado" if exito else "fallido"
        
        notificacion = Notificacion(
            visita_id=visita.id,
            mensaje=mensaje_notificacion,
            fecha_envio=get_honduras_time(),
            estado=estado
        )
        
        db.add(notificacion)
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación de salida tardía: {str(e)}")
        print(traceback.format_exc())
