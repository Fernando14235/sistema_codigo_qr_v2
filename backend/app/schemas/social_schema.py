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
        orm_mode = True

class SocialDestinatarioBase(BaseModel):
    residente_id: int = Field(..., example=1)

class SocialDestinatarioCreate(SocialDestinatarioBase):
    residente_id: int = Field(..., example=1)

class SocialDestinatarioResponse(SocialDestinatarioBase):
    id: int
    class Config:
        orm_mode = True

class SocialBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    contenido: str = Field(..., min_length=1)
    tipo_publicacion: str = Field(..., regex="^(publicacion|comunicado|encuesta)$")
    requiere_respuesta: Optional[bool] = False
    para_todos: Optional[bool] = False

class SocialCreate(SocialBase):
    imagenes: Optional[List[SocialImagenCreate]] = []
    destinatarios: Optional[List[SocialDestinatarioCreate]] = []

class SocialResponse(SocialBase):
    id: int
    admin_id: int
    estado: str = Field(..., regex="^(publicado|fallido|archivado)$")
    fecha_creacion: datetime
    imagenes: List[SocialImagenResponse] = []
    destinatarios: List[SocialDestinatarioResponse] = []

    class Config:
        orm_mode = True