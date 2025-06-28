from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class NotificacionBase(BaseModel):
    mensaje: str
    estado: Optional[str] = "pendiente"

class NotificacionCreate(NotificacionBase):
    visita_id: int

class NotificacionDB(NotificacionBase):
    id: int
    visita_id: int
    fecha_envio: datetime

    class Config:
        orm_mode = True