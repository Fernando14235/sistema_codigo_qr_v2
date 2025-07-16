from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from .visitante_schema import VisitanteResponse, VisitanteCreate
from enum import Enum
from typing import List

class SolicitudVisitaCreate(BaseModel):
    nombre_visitante: str = Field(..., description="Nombre del visitante")
    dni_visitante: Optional[str] = Field(None, description="DNI del visitante")
    telefono_visitante: Optional[str] = Field(None, description="Teléfono del visitante")
    fecha_entrada: datetime = Field(..., description="Fecha y hora de entrada")
    motivo_visita: str = Field(..., description="Motivo de la visita")
    tipo_vehiculo: str = Field(..., description="Tipo de vehículo")
    marca_vehiculo: Optional[str] = Field(None, description="Marca del vehículo")
    color_vehiculo: Optional[str] = Field(None, description="Color del vehículo")
    placa_vehiculo: Optional[str] = Field("sin placa", description="Placa del vehículo")

    @field_validator("dni_visitante", mode='before')
    @classmethod
    def set_dni_default(cls, v):
        return v if v and v.strip() else "No agregado"
    
    @field_validator("telefono_visitante", mode='before')
    @classmethod
    def set_telefono_default(cls, v):
        return v if v and v.strip() else "No agregado"

class VisitaCreate(BaseModel):
    visitantes: List[VisitanteCreate]
    notas: str = Field(..., alias="motivo")
    fecha_entrada: Optional[datetime] = None
    acompanantes: Optional[List[str]] = None

    @field_validator("fecha_entrada", mode='before')
    @classmethod
    def parse_fecha_entrada(cls, v):
        if v == "" or v is None:
            return None
        return v

class VisitaQRResponse(BaseModel):
    id: int
    residente_id: Optional[int] = None
    admin_id: Optional[int] = None
    guardia_id: Optional[int] = None
    visitante: VisitanteResponse
    notas: Optional[str] = None
    fecha_entrada: datetime
    fecha_salida: Optional[datetime] = None
    estado: str
    qr_code: str
    qr_expiracion: datetime
    qr_code_img_base64: str
    tipo_creador: str

    class Config:
        from_attributes = True

class AccionQR(str, Enum):
    aceptar = "aprobar"
    rechazar = "rechazar"

class ValidarQRRequest(BaseModel):
    qr_code: str
    accion: Optional[AccionQR] = None

class HistorialVisitaItem(BaseModel):
    nombre_residente: str
    telefono_residente: str
    unidad_residencial: str
    fecha_entrada: datetime
    nombre_visitante: str
    tipo_vehiculo: str
    placa_vehiculo: str
    marca_vehiculo: Optional[str] = None
    color_vehiculo: Optional[str] = None
    motivo_visita: str
    fecha_salida: Optional[datetime] = None
    estado: str

class HistorialVisitaResponse(BaseModel):
    visitas: List[HistorialVisitaItem]

class VisitaResponse(BaseModel):
    id: int
    residente_id: Optional[int] = None
    admin_id: Optional[int] = None
    guardia_id: Optional[int] = None
    visitante: VisitanteResponse
    notas: Optional[str] = None
    fecha_entrada: datetime
    fecha_salida: Optional[datetime] = None
    estado: str
    expiracion: Optional[str] = None
    qr_code: str
    qr_expiracion: datetime
    qr_code_img_base64: Optional[str] = ""
    tipo_creador: str

    class Config:
        from_attributes = True

class RegistrarSalidaRequest(BaseModel):
    qr_code: str

class EscaneoDiaItem(BaseModel):
    id_escaneo: int
    fecha_escaneo: datetime
    dispositivo: str
    nombre_guardia: str
    nombre_visitante: str
    dni_visitante: str
    tipo_vehiculo: str
    placa_vehiculo: str
    motivo_visita: str
    nombre_residente: str
    unidad_residencial: str
    estado_visita: str
    tipo_escaneo: str 

    class Config:
        from_attributes = True

class HistorialEscaneosDiaResponse(BaseModel):
    escaneos: List[EscaneoDiaItem]
    total_escaneos: int
    fecha_consulta: datetime
    
class HistorialEscaneosTotalesResponse(BaseModel):
    escaneos: List[EscaneoDiaItem]
    total_escaneos: int
    fecha_consulta: datetime

class VisitaUpdate(BaseModel):
    fecha_entrada: Optional[datetime] = None
    notas: Optional[str] = None
    acompanantes: Optional[List[str]] = None
    visitante: Optional[VisitanteCreate] = None

    @field_validator("fecha_entrada", mode='before')
    @classmethod
    def parse_fecha_entrada(cls, v):
        if v == "" or v is None:
            return None
        return v