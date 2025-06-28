from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    visita_id = Column(Integer, ForeignKey("visitas.id"), nullable=False)
    mensaje = Column(String, nullable=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow)
    estado = Column(String(30), nullable=False, default="pendiente")

    visita = relationship("Visita", back_populates="notificaciones")