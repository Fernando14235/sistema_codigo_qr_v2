from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time
import enum

class EstadoTicket(str, enum.Enum):
    pendiente = "pendiente"
    en_proceso = "en_proceso"
    resuelto = "resuelto"
    rechazado = "rechazado"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    imagen_url = Column(Text, nullable=True)
    estado = Column(String(20), nullable=False, default=EstadoTicket.pendiente)
    respuesta_admin = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=get_current_time)
    fecha_respuesta = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    residente = relationship("Residente", back_populates="tickets")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            estado.in_(['pendiente', 'en_proceso', 'resuelto', 'rechazado']),
            name='check_estado_ticket'
        ),
    ) 