from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum

class EstadoTicket(str, Enum):
    pendiente = "pendiente"
    en_proceso = "en_proceso"
    resuelto = "resuelto"
    rechazado = "rechazado"

class TicketBase(BaseModel):
    titulo: str
    descripcion: str
    imagen_url: Optional[str] = None

    @field_validator('titulo')
    @classmethod
    def validar_titulo(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El título no puede estar vacío')
        if len(v) > 150:
            raise ValueError('El título no puede tener más de 150 caracteres')
        return v.strip()

    @field_validator('descripcion')
    @classmethod
    def validar_descripcion(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('La descripción no puede estar vacía')
        return v.strip()

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[EstadoTicket] = None
    respuesta_admin: Optional[str] = None
    imagen_url: Optional[str] = None

    @field_validator('titulo')
    @classmethod
    def validar_titulo(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('El título no puede estar vacío')
            if len(v) > 150:
                raise ValueError('El título no puede tener más de 150 caracteres')
            return v.strip()
        return v

    @field_validator('descripcion')
    @classmethod
    def validar_descripcion(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('La descripción no puede estar vacía')
            return v.strip()
        return v

class TicketResponse(TicketBase):
    id: int
    residente_id: int
    nombre_residente: Optional[str] = None
    unidad_residencial: Optional[str] = None
    telefono: Optional[str] = None
    estado: EstadoTicket
    respuesta_admin: Optional[str] = None
    fecha_creacion: datetime
    fecha_respuesta: Optional[datetime] = None

    class Config:
        from_attributes = True

class TicketListResponse(BaseModel):
    id: int
    nombre_residente: Optional[str] = None
    titulo: str
    unidad_residencial: Optional[str] = None
    telefono: Optional[str] = None
    estado: EstadoTicket
    fecha_creacion: datetime
    fecha_respuesta: Optional[datetime] = None
    imagen_url: Optional[str] = None

    class Config:
        from_attributes = True