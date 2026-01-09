from app.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index, CheckConstraint, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

class VisitaImagen(Base):
    __tablename__ = "visita_imagenes"

    id = Column(Integer, primary_key=True, index=True)
    visita_id = Column(Integer, ForeignKey("visitas.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    tipo = Column(Enum("entrada", "salida", name="tipo_imagen_visita"), nullable=True)

    visita = relationship("Visita", back_populates="imagenes_rel")