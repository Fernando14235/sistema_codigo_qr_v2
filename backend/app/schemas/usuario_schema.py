from pydantic import BaseModel, EmailStr, constr, model_validator
from typing import Optional
from datetime import datetime
from enum import Enum

class Rol(str, Enum):
    super_admin = "super_admin"
    admin       = "admin"
    residente   = "residente"
    guardia     = "guardia"

# class EstadoUsuario(str, Enum):
#     activo = "activo"
#     inactivo = "inactivo"
#     moroso = "moroso"

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Rol
    unidad_residencial: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: constr(min_length=6)
    telefono: str 
    
    @model_validator(mode='after')
    def validar_unidad_residencial(self):
        if self.rol == 'residente':
            if not self.unidad_residencial or not isinstance(self.unidad_residencial, str) or self.unidad_residencial.strip() == "":
                raise ValueError('unidad_residencial es obligatoria y debe ser un texto no vacío si el rol es residente')
        return self

class Usuario(UsuarioBase):
    id: int
    telefono: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    ult_conexion: Optional[datetime] = None
    residencial_id: Optional[int] = None  # Solo para la respuesta
    
    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[Rol] = None
    unidad_residencial: Optional[str] = None
    password: Optional[constr(min_length=6)] = None
    telefono: Optional[str] = None