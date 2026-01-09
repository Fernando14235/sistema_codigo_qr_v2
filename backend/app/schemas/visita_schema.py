from pydantic import BaseModel, Field, validator, field_validator
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
    placa_vehiculo: Optional[str] = Field(None, description="Placa del vehículo")

    @validator("dni_visitante", pre=True, always=True)
    def default_dni_visitante(cls, v):
        if not v or v.strip() == "":
            return "no agregado"
        return v
    
    @validator("telefono_visitante", pre=True, always=True)
    def default_telefono_visitante(cls, v):
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
    def default_placa_vehiculo(cls, v):
        if not v or v.strip() == "":
            return "sin placa"
        return v

class VisitaCreate(BaseModel):
    visitantes: List[VisitanteCreate]
    notas: str = Field(..., alias="motivo")
    fecha_entrada: Optional[datetime] = None
    acompanantes: Optional[List[str]] = None

    @validator("fecha_entrada", pre=True)
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
    qr_url: Optional[str] = None

    class Config:
        from_attributes = True

class AccionQR(str, Enum):
    aceptar = "aprobar"
    rechazar = "rechazar"

class ValidarQRRequest(BaseModel):
    qr_code: str = Field(..., min_length=1, description="Código QR escaneado")
    accion: Optional[AccionQR] = Field(None, description="Acción a realizar (aceptar/rechazar)")
    
    @validator('qr_code', pre=True)
    def validate_qr_code(cls, v):
        if v is None:
            raise ValueError('qr_code no puede ser None')
        if not isinstance(v, str):
            raise ValueError('qr_code debe ser una cadena de texto')
        if not v.strip():
            raise ValueError('qr_code no puede estar vacío')
        return v.strip()
    
    class Config:
        use_enum_values = True

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
    placa_chasis: Optional[str] = None
    destino_visita: Optional[str] = None

class HistorialVisitaResponse(BaseModel):
    visitas: List[HistorialVisitaItem]

class VisitaImagenSchema(BaseModel):
    url: str
    tipo: Optional[str] = None

    class Config:
        from_attributes = True

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
    qr_url: Optional[str] = None
    observacion_entrada: Optional[str] = None
    observacion_salida: Optional[str] = None
    imagenes: List[VisitaImagenSchema] = []

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
    page: int = 1
    limit: int = 15
    total_pages: int = 1
    
class HistorialEscaneosTotalesResponse(BaseModel):
    escaneos: List[EscaneoDiaItem]
    total_escaneos: int
    fecha_consulta: datetime
    page: int = 1
    limit: int = 15
    total_pages: int = 1

class VisitaUpdate(BaseModel):
    fecha_entrada: Optional[datetime] = None
    notas: Optional[str] = None
    acompanantes: Optional[List[str]] = None
    visitante: Optional[VisitanteCreate] = None

    @validator("fecha_entrada", pre=True)
    def parse_fecha_entrada(cls, v):
        if v == "" or v is None:
            return None
        return v