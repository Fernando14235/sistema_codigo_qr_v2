import json
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException
from app.models.push_subscription import PushSubscription
from app.models.usuario import Usuario
from app.models.admin import Administrador
from app.models.residente import Residente
from app.models.guardia import Guardia
from app.core.config import settings
from app.utils.time import get_honduras_time

logger = logging.getLogger(__name__)

class PushNotificationService:
    """Servicio para gestionar notificaciones push"""
    
    def __init__(self):
        self.vapid_claims = {
            "sub": settings.VAPID_EMAIL
        }
        self.vapid_private_key = settings.VAPID_PRIVATE_KEY
    
    def crear_suscripcion(
        self,
        db: Session,
        usuario_id: int,
        endpoint: str,
        p256dh_key: str,
        auth_key: str,
        user_agent: Optional[str] = None
    ) -> PushSubscription:
        """
        Crea o actualiza una suscripción push para un usuario
        
        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            endpoint: URL del endpoint de push
            p256dh_key: Clave pública P256DH
            auth_key: Clave de autenticación
            user_agent: User agent del navegador
            
        Returns:
            PushSubscription creada o actualizada
        """
        try:
            # Verificar si ya existe una suscripción con este endpoint
            suscripcion_existente = db.query(PushSubscription).filter(
                PushSubscription.endpoint == endpoint
            ).first()
            
            if suscripcion_existente:
                # Actualizar suscripción existente
                suscripcion_existente.usuario_id = usuario_id
                suscripcion_existente.p256dh_key = p256dh_key
                suscripcion_existente.auth_key = auth_key
                suscripcion_existente.user_agent = user_agent
                suscripcion_existente.fecha_creacion = get_honduras_time()
                db.commit()
                db.refresh(suscripcion_existente)
                logger.info(f"Suscripción actualizada para usuario {usuario_id}")
                return suscripcion_existente
            
            # Crear nueva suscripción
            nueva_suscripcion = PushSubscription(
                usuario_id=usuario_id,
                endpoint=endpoint,
                p256dh_key=p256dh_key,
                auth_key=auth_key,
                user_agent=user_agent,
                fecha_creacion=get_honduras_time()
            )
            
            db.add(nueva_suscripcion)
            db.commit()
            db.refresh(nueva_suscripcion)
            logger.info(f"Nueva suscripción creada para usuario {usuario_id}")
            return nueva_suscripcion
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creando suscripción: {str(e)}")
            raise
    
    def eliminar_suscripcion(self, db: Session, endpoint: str) -> bool:
        """
        Elimina una suscripción push por endpoint
        
        Args:
            db: Sesión de base de datos
            endpoint: URL del endpoint a eliminar
            
        Returns:
            True si se eliminó, False si no existía
        """
        try:
            suscripcion = db.query(PushSubscription).filter(
                PushSubscription.endpoint == endpoint
            ).first()
            
            if suscripcion:
                db.delete(suscripcion)
                db.commit()
                logger.info(f"Suscripción eliminada: {endpoint[:50]}...")
                return True
            
            logger.warning(f"Suscripción no encontrada: {endpoint[:50]}...")
            return False
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error eliminando suscripción: {str(e)}")
            raise
    
    def obtener_suscripciones_usuario(
        self,
        db: Session,
        usuario_id: int
    ) -> List[PushSubscription]:
        """
        Obtiene todas las suscripciones de un usuario
        
        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            
        Returns:
            Lista de suscripciones del usuario
        """
        return db.query(PushSubscription).filter(
            PushSubscription.usuario_id == usuario_id
        ).all()
    
    def enviar_push(
        self,
        db: Session,
        suscripcion: PushSubscription,
        payload: Dict[str, Any]
    ) -> bool:
        """
        Envía una notificación push a una suscripción específica
        
        Args:
            db: Sesión de base de datos
            suscripcion: Suscripción a la que enviar
            payload: Datos de la notificación
            
        Returns:
            True si se envió correctamente, False en caso contrario
        """
        try:
            subscription_info = {
                "endpoint": suscripcion.endpoint,
                "keys": {
                    "p256dh": suscripcion.p256dh_key,
                    "auth": suscripcion.auth_key
                }
            }
            
            # Convertir payload a JSON
            data = json.dumps(payload)
            
            # Enviar notificación push
            webpush(
                subscription_info=subscription_info,
                data=data,
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims.copy()
            )
            
            logger.info(f"Push enviado a usuario {suscripcion.usuario_id}")
            return True
            
        except WebPushException as e:
            logger.error(f"Error enviando push: {e}")
            
            # Si el endpoint ya no es válido (410 Gone o 404), eliminar suscripción
            if e.response and e.response.status_code in [404, 410]:
                logger.warning(f"Endpoint inválido, eliminando suscripción: {suscripcion.endpoint[:50]}...")
                try:
                    db.delete(suscripcion)
                    db.commit()
                except Exception as delete_error:
                    logger.error(f"Error eliminando suscripción inválida: {delete_error}")
                    db.rollback()
            
            return False
            
        except Exception as e:
            logger.error(f"Error inesperado enviando push: {str(e)}")
            return False
    
    def enviar_push_a_usuario(
        self,
        db: Session,
        usuario_id: int,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía notificación push a todas las suscripciones de un usuario
        
        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            payload: Datos de la notificación
            
        Returns:
            Diccionario con estadísticas de envío
        """
        suscripciones = self.obtener_suscripciones_usuario(db, usuario_id)
        
        if not suscripciones:
            logger.warning(f"Usuario {usuario_id} no tiene suscripciones push")
            return {"enviados": 0, "fallidos": 0, "total": 0}
        
        enviados = 0
        fallidos = 0
        
        for suscripcion in suscripciones:
            if self.enviar_push(db, suscripcion, payload):
                enviados += 1
            else:
                fallidos += 1
        
        return {
            "enviados": enviados,
            "fallidos": fallidos,
            "total": len(suscripciones)
        }
    
    def enviar_push_a_usuarios(
        self,
        db: Session,
        usuario_ids: List[int],
        payload: Dict[str, Any],
        residencial_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Envía notificación push a múltiples usuarios
        Valida que los usuarios pertenezcan al mismo residencial si se especifica
        
        Args:
            db: Sesión de base de datos
            usuario_ids: Lista de IDs de usuarios
            payload: Datos de la notificación
            residencial_id: ID del residencial (para validación)
            
        Returns:
            Diccionario con estadísticas de envío
        """
        total_enviados = 0
        total_fallidos = 0
        usuarios_notificados = 0
        
        for usuario_id in usuario_ids:
            # Validar residencial si se especifica
            if residencial_id:
                usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
                if not usuario or usuario.residencial_id != residencial_id:
                    logger.warning(f"Usuario {usuario_id} no pertenece al residencial {residencial_id}")
                    continue
            
            resultado = self.enviar_push_a_usuario(db, usuario_id, payload)
            total_enviados += resultado["enviados"]
            total_fallidos += resultado["fallidos"]
            
            if resultado["enviados"] > 0:
                usuarios_notificados += 1
        
        return {
            "usuarios_notificados": usuarios_notificados,
            "total_enviados": total_enviados,
            "total_fallidos": total_fallidos,
            "total_usuarios": len(usuario_ids)
        }
    
    def obtener_usuarios_por_rol_y_residencial(
        self,
        db: Session,
        rol: str,
        residencial_id: int
    ) -> List[int]:
        """
        Obtiene IDs de usuarios por rol y residencial
        
        Args:
            db: Sesión de base de datos
            rol: Rol del usuario (admin, guardia, residente)
            residencial_id: ID del residencial
            
        Returns:
            Lista de IDs de usuarios
        """
        if rol == "admin":
            admins = db.query(Administrador).filter(
                Administrador.residencial_id == residencial_id
            ).all()
            return [admin.usuario_id for admin in admins if admin.usuario_id]
        
        elif rol == "guardia":
            guardias = db.query(Guardia).filter(
                Guardia.residencial_id == residencial_id
            ).all()
            return [guardia.usuario_id for guardia in guardias if guardia.usuario_id]
        
        elif rol == "residente":
            residentes = db.query(Residente).filter(
                Residente.residencial_id == residencial_id
            ).all()
            return [residente.usuario_id for residente in residentes if residente.usuario_id]
        
        return []
    
    def notificar_por_rol(
        self,
        db: Session,
        rol: str,
        residencial_id: int,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía notificación push a todos los usuarios de un rol en un residencial
        
        Args:
            db: Sesión de base de datos
            rol: Rol del usuario (admin, guardia, residente)
            residencial_id: ID del residencial
            payload: Datos de la notificación
            
        Returns:
            Diccionario con estadísticas de envío
        """
        usuario_ids = self.obtener_usuarios_por_rol_y_residencial(db, rol, residencial_id)
        
        if not usuario_ids:
            logger.warning(f"No se encontraron usuarios con rol {rol} en residencial {residencial_id}")
            return {"usuarios_notificados": 0, "total_enviados": 0, "total_fallidos": 0, "total_usuarios": 0}
        
        return self.enviar_push_a_usuarios(db, usuario_ids, payload, residencial_id)


# Instancia singleton del servicio
push_service = PushNotificationService()
