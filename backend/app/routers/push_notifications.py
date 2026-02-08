from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import get_current_user
from app.models.usuario import Usuario
from app.schemas.push_subscription_schema import (
    PushSubscriptionCreate,
    PushSubscriptionDB,
    PushSubscriptionUnsubscribe,
    PushNotificationSend,
    PushNotificationPayload
)
from app.services.push_notification_service import push_service
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/push", tags=["Push Notifications"])

@router.get("/vapid-public-key", response_model=dict)
def obtener_vapid_public_key():
    """
    Retorna la clave pública VAPID para que el frontend pueda suscribirse
    """
    from app.core.config import settings
    return {"publicKey": settings.VAPID_PUBLIC_KEY}

@router.post("/subscribe", response_model=dict, status_code=status.HTTP_201_CREATED)
def suscribirse_a_push(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Suscribe al usuario actual a notificaciones push
    
    - **subscription**: Información de suscripción del navegador
    - **user_agent**: User agent del navegador (opcional)
    """
    try:
        suscripcion = push_service.crear_suscripcion(
            db=db,
            usuario_id=usuario.id,
            endpoint=data.subscription.endpoint,
            p256dh_key=data.subscription.keys.p256dh,
            auth_key=data.subscription.keys.auth,
            user_agent=data.user_agent
        )
        
        return {
            "message": "Suscripción creada exitosamente",
            "subscription_id": suscripcion.id,
            "usuario_id": usuario.id
        }
        
    except Exception as e:
        logger.error(f"Error en suscripción push: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear suscripción: {str(e)}"
        )

@router.post("/unsubscribe", response_model=dict)
def desuscribirse_de_push(
    data: PushSubscriptionUnsubscribe,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Elimina una suscripción push del usuario actual
    
    - **endpoint**: URL del endpoint a eliminar
    """
    try:
        eliminado = push_service.eliminar_suscripcion(db, data.endpoint)
        
        if eliminado:
            return {
                "message": "Suscripción eliminada exitosamente",
                "endpoint": data.endpoint[:50] + "..."
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suscripción no encontrada"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando suscripción: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar suscripción: {str(e)}"
        )

@router.get("/subscriptions", response_model=List[PushSubscriptionDB])
def obtener_mis_suscripciones(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Obtiene todas las suscripciones push del usuario actual
    """
    try:
        suscripciones = push_service.obtener_suscripciones_usuario(db, usuario.id)
        return suscripciones
        
    except Exception as e:
        logger.error(f"Error obteniendo suscripciones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener suscripciones: {str(e)}"
        )

@router.post("/send", response_model=dict)
def enviar_notificacion_push(
    data: PushNotificationSend,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Envía una notificación push a usuarios específicos
    Solo admins pueden usar este endpoint
    
    - **usuario_ids**: Lista de IDs de usuarios a notificar
    - **payload**: Datos de la notificación
    - **residencial_id**: ID del residencial (para validación)
    """
    # Validar que el usuario sea admin
    if usuario.rol not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden enviar notificaciones push"
        )
    
    try:
        # Si es admin (no super_admin), validar que pertenezca al residencial
        residencial_id = data.residencial_id
        if usuario.rol == "admin" and residencial_id:
            if usuario.residencial_id != residencial_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para enviar notificaciones a este residencial"
                )
        
        # Enviar notificaciones
        resultado = push_service.enviar_push_a_usuarios(
            db=db,
            usuario_ids=data.usuario_ids,
            payload=data.payload.model_dump(),
            residencial_id=residencial_id
        )
        
        return {
            "message": "Notificaciones enviadas",
            "resultado": resultado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando notificaciones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar notificaciones: {str(e)}"
        )

@router.post("/test", response_model=dict)
def probar_notificacion_push(
    payload: PushNotificationPayload,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Envía una notificación push de prueba al usuario actual
    Útil para testing en desarrollo
    
    - **payload**: Datos de la notificación de prueba
    """
    try:
        resultado = push_service.enviar_push_a_usuario(
            db=db,
            usuario_id=usuario.id,
            payload=payload.model_dump()
        )
        
        if resultado["enviados"] == 0:
            return {
                "message": "No tienes suscripciones push activas",
                "resultado": resultado
            }
        
        return {
            "message": "Notificación de prueba enviada",
            "resultado": resultado
        }
        
    except Exception as e:
        logger.error(f"Error en notificación de prueba: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar notificación de prueba: {str(e)}"
        )

@router.post("/notify-role/{rol}", response_model=dict)
def notificar_por_rol(
    rol: str,
    payload: PushNotificationPayload,
    residencial_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Envía notificación push a todos los usuarios de un rol en un residencial
    Solo admins pueden usar este endpoint
    
    - **rol**: Rol de los usuarios (admin, guardia, residente)
    - **payload**: Datos de la notificación
    - **residencial_id**: ID del residencial
    """
    # Validar que el usuario sea admin
    if usuario.rol not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden enviar notificaciones"
        )
    
    # Validar rol
    if rol not in ["admin", "guardia", "residente"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Debe ser: admin, guardia o residente"
        )
    
    # Si es admin (no super_admin), validar que pertenezca al residencial
    if usuario.rol == "admin" and usuario.residencial_id != residencial_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para enviar notificaciones a este residencial"
        )
    
    try:
        resultado = push_service.notificar_por_rol(
            db=db,
            rol=rol,
            residencial_id=residencial_id,
            payload=payload.model_dump()
        )
        
        return {
            "message": f"Notificaciones enviadas a {rol}s del residencial {residencial_id}",
            "resultado": resultado
        }
        
    except Exception as e:
        logger.error(f"Error notificando por rol: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar notificaciones: {str(e)}"
        )
