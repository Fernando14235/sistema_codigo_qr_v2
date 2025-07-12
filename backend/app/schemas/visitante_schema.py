from pydantic import BaseModel, field_validator
from typing import Optional

class VisitanteCreate(BaseModel):
    nombre_conductor: str
    dni_conductor: str
    telefono: Optional[str] = None
    tipo_vehiculo: Optional[str] = None
    placa_vehiculo: Optional[str] = None
    motivo_visita: Optional[str] = None

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
