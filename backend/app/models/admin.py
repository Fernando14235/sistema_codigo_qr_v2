from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    residencial_id = Column(Integer, ForeignKey("residenciales.id"), nullable=True)
    telefono = Column(String(25), nullable=True)
    unidad_residencial = Column(String(100), nullable=True)
    
    usuario = relationship("Usuario", back_populates="admin")
    residencial = relationship("Residencial", back_populates="administradores")
    visitas = relationship("Visita", back_populates="admin")
    vistas_admin = relationship("VistaAdmin", back_populates="admin", cascade="all, delete-orphan")