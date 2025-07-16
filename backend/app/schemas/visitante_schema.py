from pydantic import BaseModel, field_validator
from typing import Optional

class VisitanteCreate(BaseModel):
    nombre_conductor: str
    dni_conductor: str
    telefono: Optional[str] = None
    tipo_vehiculo: str
    placa_vehiculo: Optional[str] = None  # Cambiado a Optional
    marca_vehiculo: Optional[str] = None   # Nuevo campo
    color_vehiculo: Optional[str] = None   # Nuevo campo
    motivo_visita: str

    @field_validator("placa_vehiculo", mode='before')
    @classmethod
    def default_placa(cls, v):
        if not v or v.strip() == "":
            return "sin placa"
        return v

class VisitanteResponse(VisitanteCreate):
    id: int
    class Config:
        from_attributes = True
