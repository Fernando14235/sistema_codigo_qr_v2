"""
Funciones helper para integrar notificaciones push en servicios existentes
"""
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.services.push_notification_service import push_service
from app.models.admin import Administrador
from app.models.residente import Residente
from app.models.guardia import Guardia

logger = logging.getLogger(__name__)

def enviar_push_nueva_visita_guardia(
    db: Session,
    visita,
    residencial_id: int
) -> Dict[str, Any]:
    """
    Envía notificación push a guardias cuando se crea una nueva visita
    
    Args:
        db: Sesión de base de datos
        visita: Objeto Visita
        residencial_id: ID del residencial
        
    Returns:
        Resultado del envío
    """
    try:
        # Obtener nombre del creador
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            nombre_creador = admin.usuario.nombre if admin else "Administrador"
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            nombre_creador = residente.usuario.nombre if residente else "Residente"
        
        payload = {
            "title": "🚨 Nueva visita programada",
            "body": f"Visita de {visita.visitante.nombre_conductor} para {nombre_creador}",
            "icon": "/genfavicon-180-v3.png",
            "badge": "/genfavicon-64-v3.png",
            "data": {
                "url": "/visitas",
                "tipo": "visita_creada",
                "visita_id": visita.id,
                "visitante": visita.visitante.nombre_conductor,
                "placa": visita.visitante.placa_vehiculo,
                "creador": nombre_creador
            },
            "tag": f"visita-{visita.id}",
            "requireInteraction": True
        }
        
        resultado = push_service.notificar_por_rol(
            db=db,
            rol="guardia",
            residencial_id=residencial_id,
            payload=payload
        )
        
        logger.info(f"Push enviado a guardias: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push a guardias: {str(e)}")
        return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}

def enviar_push_escaneo_visita(
    db: Session,
    visita,
    guardia_nombre: str,
    es_salida: bool = False
) -> Dict[str, Any]:
    """
    Envía notificación push al residente/admin cuando se escanea una visita
    
    Args:
        db: Sesión de base de datos
        visita: Objeto Visita
        guardia_nombre: Nombre del guardia que escaneó
        es_salida: True si es salida, False si es entrada
        
    Returns:
        Resultado del envío
    """
    try:
        # Determinar destinatario
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin or not admin.usuario:
                return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}
            usuario_id = admin.usuario_id
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente or not residente.usuario:
                return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}
            usuario_id = residente.usuario_id
        
        if es_salida:
            payload = {
                "title": "🚗 Visitante ha salido",
                "body": f"{visita.visitante.nombre_conductor} - Registrado por {guardia_nombre}",
                "icon": "/genfavicon-180-v3.png",
                "badge": "/genfavicon-64-v3.png",
                "data": {
                    "url": f"/visitas/{visita.id}",
                    "tipo": "escaneo_salida",
                    "visita_id": visita.id,
                    "visitante": visita.visitante.nombre_conductor,
                    "guardia": guardia_nombre
                },
                "tag": f"escaneo-{visita.id}"
            }
        else:
            payload = {
                "title": "🚪 Visitante ha ingresado",
                "body": f"{visita.visitante.nombre_conductor} - Registrado por {guardia_nombre}",
                "icon": "/genfavicon-180-v3.png",
                "badge": "/genfavicon-64-v3.png",
                "data": {
                    "url": f"/visitas/{visita.id}",
                    "tipo": "escaneo_entrada",
                    "visita_id": visita.id,
                    "visitante": visita.visitante.nombre_conductor,
                    "guardia": guardia_nombre
                },
                "tag": f"escaneo-{visita.id}"
            }
        
        resultado = push_service.enviar_push_a_usuario(
            db=db,
            usuario_id=usuario_id,
            payload=payload
        )
        
        logger.info(f"Push de escaneo enviado: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push de escaneo: {str(e)}")
        return {"enviados": 0, "fallidos": 0, "total": 0}

def enviar_push_visita_actualizada(
    db: Session,
    visita
) -> Dict[str, Any]:
    """
    Envía notificación push cuando se actualiza una visita
    
    Args:
        db: Sesión de base de datos
        visita: Objeto Visita actualizada
        
    Returns:
        Resultado del envío
    """
    try:
        # Determinar destinatario
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin or not admin.usuario:
                return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}
            usuario_id = admin.usuario_id
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente or not residente.usuario:
                return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}
            usuario_id = residente.usuario_id
        
        payload = {
            "title": "✏️ Visita actualizada",
            "body": f"Se actualizó la visita de {visita.visitante.nombre_conductor}",
            "icon": "/genfavicon-180-v3.png",
            "data": {
                "url": f"/visitas/{visita.id}",
                "tipo": "visita_actualizada",
                "visita_id": visita.id,
                "visitante": visita.visitante.nombre_conductor
            },
            "tag": f"visita-actualizada-{visita.id}"
        }
        
        resultado = push_service.enviar_push_a_usuario(
            db=db,
            usuario_id=usuario_id,
            payload=payload
        )
        
        logger.info(f"Push de actualización enviado: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push de actualización: {str(e)}")
        return {"enviados": 0, "fallidos": 0, "total": 0}

