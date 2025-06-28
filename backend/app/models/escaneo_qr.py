from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.database import Base

class EscaneoQR(Base):
    __tablename__ = "escaneos_qr"

    id = Column(Integer, primary_key=True, index=True)
    visita_id = Column(Integer, ForeignKey("visitas.id", ondelete="CASCADE"), nullable=False)
    guardia_id = Column(Integer, ForeignKey("guardias.id", ondelete="CASCADE"), nullable=False)
    dispositivo = Column(String)
    fecha_escaneo = Column(DateTime, default=func.now())
    
    visita  = relationship("Visita",  back_populates="escaneos")
    guardia = relationship("Guardia", back_populates="escaneos")