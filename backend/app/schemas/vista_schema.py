from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VistaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class VistaCreate(VistaBase):
    pass

class VistaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class VistaResponse(VistaBase):
    id: int

    class Config:
        from_attributes = True

class VistaListResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True