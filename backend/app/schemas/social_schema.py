from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SocialImagenBase(BaseModel):
    imagen_url: str = Field(..., example="/uploads/ejemplo.png")

class SocialImagenCreate(SocialImagenBase):
    imagen_url: str = Field(..., example="/uploads/ejemplo.png")

class SocialImagenResponse(SocialImagenBase):
    id: int
    class Config:
        from_attributes = True

class SocialDestinatarioBase(BaseModel):
    residente_id: int = Field(..., example=1)

class SocialDestinatarioCreate(SocialDestinatarioBase):
    residente_id: int = Field(..., example=1)

class SocialDestinatarioResponse(SocialDestinatarioBase):
    id: int
    class Config:
        from_attributes = True

class SocialBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    contenido: str = Field(..., min_length=1)
    tipo_publicacion: str = Field(..., pattern="^(publicacion|comunicado|encuesta)$")
    requiere_respuesta: Optional[bool] = False
    para_todos: Optional[bool] = False

# Schemas para opciones de encuesta
class SocialOpcionBase(BaseModel):
    texto: str = Field(..., min_length=1, max_length=200)

class SocialOpcionCreate(SocialOpcionBase):
    social_id: Optional[int] = None  # Solo necesario si se usa para crear directamente, no desde SocialCreate

class SocialCreate(SocialBase):
    imagenes: Optional[List[SocialImagenCreate]] = []
    destinatarios: Optional[List[SocialDestinatarioCreate]] = None
    opciones: Optional[List[SocialOpcionCreate]] = None


class SocialOpcionResponse(SocialOpcionBase):
    id: int
    social_id: int
    class Config:
        from_attributes = True

# Votos de encuesta
class SocialVotoBase(BaseModel):
    opcion_id: int

class SocialVotoCreate(SocialVotoBase):
    pass

class SocialVotoResponse(SocialVotoBase):
    id: int
    residente_id: int
    fecha_voto: datetime
    class Config:
        from_attributes = True

class SocialResponse(SocialBase):
    id: int
    admin_id: int
    residencial_id: int
    estado: str = Field(..., pattern="^(publicado|fallido|archivado)$")
    fecha_creacion: datetime
    imagenes: List[SocialImagenResponse] = []
    destinatarios: List[SocialDestinatarioResponse] = []
    opciones: List[SocialOpcionResponse] = []  # Opciones de encuesta
    votos: Optional[List[SocialVotoResponse]] = []  # Solo para encuestas, opcional

    class Config:
        from_attributes = True