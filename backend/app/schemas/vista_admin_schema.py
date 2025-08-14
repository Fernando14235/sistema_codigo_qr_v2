from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VistaAdminBase(BaseModel):
    admin_id: int
    vista_id: int
    activa: bool = True

class VistaAdminCreate(VistaAdminBase):
    pass

class VistaAdminUpdate(BaseModel):
    activa: Optional[bool] = None

class VistaAdminResponse(VistaAdminBase):
    id: int

    class Config:
        from_attributes = True

class VistaAdminListResponse(BaseModel):
    id: int
    admin_id: int
    vista_id: int
    nombre_vista: str
    descripcion_vista: Optional[str] = None
    activa: bool

    class Config:
        from_attributes = True