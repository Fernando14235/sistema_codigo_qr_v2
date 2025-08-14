from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VistaResidencialBase(BaseModel):
    residencial_id: int
    vista_id: int
    activa: bool = True

class VistaResidencialCreate(VistaResidencialBase):
    pass

class VistaResidencialUpdate(BaseModel):
    activa: Optional[bool] = None

class VistaResidencialResponse(VistaResidencialBase):
    id: int

    class Config:
        from_attributes = True

class VistaResidencialListResponse(BaseModel):
    id: int
    residencial_id: int
    vista_id: int
    nombre_vista: str
    descripcion_vista: Optional[str] = None
    activa: bool

    class Config:
        from_attributes = True