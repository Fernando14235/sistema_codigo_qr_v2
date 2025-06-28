from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum

class Rol(str, enum.Enum):
    admin     = "admin"
    residente = "residente"
    guardia   = "guardia"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # relaciones con otras tablas
    guardia = relationship("Guardia", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    residente = relationship("Residente", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    admin = relationship("Administrador", back_populates="usuario", uselist=False, cascade="all, delete-orphan")