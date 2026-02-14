from pydantic import BaseModel, EmailStr, constr, model_validator, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum

class Rol(str, Enum):
    super_admin = "super_admin"
    admin       = "admin"
    residente   = "residente"
    guardia     = "guardia"

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Rol
    unidad_residencial: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: constr(min_length=6)
    telefono: str 
    residencial_id: int
    
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

class UsuarioCreateAdmin(BaseModel):
    """Schema para crear usuarios desde admin - residencial_id se obtiene automáticamente del admin"""
    nombre: str
    email: EmailStr
    rol: Rol
    password: constr(min_length=6)
    telefono: str
    unidad_residencial: Optional[str] = None
    
    @model_validator(mode='after')
    def validar_unidad_residencial(self):
        if self.rol == 'residente':
            if not self.unidad_residencial or not isinstance(self.unidad_residencial, str) or self.unidad_residencial.strip() == "":
                raise ValueError('unidad_residencial es obligatoria y debe ser un texto no vacío si el rol es residente')
        return self

class UsuarioCreateSuperAdmin(BaseModel):
    """Schema para crear usuarios desde super admin - residencial_id se toma de la URL"""
    nombre: str
    email: EmailStr
    rol: Rol
    password: constr(min_length=6)
    telefono: str
    unidad_residencial: Optional[str] = None
    
    @model_validator(mode='after')
    def validar_unidad_residencial(self):
        if self.rol == 'residente':
            if not self.unidad_residencial or not isinstance(self.unidad_residencial, str) or self.unidad_residencial.strip() == "":
                raise ValueError('unidad_residencial es obligatoria y debe ser un texto no vacío si el rol es residente')
        return self

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[Rol] = None
    unidad_residencial: Optional[str] = None
    password: Optional[str] = None
    telefono: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        # Si viene vacío, lo convertimos en None (no actualizar password)
        if v == "":
            return None
        
        if v is not None and len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v