def enviar_push_solicitud_visita(
    db: Session,
    visita,
    residente,
    residencial_id: int
) -> Dict[str, Any]:
    """
    Envía notificación push a admins cuando hay una nueva solicitud de visita
    
    Args:
        db: Sesión de base de datos
        visita: Objeto Visita (solicitud)
        residente: Objeto Residente que creó la solicitud
        residencial_id: ID del residencial
        
    Returns:
        Resultado del envío
    """
    try:
        payload = {
            "title": "📋 Nueva solicitud de visita",
            "body": f"{residente.usuario.nombre} solicita visita para {visita.visitante.nombre_conductor}",
            "icon": "/genfavicon-180-v3.png",
            "badge": "/genfavicon-64-v3.png",
            "data": {
                "url": "/solicitudes",
                "tipo": "solicitud_pendiente",
                "visita_id": visita.id,
                "residente_id": residente.id,
                "visitante": visita.visitante.nombre_conductor
            },
            "tag": f"solicitud-{visita.id}",
            "requireInteraction": True
        }
        
        resultado = push_service.notificar_por_rol(
            db=db,
            rol="admin",
            residencial_id=residencial_id,
            payload=payload
        )
        
        logger.info(f"Push de solicitud enviado a admins: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push de solicitud: {str(e)}")
        return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}

def enviar_push_nueva_publicacion(
    db: Session,
    titulo: str,
    creador: str,
    residencial_id: int,
    publicacion_id: int,
    notificar_a: str = 'todos'
) -> Dict[str, Any]:
    """
    Envía notificación push cuando se crea una nueva publicación social
    
    Args:
        db: Sesión de base de datos
        titulo: Título de la publicación
        creador: Nombre del creador
        residencial_id: ID del residencial
        publicacion_id: ID de la publicación
        notificar_a: 'todos', 'admin', 'residente'
        
    Returns:
        Resultado del envío
    """
    try:
        payload = {
            "title": "📢 Nueva publicación",
            "body": f"{creador}: {titulo[:50]}{'...' if len(titulo) > 50 else ''}",
            "icon": "/genfavicon-180-v3.png",
            "data": {
                "url": "/social",
                "tipo": "publicacion_creada",
                "publicacion_id": publicacion_id,
                "titulo": titulo,
                "creador": creador
            },
            "tag": f"publicacion-{publicacion_id}"
        }
        
        resultado_total = {
            "usuarios_notificados": 0,
            "total_enviados": 0,
            "total_fallidos": 0
        }
        
        # Notificar según el tipo
        if notificar_a in ['todos', 'admin']:
            resultado_admin = push_service.notificar_por_rol(
                db=db,
                rol="admin",
                residencial_id=residencial_id,
                payload=payload
            )
            resultado_total["usuarios_notificados"] += resultado_admin["usuarios_notificados"]
            resultado_total["total_enviados"] += resultado_admin["total_enviados"]
            resultado_total["total_fallidos"] += resultado_admin["total_fallidos"]
        
        if notificar_a in ['todos', 'residente']:
            resultado_residente = push_service.notificar_por_rol(
                db=db,
                rol="residente",
                residencial_id=residencial_id,
                payload=payload
            )
            resultado_total["usuarios_notificados"] += resultado_residente["usuarios_notificados"]
            resultado_total["total_enviados"] += resultado_residente["total_enviados"]
            resultado_total["total_fallidos"] += resultado_residente["total_fallidos"]
        
        logger.info(f"Push de publicación enviado: {resultado_total}")
        return resultado_total
        
    except Exception as e:
        logger.error(f"Error enviando push de publicación: {str(e)}")
        return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}

def enviar_push_ticket_creado(
    db: Session,
    ticket,
    residente_nombre: str,
    residencial_id: int
) -> Dict[str, Any]:
    """
    Envía notificación push a admins cuando se crea un nuevo ticket
    
    Args:
        db: Sesión de base de datos
        ticket: Objeto Ticket
        residente_nombre: Nombre del residente que creó el ticket
        residencial_id: ID del residencial
        
    Returns:
        Resultado del envío
    """
    try:
        payload = {
            "title": "🎫 Nuevo ticket de soporte",
            "body": f"{residente_nombre}: {ticket.titulo}",
            "icon": "/genfavicon-180-v3.png",
            "data": {
                "url": f"/tickets/{ticket.id}",
                "tipo": "ticket_creado",
                "ticket_id": ticket.id,
                "residente": residente_nombre,
                "titulo": ticket.titulo
            },
            "tag": f"ticket-{ticket.id}",
            "requireInteraction": True
        }
        
        resultado = push_service.notificar_por_rol(
            db=db,
            rol="admin",
            residencial_id=residencial_id,
            payload=payload
        )
        
        logger.info(f"Push de ticket creado enviado: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push de ticket creado: {str(e)}")
        return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0}

def enviar_push_ticket_actualizado(
    db: Session,
    ticket,
    residente_id: int
) -> Dict[str, Any]:
    """
    Envía notificación push al residente cuando se actualiza su ticket
    
    Args:
        db: Sesión de base de datos
        ticket: Objeto Ticket actualizado
        residente_id: ID del residente
        
    Returns:
        Resultado del envío
    """
    try:
        residente = db.query(Residente).filter(Residente.id == residente_id).first()
        if not residente or not residente.usuario:
            return {"enviados": 0, "fallidos": 0, "total": 0}
        
        payload = {
            "title": "✅ Tu ticket fue actualizado",
            "body": f"Estado: {ticket.estado}",
            "icon": "/genfavicon-180-v3.png",
            "data": {
                "url": f"/tickets/{ticket.id}",
                "tipo": "ticket_actualizado",
                "ticket_id": ticket.id,
                "estado": ticket.estado
            },
            "tag": f"ticket-actualizado-{ticket.id}"
        }
        
        resultado = push_service.enviar_push_a_usuario(
            db=db,
            usuario_id=residente.usuario_id,
            payload=payload
        )
        
        logger.info(f"Push de ticket actualizado enviado: {resultado}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error enviando push de ticket actualizado: {str(e)}")
        return {"enviados": 0, "fallidos": 0, "total": 0}
