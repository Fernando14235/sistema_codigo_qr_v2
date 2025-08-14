from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class Residencial(Base):
    __tablename__ = "residenciales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    
    # Relaciones con otras tablas
    usuarios = relationship("Usuario", back_populates="residencial")
    administradores = relationship("Administrador", back_populates="residencial")
    residentes = relationship("Residente", back_populates="residencial")
    guardias = relationship("Guardia", back_populates="residencial")
    vistas_residencial = relationship("VistaResidencial", back_populates="residencial", cascade="all, delete-orphan")