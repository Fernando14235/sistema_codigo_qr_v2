from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class EscaneoQR(Base):
    __tablename__ = "escaneos_qr"

    id = Column(Integer, primary_key=True, index=True)
    visita_id = Column(Integer, ForeignKey("visitas.id", ondelete="CASCADE"), nullable=False)
    guardia_id = Column(Integer, ForeignKey("guardias.id", ondelete="CASCADE"), nullable=False)
    dispositivo = Column(String)
    fecha_escaneo = Column(DateTime(timezone=True), default=get_current_time)
    
    visita  = relationship("Visita",  back_populates="escaneos")
    guardia = relationship("Guardia", back_populates="escaneos")