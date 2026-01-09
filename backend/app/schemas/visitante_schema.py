from pydantic import BaseModel, field_validator, validator
from typing import Optional

class VisitanteCreate(BaseModel):
    nombre_conductor: str
    dni_conductor: str
    telefono: Optional[str] = None
    tipo_vehiculo: str
    placa_vehiculo: Optional[str] = None  # Cambiado a Optional
    marca_vehiculo: Optional[str] = None   # Nuevo campo
    color_vehiculo: Optional[str] = None   # Nuevo campo
    placa_chasis: Optional[str] = None    # Nuevo campo
    motivo_visita: str
    destino_visita: Optional[str] = None  # Nuevo campo

    @validator("dni_conductor", pre=True, always=True)
    def default_dni(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v

    @validator("telefono", pre=True, always=True)
    def default_telefono(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v

    @validator("tipo_vehiculo", pre=True, always=True)
    def default_tipo_vehiculo(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v

    @validator("marca_vehiculo", pre=True, always=True)
    def default_marca_vehiculo(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v

    @validator("color_vehiculo", pre=True, always=True)
    def default_color_vehiculo(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v

    @validator("placa_vehiculo", pre=True, always=True)
    def default_placa(cls, v):
        if not v or v.strip() == "":
            return "sin placa"
        return v

class VisitanteResponse(VisitanteCreate):
    id: int
    class Config:
        from_attributes = True