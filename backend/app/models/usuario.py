from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index, CheckConstraint, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from app.utils.time import get_current_time
from app.models.super_admin import SuperAdmin
import enum

class Rol(str, enum.Enum):
    super_admin = "super_admin"
    admin       = "admin"
    residente   = "residente"
    guardia     = "guardia"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    residencial_id = Column(Integer, ForeignKey("residenciales.id"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    fecha_actualizacion = Column(DateTime(timezone=True), default=get_current_time, onupdate=get_current_time)
    ult_conexion = Column(DateTime(timezone=True), nullable=True)
    
    # relaciones con otras tablas
    residencial = relationship("Residencial", back_populates="usuarios")
    guardia = relationship("Guardia", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    residente = relationship("Residente", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    admin = relationship("Administrador", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    super_admin = relationship("SuperAdmin", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="usuario", cascade="all, delete-orphan")