from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class VistaResidencial(Base):
    __tablename__ = "vistas_residencial"

    id = Column(Integer, primary_key=True, index=True)
    residencial_id = Column(Integer, ForeignKey("residenciales.id", ondelete="CASCADE"), nullable=False)
    vista_id = Column(Integer, ForeignKey("vistas.id", ondelete="CASCADE"), nullable=False)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    residencial = relationship("Residencial", back_populates="vistas_residencial")
    vista = relationship("Vista", back_populates="vistas_residencial")