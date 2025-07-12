from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from decimal import Decimal

class EstadoPago(str, Enum):
    pendiente = "pendiente"
    validado = "validado"
    rechazado = "rechazado"

class PagoBase(BaseModel):
    mes_pago: str
    monto: Decimal
    comprobante_url: Optional[str] = None

    @field_validator('mes_pago')
    @classmethod
    def validar_mes_pago(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El mes de pago no puede estar vacío')
        if len(v) > 15:
            raise ValueError('El mes de pago no puede tener más de 15 caracteres')
        return v.strip()

    @field_validator('monto')
    @classmethod
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return v

class PagoCreate(PagoBase):
    pass

class PagoUpdate(BaseModel):
    mes_pago: Optional[str] = None
    monto: Optional[Decimal] = None
    comprobante_url: Optional[str] = None
    estado: Optional[EstadoPago] = None
    observacion: Optional[str] = None

    @field_validator('mes_pago')
    @classmethod
    def validar_mes_pago(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('El mes de pago no puede estar vacío')
            if len(v) > 15:
                raise ValueError('El mes de pago no puede tener más de 15 caracteres')
            return v.strip()
        return v

    @field_validator('monto')
    @classmethod
    def validar_monto(cls, v):
        if v is not None and v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return v

class PagoResponse(PagoBase):
    id: int
    residente_id: int
    estado: EstadoPago
    observacion: Optional[str] = None
    fecha_subida: datetime
    fecha_validacion: Optional[datetime] = None

    class Config:
        from_attributes = True

class PagoListResponse(BaseModel):
    id: int
    mes_pago: str
    monto: Decimal
    estado: EstadoPago
    fecha_subida: datetime
    fecha_validacion: Optional[datetime] = None

    class Config:
        from_attributes = True 