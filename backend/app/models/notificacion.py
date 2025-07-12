from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time

class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    visita_id = Column(Integer, ForeignKey("visitas.id", ondelete="CASCADE"), nullable=False)
    mensaje = Column(String(1000), nullable=True)
    fecha_envio = Column(DateTime(timezone=True), default=get_current_time)
    estado = Column(String(30), nullable=False, default="pendiente")

    visita = relationship("Visita", back_populates="notificaciones", passive_deletes=True)

    __table_args__ = (
        CheckConstraint(
            estado.in_(['enviado', 'fallido', 'pendiente']),
            name='check_estado_notificacion'
        ),
    )