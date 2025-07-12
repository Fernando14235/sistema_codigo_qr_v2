from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SuperAdminBase(BaseModel):
    telefono: Optional[str] = None

class SuperAdminCreate(SuperAdminBase):
    pass

class SuperAdminUpdate(BaseModel):
    telefono: Optional[str] = None

class SuperAdminResponse(SuperAdminBase):
    id: int
    usuario_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class SuperAdminListResponse(BaseModel):
    id: int
    usuario_id: int
    nombre_usuario: str
    email_usuario: str
    telefono: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True 