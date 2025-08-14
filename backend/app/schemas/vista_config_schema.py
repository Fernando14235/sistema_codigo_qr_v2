from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class VistaConfigItem(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    activa: bool

class VistaResidencialConfig(BaseModel):
    residencial_id: int
    nombre_residencial: str
    vistas: List[VistaConfigItem]

class VistaAdminConfig(BaseModel):
    admin_id: int
    nombre_admin: str
    vistas: List[VistaConfigItem]

class VistaConfigResponse(BaseModel):
    vistas_disponibles: List[VistaConfigItem]
    vistas_residencial: Optional[VistaResidencialConfig] = None
    vistas_admin: Optional[VistaAdminConfig] = None