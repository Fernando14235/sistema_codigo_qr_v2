from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResidencialBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None

class ResidencialCreate(ResidencialBase):
    pass

class ResidencialUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None

class ResidencialResponse(ResidencialBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class ResidencialListResponse(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True 