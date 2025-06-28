from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Guardia(Base):
    __tablename__ = "guardias"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)  # Añadí ondelete
    telefono = Column(String, nullable=False)
    
    usuario = relationship("Usuario", back_populates="guardia")
    visitas = relationship("Visita", back_populates="guardia")
    escaneos = relationship("EscaneoQR", back_populates="guardia")