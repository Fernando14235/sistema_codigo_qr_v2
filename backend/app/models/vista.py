from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Vista(Base):
    __tablename__ = "vistas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=True)
    
    # Relaciones
    vistas_residencial = relationship("VistaResidencial", back_populates="vista", cascade="all, delete-orphan")
    vistas_admin = relationship("VistaAdmin", back_populates="vista", cascade="all, delete-orphan")