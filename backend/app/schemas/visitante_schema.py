from pydantic import BaseModel, validator
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

    @validator("placa_vehiculo", pre=True, always=True)
    def default_placa(cls, v):
        if not v or v.strip() == "":
            return "sin placa"
        return v

class VisitanteResponse(VisitanteCreate):
    id: int
    class Config:
        orm_mode = True
