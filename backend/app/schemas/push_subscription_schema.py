from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PushSubscriptionKeys(BaseModel):
    """Claves de suscripción push del navegador"""
    p256dh: str = Field(..., description="Clave pública P256DH")
    auth: str = Field(..., description="Clave de autenticación")

class PushSubscriptionInfo(BaseModel):
    """Información de suscripción push del navegador"""
    endpoint: str = Field(..., description="URL del endpoint de push")
    keys: PushSubscriptionKeys

class PushSubscriptionCreate(BaseModel):
    """Schema para crear una suscripción push"""
    subscription: PushSubscriptionInfo
    user_agent: Optional[str] = Field(None, max_length=500, description="User agent del navegador")

class PushSubscriptionDB(BaseModel):
    """Schema de suscripción push en base de datos"""
    id: int
    usuario_id: int
    endpoint: str
    p256dh_key: str
    auth_key: str
    user_agent: Optional[str]
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class PushSubscriptionUnsubscribe(BaseModel):
    """Schema para desuscribirse de notificaciones push"""
    endpoint: str = Field(..., description="URL del endpoint a eliminar")

class PushNotificationPayload(BaseModel):
    """Payload de notificación push a enviar"""
    title: str = Field(..., max_length=100, description="Título de la notificación")
    body: str = Field(..., max_length=500, description="Cuerpo de la notificación")
    icon: Optional[str] = Field(None, description="URL del icono")
    badge: Optional[str] = Field(None, description="URL del badge")
    data: Optional[dict] = Field(default_factory=dict, description="Datos adicionales")
    actions: Optional[list] = Field(default_factory=list, description="Acciones de la notificación")
    tag: Optional[str] = Field(None, description="Tag para agrupar notificaciones")
    requireInteraction: Optional[bool] = Field(False, description="Requiere interacción del usuario")

class PushNotificationSend(BaseModel):
    """Schema para enviar notificación push a usuarios específicos"""
    usuario_ids: list[int] = Field(..., description="IDs de usuarios a notificar")
    payload: PushNotificationPayload
    residencial_id: Optional[int] = Field(None, description="ID del residencial (para validación)")
