from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.time import get_current_time
import enum

class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    validado = "validado"
    rechazado = "rechazado"

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    residente_id = Column(Integer, ForeignKey("residentes.id", ondelete="CASCADE"), nullable=False)
    mes_pago = Column(String(15), nullable=False)  # ej: "Julio 2025"
    monto = Column(Numeric(10, 2), nullable=False)
    comprobante_url = Column(Text, nullable=True)
    estado = Column(String(20), nullable=False, default=EstadoPago.pendiente)
    observacion = Column(Text, nullable=True)
    fecha_subida = Column(DateTime(timezone=True), default=get_current_time)
    fecha_validacion = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    residente = relationship("Residente", back_populates="pagos")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            estado.in_(['pendiente', 'validado', 'rechazado']),
            name='check_estado_pago'
        ),
    ) 