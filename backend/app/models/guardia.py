from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Guardia(Base):
    __tablename__ = "guardias"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    residencial_id = Column(Integer, ForeignKey("residenciales.id"), nullable=True)
    telefono = Column(String(25), nullable=True)
    
    usuario = relationship("Usuario", back_populates="guardia")
    residencial = relationship("Residencial", back_populates="guardias")
    visitas = relationship("Visita", back_populates="guardia")
    escaneos = relationship("EscaneoQR", back_populates="guardia")