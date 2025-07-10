from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from app.utils.time import get_current_time
import enum

class Rol(str, enum.Enum):
    admin     = "admin"
    residente = "residente"
    guardia   = "guardia"

# class EstadoUsuario(str, enum.Enum):
#     activo = "activo"
#     inactivo = "inactivo"
#     moroso = "moroso"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    #estado = Column(String(20), nullable=False, default=EstadoUsuario.activo)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    fecha_actualizacion = Column(DateTime(timezone=True), default=get_current_time, onupdate=get_current_time)
    ult_conexion = Column(DateTime(timezone=True), nullable=True)
    
    # relaciones con otras tablas
    guardia = relationship("Guardia", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    residente = relationship("Residente", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    admin = relationship("Administrador", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    # Constraints
    # __table_args__ = (
    #     CheckConstraint(
    #         estado.in_(['activo', 'inactivo', 'moroso']),
    #         name='check_estado_usuario'
    #     ),
    # )