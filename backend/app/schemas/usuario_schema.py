from pydantic import BaseModel, EmailStr, constr, root_validator
from typing import Optional
from datetime import datetime
from enum import Enum

class Rol(str, Enum):
    admin     = "admin"
    residente = "residente"
    guardia   = "guardia"

# class EstadoUsuario(str, Enum):
#     activo = "activo"
#     inactivo = "inactivo"
#     moroso = "moroso"

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Rol
    # estado: EstadoUsuario = EstadoUsuario.activo  # Comentado temporalmente
    unidad_residencial: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: constr(min_length=6)
    telefono: str 
    
    @root_validator
    def validar_unidad_residencial(cls, values):
        rol = values.get('rol')
        unidad = values.get('unidad_residencial')
        if rol == 'residente':
            if not unidad or not isinstance(unidad, str) or unidad.strip() == "":
                raise ValueError('unidad_residencial es obligatoria y debe ser un texto no vacío si el rol es residente')
        return values

class Usuario(UsuarioBase):
    id: int
    telefono: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    ult_conexion: Optional[datetime] = None
    
    class Config:
        orm_mode = True