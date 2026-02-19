from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResidencialBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None

class ResidencialCreate(ResidencialBase):
    tipo_entidad: Optional[str] = "residencial"

class ResidencialUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None

class ResidencialResponse(ResidencialBase):
    id: int
    fecha_creacion: datetime
    tipo_entidad: str

    class Config:
        from_attributes = True

class ResidencialListResponse(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None
    activa: bool
    tipo_entidad: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True 